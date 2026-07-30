import { describe, expect, it, vi } from 'vitest'
import { EventBus } from '../src/Event'

type DemoEvents = {
  ping: { id: number }
  empty: undefined
}

describe('EventBus', () => {
  it('on / emit 应传递 detail', () => {
    const bus = new EventBus<DemoEvents>()
    const listener = vi.fn()
    bus.on('ping', listener)

    bus.emit('ping', { id: 1 })

    expect(listener).toHaveBeenCalledTimes(1)
    const event = listener.mock.calls[0][0] as CustomEvent
    expect(event.detail).toEqual({ id: 1 })
  })

  it('off 后不应再触发', () => {
    const bus = new EventBus<DemoEvents>()
    const listener = vi.fn()
    bus.on('ping', listener)
    bus.off('ping', listener)

    bus.emit('ping', { id: 2 })

    expect(listener).not.toHaveBeenCalled()
  })

  it('once 只触发一次', () => {
    const bus = new EventBus<DemoEvents>()
    const listener = vi.fn()
    bus.once('ping', listener)

    bus.emit('ping', { id: 3 })
    bus.emit('ping', { id: 4 })

    expect(listener).toHaveBeenCalledTimes(1)
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ id: 3 })
  })

  it('emit Event 实例时应直接派发', () => {
    const bus = new EventBus<{ custom: Event }>()
    const listener = vi.fn()
    const customEvent = new Event('custom')
    bus.on('custom', listener)

    const result = bus.emit('custom', customEvent)

    expect(result).toBe(true)
    expect(listener).toHaveBeenCalledWith(customEvent)
  })
})
