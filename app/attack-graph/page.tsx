"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { AttackGraphHeader } from "@/components/attack-graph-header"
import { ForceDirectedGraph, type ForceDirectedGraphHandle } from "@/components/force-directed-graph"
import { TechniqueDetailsSidebar } from "@/components/technique-details-sidebar"
import { AttackTimeline } from "@/components/attack-timeline"
import { Card } from "@/components/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { apiClient, type TechniqueDetails } from "@/lib/api-client"
import type { Node, Link } from "@/utils/attack-graph-data"

export default function AttackGraphPage() {
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<ForceDirectedGraphHandle>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [techniqueDetails, setTechniqueDetails] = useState<TechniqueDetails | null>(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch attack graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiClient.getAttackGraph()
      setGraphData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch attack graph")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchGraphData()
  }, [fetchGraphData])

  // Fetch technique details when node is selected
  useEffect(() => {
    if (selectedNode) {
      apiClient.getTechniqueDetails(selectedNode.id)
        .then(setTechniqueDetails)
        .catch(console.error)
    }
  }, [selectedNode])

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.resetView()
    }
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarVisible(false)
  }, [])

  const handleRetry = useCallback(() => {
    fetchGraphData()
  }, [fetchGraphData])

  // Render loading state
  if (loading) {
    return (
      <>
        <VantaBackground />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 container mx-auto px-4 py-8">
            <LoadingSpinner message="Loading attack graph..." />
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
            <ErrorMessage message={error} onRetry={handleRetry} />
          </main>
          <Footer />
        </div>
      </>
    )
  }

  // Render empty state
  if (!graphData || graphData.nodes.length === 0) {
    return (
      <>
        <VantaBackground />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 container mx-auto px-4 py-8">
            <AttackGraphHeader onResetView={handleResetView} onToggleSidebar={handleToggleSidebar} />
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No attacks detected</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    )
  }

  const currentAttacks = graphData.nodes.filter((n) => n.type === "current").length
  const predictedAttacks = graphData.nodes.filter((n) => n.type === "predicted").length

  return (
    <>
      <VantaBackground />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <AttackGraphHeader onResetView={handleResetView} onToggleSidebar={handleToggleSidebar} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card glowEffect>
              <h2 className="text-sm text-gray-400 mb-2">Current Attacks</h2>
              <p className="text-4xl font-mono font-bold text-red-400">{currentAttacks}</p>
            </Card>

            <Card>
              <h2 className="text-sm text-gray-400 mb-2">Predicted Techniques</h2>
              <p className="text-4xl font-mono font-bold text-yellow-400">{predictedAttacks}</p>
            </Card>

            <Card>
              <h2 className="text-sm text-gray-400 mb-2">Total Nodes</h2>
              <p className="text-4xl font-mono font-bold text-blue-400">{graphData.nodes.length}</p>
            </Card>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div ref={graphContainerRef} className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50">
              <ForceDirectedGraph
                ref={graphRef}
                nodes={graphData.nodes}
                links={graphData.links}
                onNodeClick={handleNodeClick}
                containerRef={graphContainerRef}
              />
            </div>

            <TechniqueDetailsSidebar
              isVisible={isSidebarVisible}
              selectedTechnique={selectedNode}
              techniqueDetails={techniqueDetails}
              onClose={handleCloseSidebar}
            />
          </div>

          <div className="mt-8">
            <AttackTimeline
              nodes={graphData.nodes}
              selectedNodeId={selectedNode?.id || null}
              onNodeClick={handleNodeClick}
            />
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
