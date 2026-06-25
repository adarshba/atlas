import { metrics } from '@opentelemetry/api'
import type { Meter, Counter, Histogram } from '@opentelemetry/api'

const getMeter = (): Meter => metrics.getMeter('@atlas/otel')

const counterCache = new Map<string, Counter>()
const histogramCache = new Map<string, Histogram>()

export const createCounter = (name: string, description: string): Counter => {
  let counter = counterCache.get(name)
  if (!counter) {
    counter = getMeter().createCounter(name, { description })
    counterCache.set(name, counter)
  }
  return counter
}

export const createHistogram = (name: string, description: string): Histogram => {
  let histogram = histogramCache.get(name)
  if (!histogram) {
    histogram = getMeter().createHistogram(name, { description })
    histogramCache.set(name, histogram)
  }
  return histogram
}

export const incrementCounter = (
  name: string,
  value = 1,
  attributes?: Record<string, string>,
): void => {
  createCounter(name, '').add(value, attributes)
}

export const recordHistogram = (
  name: string,
  value: number,
  attributes?: Record<string, string>,
): void => {
  createHistogram(name, '').record(value, attributes)
}
