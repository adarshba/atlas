import type { AtlasConfig } from '@atlas/types'

export const printConfig = (config: AtlasConfig): void => {
  console.log('Atlas Local Dev')
  console.log('===============')
  console.log(`  AI:        ${config.ai.baseURL} (${config.ai.model})`)
  console.log(`  Redis:     ${config.redis.url}`)
  console.log(`  Postgres:  ${config.postgres.url}`)
  console.log(`  OTel:      ${config.otel.collectorEndpoint}`)
  console.log(`  Graphiti:  ${config.graphiti.baseURL}`)
  console.log('')
}
