import { logs, SeverityNumber, type AnyValueMap } from '@opentelemetry/api-logs'

const getLogger = () => logs.getLogger('@atlas/otel')

export const log = (severity: SeverityNumber, message: string, attributes?: AnyValueMap): void => {
  const logger = getLogger()
  const record: Parameters<typeof logger.emit>[0] = {
    severityNumber: severity,
    body: message,
  }
  if (attributes !== undefined) {
    record.attributes = attributes
  }
  logger.emit(record)
}

export const logInfo = (message: string, attributes?: AnyValueMap): void =>
  log(SeverityNumber.INFO, message, attributes)

export const logWarn = (message: string, attributes?: AnyValueMap): void =>
  log(SeverityNumber.WARN, message, attributes)

export const logError = (message: string, attributes?: AnyValueMap): void =>
  log(SeverityNumber.ERROR, message, attributes)

export const logDebug = (message: string, attributes?: AnyValueMap): void =>
  log(SeverityNumber.DEBUG, message, attributes)
