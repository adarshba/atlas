import type { Database } from './connection'

export const healthCheck = async (sql: Database): Promise<boolean> => {
  try {
    await sql`SELECT 1`
    return true
  } catch {
    return false
  }
}
