import type { Database } from './connection'
import { withSpan } from '@atlas/otel'

export const query = async <T>(
  sql: Database,
  text: string,
  ...params: readonly (string | number | boolean | null)[]
): Promise<T[]> => {
  return withSpan('db.query', async (span) => {
    span.setAttribute('db.query.text', text.slice(0, 200))
    const result = await sql.unsafe(text, [...params])
    return result as unknown as T[]
  })
}
