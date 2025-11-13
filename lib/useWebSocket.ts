/**
 * WebSocket Hook for Real-Time Updates
 * Manages WebSocket connection, subscriptions, and events
 */
import { useEffect, useRef, useState, useCallback } from 'react'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  type: string
  data?: any
  status?: string
  room?: string
  message?: string
}

export interface UseWebSocketOptions {
  url?: string
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export interface UseWebSocketReturn {
  status: ConnectionStatus
  isConnected: boolean
  subscribe: (room: string) => void
  unsubscribe: (room: string) => void
  sendMessage: (message: any) => void
  lastMessage: WebSocketMessage | null
  error: Error | null
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setStatus('connecting')
    setError(null)

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ WebSocket connected')
        }
        setStatus('connected')
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          setLastMessage(message)
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to parse WebSocket message:', err)
          }
        }
      }

      ws.onerror = () => {
        // WebSocket error - connection failed
        // This is expected when backend is not running
        // Error details are not available in browser WebSocket API
        const errorMsg = `WebSocket connection failed (${url})`
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ WebSocket connection failed - using REST API fallback')
        }
        
        setError(new Error(errorMsg))
        setStatus('error')
      }

      ws.onclose = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔌 WebSocket disconnected')
        }
        setStatus('disconnected')
        wsRef.current = null

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `🔄 Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
            )
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Max reconnection attempts reached - using REST API only')
          }
        }
      }

      wsRef.current = ws
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create WebSocket:', err)
      }
      setError(err as Error)
      setStatus('error')
    }
  }, [url, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setStatus('disconnected')
  }, [])

  const subscribe = useCallback((room: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', room }))
    }
  }, [])

  const unsubscribe = useCallback((room: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'unsubscribe', room }))
    }
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    status,
    isConnected: status === 'connected',
    subscribe,
    unsubscribe,
    sendMessage,
    lastMessage,
    error,
  }
}
