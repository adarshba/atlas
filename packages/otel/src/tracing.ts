import { trace, type Span, type SpanOptions, type Tracer, type Attributes } from '@opentelemetry/api'

const getTracer = (): Tracer => trace.getTracer('@atlas/otel')

export const withSpan = async <T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: SpanOptions,
): Promise<T> => {
  const tracer = getTracer()
  return tracer.startActiveSpan(name, options ?? {}, async (span) => {
    try {
      const result = await fn(span)
      span.setStatus({ code: 0 })
      return result
    } catch (error) {
      span.setStatus({
        code: 2,
        message: error instanceof Error ? error.message : String(error),
      })
      span.recordException(error as Error)
      throw error
    } finally {
      span.end()
    }
  })
}

export const withSpanEvent = (span: Span, name: string, attributes?: Attributes): void => {
  span.addEvent(name, attributes)
}

export const getCurrentSpan = (): Span | undefined => {
  return trace.getActiveSpan()
}
