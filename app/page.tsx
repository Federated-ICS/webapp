"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { SystemStatusCard } from "@/components/system-status-card"
import { RecentAlertsCard } from "@/components/recent-alerts-card"
import { FLStatusCard } from "@/components/fl-status-card"
import { AttackPredictionCard } from "@/components/attack-prediction-card"
import { QuickActionsCard } from "@/components/quick-actions-card"

// Mock data
const mockAlerts = [
  {
    id: "1",
    title: "Suspicious Login Attempt",
    severity: "critical" as const,
    facility: "Facility A",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    title: "Unusual Network Traffic",
    severity: "high" as const,
    facility: "Facility B",
    timestamp: "15 minutes ago",
  },
  {
    id: "3",
    title: "Certificate Expiration Warning",
    severity: "low" as const,
    facility: "Facility C",
    timestamp: "1 hour ago",
  },
]

const mockFacilities = [
  { name: "Facility A", status: "active" as const },
  { name: "Facility B", status: "active" as const },
  { name: "Facility C", status: "delayed" as const },
]

export default function DashboardPage() {
  const [systemStatus] = useState({
    activeAlerts: 12,
    flProgress: 67,
    predictionAccuracy: 89,
  })

  const [flStatus] = useState({
    roundNumber: 42,
    progress: 67,
    facilities: mockFacilities,
    epsilon: 0.5,
    delta: "10⁻⁵",
  })

  const [attackPrediction] = useState({
    techniqueId: "T1190",
    techniqueName: "Exploit Public-Facing Application",
    confidence: 76,
    timelineProgress: 65,
  })

  const handleAction = (action: string) => {
    console.log("[v0] Action triggered:", action)
    // Action handling logic would go here
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
              activeAlerts={systemStatus.activeAlerts}
              flProgress={systemStatus.flProgress}
              predictionAccuracy={systemStatus.predictionAccuracy}
            />

            <RecentAlertsCard alerts={mockAlerts} />

            <FLStatusCard
              roundNumber={flStatus.roundNumber}
              progress={flStatus.progress}
              facilities={flStatus.facilities}
              epsilon={flStatus.epsilon}
              delta={flStatus.delta}
            />

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
