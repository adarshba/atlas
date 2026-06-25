import type { AtlasConfig } from '@atlas/types'

export const printConfig = (config: AtlasConfig): void => {
  console.log('Atlas Server')
  console.log('===============')
  console.log(`  AI:        ${config.ai.baseURL} (${config.ai.model})`)
  console.log(`  Redis:     ${config.redis.url}`)
  console.log(`  Postgres:  ${config.postgres.url}`)
  console.log(`  OTel:      ${config.otel.collectorEndpoint}`)
  console.log(`  Graphiti:  ${config.graphiti.baseURL}`)
  console.log(`  Linear:    ${config.linear.apiKey ? 'configured' : 'disabled'}`)
  console.log(`  Slack:     ${config.slack.botToken ? 'configured' : 'disabled'}`)
  console.log('')
}
