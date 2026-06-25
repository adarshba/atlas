import type { PlatformRef, ResponseEnvelope, StreamHandle } from '@atlas/types'

export const createStartStream = () =>
  async (_platformRef: PlatformRef): Promise<StreamHandle> => {
    throw new Error('Linear does not support streaming')
  }

export const createAppendStream = () =>
  async (_handle: StreamHandle, _content: string): Promise<void> => {
    throw new Error('Linear does not support streaming')
  }

export const createStopStream = () =>
  async (_handle: StreamHandle, _finalEnvelope: ResponseEnvelope): Promise<void> => {
    throw new Error('Linear does not support streaming')
  }
