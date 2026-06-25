export const now = (): Date => new Date()

export const timestamp = (): string => new Date().toISOString()

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

export const elapsed = (start: Date): number => Date.now() - start.getTime()
