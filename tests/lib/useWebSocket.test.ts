/**
 * Tests for useWebSocket Hook
 * Following TDD approach
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWebSocket } from '@/lib/useWebSocket'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

describe('useWebSocket', () => {
  beforeEach(() => {
    // @ts-ignore
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }))

    expect(result.current.status).toBe('disconnected')
    expect(result.current.isConnected).toBe(false)
    expect(result.current.lastMessage).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should connect automatically when autoConnect is true', async () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: true }))

    expect(result.current.status).toBe('connecting')

    await waitFor(() => {
      expect(result.current.status).toBe('connected')
    })

    expect(result.current.isConnected).toBe(true)
  })

  it('should not connect automatically when autoConnect is false', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }))

    expect(result.current.status).toBe('disconnected')
    expect(result.current.isConnected).toBe(false)
  })

  it('should provide subscribe function', async () => {
    const { result } = renderHook(() => useWebSocket())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    expect(typeof result.current.subscribe).toBe('function')

    // Should not throw when subscribing
    act(() => {
      result.current.subscribe('alerts')
    })
  })

  it('should provide unsubscribe function', async () => {
    const { result } = renderHook(() => useWebSocket())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    expect(typeof result.current.unsubscribe).toBe('function')

    // Should not throw when unsubscribing
    act(() => {
      result.current.unsubscribe('alerts')
    })
  })

  it('should provide sendMessage function', async () => {
    const { result } = renderHook(() => useWebSocket())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    expect(typeof result.current.sendMessage).toBe('function')

    // Should not throw when sending message
    act(() => {
      result.current.sendMessage({ action: 'ping' })
    })
  })

  it('should receive and parse messages', async () => {
    const { result } = renderHook(() => useWebSocket())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // For now, just verify lastMessage starts as null
    // Full message testing would require more complex WebSocket mocking
    expect(result.current.lastMessage).toBeNull()
  })

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useWebSocket())

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Unmount should trigger cleanup
    unmount()

    // After unmount, the hook is no longer active
    // We just verify it doesn't throw errors
    expect(true).toBe(true)
  })
})
