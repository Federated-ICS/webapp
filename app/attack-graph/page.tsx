"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import * as d3 from "d3"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { AttackGraphHeader } from "@/components/attack-graph-header"
import { ForceDirectedGraph } from "@/components/force-directed-graph"
import { TechniqueDetailsSidebar } from "@/components/technique-details-sidebar"
import { AttackTimeline } from "@/components/attack-timeline"
import { Card } from "@/components/card"
import { mockAttackGraphData, mockTechniqueDetails } from "@/utils/attack-graph-data"
import type { Node, TechniqueDetails } from "@/utils/attack-graph-data"

export default function AttackGraphPage() {
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [techniqueDetails, setTechniqueDetails] = useState<TechniqueDetails | null>(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [graphData] = useState(mockAttackGraphData)

  // Fetch technique details when node is selected
  useEffect(() => {
    if (selectedNode && selectedNode.id in mockTechniqueDetails) {
      setTechniqueDetails(mockTechniqueDetails[selectedNode.id])
    }
  }, [selectedNode])

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleResetView = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity.translate(0, 0))
    }
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarVisible(false)
  }, [])

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
