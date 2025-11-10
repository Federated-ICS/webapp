"use client"

import { useState, useCallback, useMemo } from "react"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { FLHeader } from "@/components/fl-header"
import { RoundProgressCard } from "@/components/round-progress-card"
import { ClientStatusCards } from "@/components/client-status-cards"
import { PrivacyMetrics } from "@/components/privacy-metrics"
import { RoundHistory } from "@/components/round-history"
import { FLFooter } from "@/components/fl-footer"
import { mockFLRound, mockFLClients, mockPrivacyMetrics, mockRoundHistory } from "@/utils/mock-data"

export default function FLStatusPage() {
  const [currentRound] = useState(mockFLRound)
  const [clients] = useState(mockFLClients)
  const [privacyMetrics] = useState(mockPrivacyMetrics)
  const [roundHistory] = useState(mockRoundHistory)
  const [lastRoundStartTime] = useState(new Date(Date.now() - 15 * 60000))

  const handleTriggerRound = useCallback(() => {
    console.log("Trigger new round clicked")
    alert("New FL round triggered (demo)")
  }, [])

  const handleConfiguration = useCallback(() => {
    console.log("Configuration clicked")
    alert("Configuration modal would open (demo)")
  }, [])

  const activeClientsCount = useMemo(() => clients.filter((c) => c.status === "active").length, [clients])

  return (
    <>
      <VantaBackground />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <FLHeader onTriggerRound={handleTriggerRound} onConfiguration={handleConfiguration} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <RoundProgressCard
              roundNumber={currentRound.roundNumber}
              progress={currentRound.progress}
              phase={currentRound.phase}
              timeRemaining={currentRound.timeRemaining}
              clientsActive={activeClientsCount}
              totalClients={currentRound.totalClients}
              epsilon={currentRound.epsilon}
              modelAccuracy={currentRound.modelAccuracy}
            />

            <ClientStatusCards clients={clients} />
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <PrivacyMetrics
              epsilon={privacyMetrics.epsilon}
              delta={privacyMetrics.delta}
              dataSize={privacyMetrics.dataSize}
              encryption={privacyMetrics.encryption}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <RoundHistory rounds={roundHistory} />
          </div>

          <FLFooter lastRoundStartTime={lastRoundStartTime} />
        </main>

        <Footer />
      </div>
    </>
  )
}
