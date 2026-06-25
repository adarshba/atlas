import { loadConfig } from '@atlas/config'
import { initTelemetry, shutdownTelemetry } from '@atlas/otel'
import { createDatabase, runMigrations } from '@atlas/db'
import { createRedis } from '@atlas/cache'
import { createEventBus } from '@atlas/events'
import { createProvider } from '@atlas/ai'
import { createGraphitiClient } from '@atlas/memory'
import { createToolRegistry } from '@atlas/tools'
import { createRuntime, type RuntimeServices } from '@atlas/core'
import { createSearchTool, createHttpTool, createReminderTool } from '@atlas/tools'
import { printConfig } from './banner'
import { createCliAdapter } from './cli-adapter'

const SIGNALS = ['SIGINT', 'SIGTERM'] as const

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

const start = async (): Promise<void> => {
  const config = loadConfig()
  printConfig(config)

  initTelemetry(config.otel)

  const db = createDatabase(config.postgres)
  const redis = createRedis(config.redis)
  const eventBus = await createEventBus({ db, redis })
  const aiProvider = createProvider(config.ai)
  const memory = createGraphitiClient(config.graphiti)
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

  console.log('Runtime initialized. Type a message and press Enter. Ctrl+C to exit.\n')
  prompt()

  process.stdin.setEncoding('utf-8')

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

  console.log('\nShutting down...')
  await eventBus.close()
  await redis.quit()
  await db.end()
  await shutdownTelemetry()
  process.exit(0)
}

for (const sig of SIGNALS) {
  process.on(sig, () => {
    console.log(`\nReceived ${sig}`)
    process.exit(0)
  })
}

start().catch((error) => {
  console.error('Fatal:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
