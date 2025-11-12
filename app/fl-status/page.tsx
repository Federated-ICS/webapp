"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { FLHeader } from "@/components/fl-header"
import { RoundProgressCard } from "@/components/round-progress-card"
import { ClientStatusCards } from "@/components/client-status-cards"
import { PrivacyMetrics } from "@/components/privacy-metrics"
import { RoundHistory } from "@/components/round-history"
import { FLFooter } from "@/components/fl-footer"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { apiClient, type FLRound, type FLClient, type PrivacyMetrics as PrivacyMetricsType } from "@/lib/api-client"
import { useWebSocket } from "@/lib/useWebSocket"
import { mockRoundHistory } from "@/utils/mock-data"

export default function FLStatusPage() {
  // State
  const [currentRound, setCurrentRound] = useState<FLRound | null>(null)
  const [clients, setClients] = useState<FLClient[]>([])
  const [privacyMetrics, setPrivacyMetrics] = useState<PrivacyMetricsType | null>(null)
  const [roundHistory] = useState(mockRoundHistory) // TODO: Fetch from API
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket connection for real-time updates
  const { lastMessage, subscribe, isConnected } = useWebSocket({
    autoConnect: true,
  })

  // Fetch FL status data
  const fetchFLStatus = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [roundData, clientsData, metricsData] = await Promise.all([
        apiClient.getCurrentFLRound(),
        apiClient.getFLClients(),
        apiClient.getPrivacyMetrics(),
      ])

      setCurrentRound(roundData)
      setClients(clientsData)
      setPrivacyMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch FL status")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchFLStatus()
  }, [fetchFLStatus])

  // Subscribe to fl-status room when WebSocket connects
  useEffect(() => {
    if (isConnected) {
      subscribe('fl-status')
    }
  }, [isConnected, subscribe])

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'fl_progress') {
      const data = lastMessage.data

      // Update current round progress
      if (data && currentRound) {
        setCurrentRound((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            progress: data.progress ?? prev.progress,
            phase: data.phase ?? prev.phase,
            model_accuracy: data.model_accuracy ?? prev.model_accuracy,
          }
        })
      }

      // Update clients if provided
      if (data?.clients) {
        setClients(data.clients)
      }
    }
  }, [lastMessage, currentRound])

  // Handle trigger FL round
  const handleTriggerRound = useCallback(async () => {
    try {
      const newRound = await apiClient.triggerFLRound()
      setCurrentRound(newRound)
      // Refresh clients after triggering
      const clientsData = await apiClient.getFLClients()
      setClients(clientsData)
    } catch (err) {
      console.error("Failed to trigger FL round:", err)
      setError(err instanceof Error ? err.message : "Failed to trigger FL round")
    }
  }, [])

  const handleConfiguration = useCallback(() => {
    console.log("Configuration clicked")
    alert("Configuration modal would open (demo)")
  }, [])

  const handleRetry = useCallback(() => {
    fetchFLStatus()
  }, [fetchFLStatus])

  const activeClientsCount = useMemo(() => clients.filter((c) => c.status === "active").length, [clients])
  
  const lastRoundStartTime = useMemo(() => {
    if (currentRound?.start_time) {
      return new Date(currentRound.start_time)
    }
    return new Date(Date.now() - 15 * 60000)
  }, [currentRound])

  // Render loading state
  if (loading) {
    return (
      <>
        <VantaBackground />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 container mx-auto px-4 py-8">
            <FLHeader onTriggerRound={handleTriggerRound} onConfiguration={handleConfiguration} />
            <LoadingSpinner message="Loading FL status..." />
          </main>
          <Footer />
        </div>
      </>
    )
  }

  // Render error state
  if (error) {
    return (
      <>
        <VantaBackground />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 container mx-auto px-4 py-8">
            <FLHeader onTriggerRound={handleTriggerRound} onConfiguration={handleConfiguration} />
            <ErrorMessage message={error} onRetry={handleRetry} />
          </main>
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      <VantaBackground />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <FLHeader onTriggerRound={handleTriggerRound} onConfiguration={handleConfiguration} />

          {currentRound ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <RoundProgressCard
                  roundNumber={currentRound.round_number}
                  progress={currentRound.progress}
                  phase={currentRound.phase}
                  timeRemaining={0} // TODO: Calculate from start_time
                  clientsActive={activeClientsCount}
                  totalClients={clients.length}
                  epsilon={currentRound.epsilon}
                  modelAccuracy={currentRound.model_accuracy}
                />

                <ClientStatusCards clients={clients} />
              </div>

              {privacyMetrics && (
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <PrivacyMetrics
                    epsilon={privacyMetrics.epsilon}
                    delta={privacyMetrics.delta}
                    dataSize={privacyMetrics.data_size}
                    encryption={privacyMetrics.encryption}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <RoundHistory rounds={roundHistory} />
              </div>

              <FLFooter lastRoundStartTime={lastRoundStartTime} />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No active FL round</p>
              <p className="text-gray-500 text-sm">Click "Trigger FL Round" to start a new training round</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}
