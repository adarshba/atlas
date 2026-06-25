import { trace, metrics } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { BasicTracerProvider, BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions'
import type { OtelConfig } from '@atlas/types'

let initialized = false
let tracerProvider: BasicTracerProvider | null = null
let meterProvider: MeterProvider | null = null
let loggerProvider: LoggerProvider | null = null

export const initTelemetry = (config: OtelConfig): void => {
  if (initialized) return

  const resource = new Resource({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]: config.serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
  })

  const traceExporter = new OTLPTraceExporter({
    url: `${config.collectorEndpoint}/v1/traces`,
  })

  tracerProvider = new BasicTracerProvider({ resource })
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter))
  tracerProvider.register()

  const metricExporter = new OTLPMetricExporter({
    url: `${config.collectorEndpoint}/v1/metrics`,
  })

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
  })

  meterProvider = new MeterProvider({
    resource,
    readers: [metricReader],
  })
  metrics.setGlobalMeterProvider(meterProvider)

  const logExporter = new OTLPLogExporter({
    url: `${config.collectorEndpoint}/v1/logs`,
  })

  loggerProvider = new LoggerProvider({ resource })
  loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter))
  logs.setGlobalLoggerProvider(loggerProvider)

  initialized = true
}

export const shutdownTelemetry = async (): Promise<void> => {
  const promises: Promise<void>[] = []

  if (tracerProvider) {
    promises.push(tracerProvider.shutdown())
    tracerProvider = null
  }
  if (meterProvider) {
    promises.push(meterProvider.shutdown())
    meterProvider = null
  }
  if (loggerProvider) {
    promises.push(loggerProvider.shutdown())
    loggerProvider = null
  }

  await Promise.allSettled(promises)
  initialized = false
}
