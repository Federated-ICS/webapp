"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { SystemStatusCard } from "@/components/system-status-card"
import { RecentAlertsCard } from "@/components/recent-alerts-card"
import { FLStatusCard } from "@/components/fl-status-card"
import { AttackPredictionCard } from "@/components/attack-prediction-card"
import { QuickActionsCard } from "@/components/quick-actions-card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { apiClient, type Alert, type AlertStats, type FLRound, type FLClient } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"

export default function DashboardPage() {
  // State
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null)
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [currentRound, setCurrentRound] = useState<FLRound | null>(null)
  const [flClients, setFlClients] = useState<FLClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock data for attack prediction (not yet implemented in backend)
  const [attackPrediction] = useState({
    techniqueId: "T1190",
    techniqueName: "Exploit Public-Facing Application",
    confidence: 76,
    timelineProgress: 65,
  })

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [statsData, alertsResponse, roundData] = await Promise.all([
        apiClient.getAlertStats(),
        apiClient.getAlerts({ limit: 3 }),
        apiClient.getCurrentFLRound(),
      ])

      setAlertStats(statsData)
      setRecentAlerts(alertsResponse.alerts || [])
      setCurrentRound(roundData)

      // Fetch FL clients if there's an active round
      if (roundData) {
        const clientsData = await apiClient.getFLClients()
        setFlClients(clientsData)
      } else {
        setFlClients([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleAction = (action: string) => {
    console.log("Action triggered:", action)
    // Action handling logic would go here
  }

  const handleRetry = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Format alerts for RecentAlertsCard
  const formattedAlerts = (recentAlerts || []).map((alert) => ({
    id: alert.id,
    title: alert.title,
    severity: alert.severity,
    facility: alert.facility_id,
    timestamp: formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true }),
  }))

  // Format facilities for FLStatusCard
  const formattedFacilities = (flClients || []).slice(0, 3).map((client) => ({
    name: client.name,
    status: client.status,
  }))

  // Render loading state
  if (loading) {
    return (
      <>
        <VantaBackground />
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
            <LoadingSpinner message="Loading dashboard..." />
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
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8">
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
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* System Status and Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <SystemStatusCard
              activeAlerts={alertStats?.unresolved || 0}
              flProgress={currentRound?.progress || 0}
              predictionAccuracy={currentRound?.model_accuracy || 0}
            />

            <RecentAlertsCard alerts={formattedAlerts} />

            {currentRound ? (
              <FLStatusCard
                roundNumber={currentRound.round_number}
                progress={currentRound.progress}
                facilities={formattedFacilities}
                epsilon={currentRound.epsilon || 0}
                delta="10⁻⁵"
              />
            ) : (
              <FLStatusCard
                roundNumber={0}
                progress={0}
                facilities={[]}
                epsilon={0}
                delta="10⁻⁵"
              />
            )}

            {/* Attack Prediction spans 2 columns on desktop */}
            <AttackPredictionCard
              techniqueId={attackPrediction.techniqueId}
              techniqueName={attackPrediction.techniqueName}
              confidence={attackPrediction.confidence}
              timelineProgress={attackPrediction.timelineProgress}
            />

            {/* Quick Actions */}
            <QuickActionsCard onAction={handleAction} />
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
