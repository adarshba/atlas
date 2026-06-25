import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Database } from './connection'

const MIGRATION_PATTERN = /^\d+_.+\.sql$/

const ensureMigrationsTable = async (sql: Database): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

const listMigrationFiles = async (migrationsDir: string): Promise<string[]> => {
  const entries = await readdir(migrationsDir)
  return entries.filter((file) => MIGRATION_PATTERN.test(file)).sort()
}

const getAppliedMigrations = async (sql: Database): Promise<Set<string>> => {
  const rows = await sql`SELECT name FROM _migrations ORDER BY name`
  return new Set(rows.map((row) => row.name as string))
}

export const runMigrations = async (
  sql: Database,
  migrationsDir: string,
): Promise<string[]> => {
  await ensureMigrationsTable(sql)

  const files = await listMigrationFiles(migrationsDir)
  const applied = await getAppliedMigrations(sql)

  const pending = files.filter((file) => !applied.has(file))

  for (const file of pending) {
    const content = await readFile(join(migrationsDir, file), 'utf-8')
    await sql.begin(async (tx) => {
      await tx.unsafe(content)
      await tx`INSERT INTO _migrations (name) VALUES (${file})`
    })
  }

  return pending
}
