import { join } from 'node:path'
import { loadConfig } from '@atlas/config'
import { initTelemetry, shutdownTelemetry } from '@atlas/otel'
import { createDatabase, runMigrations, healthCheck as dbHealth } from '@atlas/db'
import { createRedis, healthCheck as redisHealth } from '@atlas/cache'
import { createEventBus } from '@atlas/events'
import { createProvider } from '@atlas/ai'
import { createGraphitiClient } from '@atlas/memory'
import { createToolRegistry } from '@atlas/tools'
import { createRuntime, type RuntimeServices } from '@atlas/core'
import { createSearchTool, createHttpTool, createReminderTool } from '@atlas/tools'
import { printConfig } from './banner'
import { createCliAdapter } from './cli-adapter'

const SIGNALS = ['SIGINT', 'SIGTERM'] as const
const MIGRATIONS_DIR = join(import.meta.dir, '../../../packages/db/migrations')

type ServiceRefs = {
  readonly eventBus: { readonly close: () => Promise<void> }
  readonly redis: { readonly quit: () => Promise<unknown> }
  readonly db: { readonly end: () => Promise<unknown> }
}

let shuttingDown = false

const prompt = (): void => {
  process.stdout.write('you> ')
}

const readLine = (): Promise<string> => {
  return new Promise((resolve) => {
    process.stdin.resume()
    process.stdin.once('data', (data) => {
      process.stdin.pause()
      resolve(data.toString().trim())
    })
  })
}

const checkHealth = async (name: string, check: () => Promise<boolean>): Promise<boolean> => {
  const ok = await check()
  const status = ok ? 'OK' : 'UNREACHABLE'
  const marker = ok ? '\x1b[32m' : '\x1b[31m'
  console.log(`  ${marker}${status}\x1b[0m  ${name}`)
  return ok
}

const shutdown = async (services: ServiceRefs): Promise<void> => {
  if (shuttingDown) return
  shuttingDown = true
  console.log('\nShutting down...')
  await services.eventBus.close()
  await services.redis.quit()
  await services.db.end()
  await shutdownTelemetry()
  process.exit(0)
}

const start = async (): Promise<void> => {
  const config = loadConfig()
  printConfig(config)

  initTelemetry(config.otel)

  console.log('Health checks:')
  const db = createDatabase(config.postgres)
  const redis = createRedis(config.redis)
  const memory = createGraphitiClient(config.graphiti)

  const [dbOk, redisOk, memoryOk] = await Promise.all([
    checkHealth('PostgreSQL', () => dbHealth(db)),
    checkHealth('Redis', () => redisHealth(redis)),
    checkHealth('Graphiti', () => memory.healthCheck()),
  ])

  if (!dbOk) {
    console.error('\nPostgreSQL is required. Start it with: bash compose.sh up -d')
    process.exit(1)
  }
  if (!redisOk) {
    console.error('\nRedis is required. Start it with: bash compose.sh up -d')
    process.exit(1)
  }
  if (!memoryOk) {
    console.warn('\n  WARNING: Graphiti is unreachable. Memory features will be degraded.')
  }

  console.log('\nRunning migrations...')
  const applied = await runMigrations(db, MIGRATIONS_DIR)
  if (applied.length > 0) {
    console.log(`  Applied ${applied.length} migration(s): ${applied.join(', ')}`)
  } else {
    console.log('  No pending migrations.')
  }

  const eventBus = await createEventBus({ db, redis })
  const aiProvider = createProvider(config.ai)
  const tools = createToolRegistry()

  tools.register(createSearchTool())
  tools.register(createHttpTool())
  tools.register(createReminderTool())

  const services: RuntimeServices = {
    eventBus,
    db,
    redis,
    memory,
    aiProvider,
    tools,
    queues: null,
    model: config.ai.model,
  }

  const runtime = createRuntime(services)
  const adapter = createCliAdapter()

  console.log('\nRuntime initialized. Type a message and press Enter. Ctrl+C to exit.\n')

  for (const sig of SIGNALS) {
    process.on(sig, () => {
      console.log(`\nReceived ${sig}`)
      void shutdown({ eventBus, redis, db })
    })
  }

  process.stdin.setEncoding('utf-8')
  prompt()

  while (true) {
    const input = await readLine()
    if (!input) {
      prompt()
      continue
    }
    if (input === 'exit' || input === 'quit') {
      break
    }

    try {
      const message = await adapter.normalizeInbound(input)
      const response = await runtime.handleMessage(message)
      await adapter.sendResponse({ text: response, blocks: null, threadId: null })
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error))
    }

    prompt()
  }

  await shutdown({ eventBus, redis, db })
}

start().catch((error) => {
  console.error('Fatal:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
