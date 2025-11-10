"use client"

import { useState, useMemo, useCallback } from "react"
import { Footer } from "@/components/footer"
import { VantaBackground } from "@/components/vanta-background"
import { AlertsHeader } from "@/components/alerts-header"
import { AlertFilters } from "@/components/alert-filters"
import { AlertStats } from "@/components/alert-stats"
import { AlertTable } from "@/components/alert-table"
import { Pagination } from "@/components/pagination"
import { mockAlerts } from "@/utils/mock-data"

const ITEMS_PER_PAGE = 10

export default function AlertsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTimeRange, setSelectedTimeRange] = useState("Last 30 days")
  const [selectedFacility, setSelectedFacility] = useState("All Facilities")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter((alert) => {
      // Severity filter
      if (selectedSeverity !== "all" && alert.severity !== selectedSeverity) {
        return false
      }

      // Search filter
      const searchLower = searchQuery.toLowerCase()
      if (
        searchLower &&
        !alert.title.toLowerCase().includes(searchLower) &&
        !alert.description.toLowerCase().includes(searchLower)
      ) {
        return false
      }

      // Facility filter
      if (selectedFacility !== "All Facilities" && alert.facility !== selectedFacility) {
        return false
      }

      return true
    })
  }, [selectedSeverity, searchQuery, selectedFacility])

  // Calculate paginated alerts
  const paginatedAlerts = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAlerts.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  }, [filteredAlerts, currentPage])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAlerts = filteredAlerts.length
    const critical = filteredAlerts.filter((a) => a.severity === "critical").length
    const unresolved = filteredAlerts.filter((a) => a.status === "new" || a.status === "acknowledged").length
    const falsePositives = filteredAlerts.filter((a) => a.status === "false-positive").length

    return { totalAlerts, critical, unresolved, falsePositives }
  }, [filteredAlerts])

  // Event handlers
  const handleFilterChange = useCallback((type: string, value: string) => {
    if (type === "severity") setSelectedSeverity(value)
    if (type === "timeRange") setSelectedTimeRange(value)
    if (type === "facility") setSelectedFacility(value)
    setCurrentPage(1) // Reset to first page
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleNewAlert = useCallback(() => {
    console.log("New alert creation requested")
    // TODO: Implement new alert creation
  }, [])

  const handleAlertAction = useCallback((alertId: string) => {
    console.log("Action requested for alert:", alertId)
    // TODO: Implement alert actions
  }, [])

  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)

  return (
    <>
      <VantaBackground />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <AlertsHeader searchValue={searchQuery} onSearchChange={handleSearchChange} onNewAlert={handleNewAlert} />

          <AlertFilters
            selectedSeverity={selectedSeverity}
            selectedTimeRange={selectedTimeRange}
            selectedFacility={selectedFacility}
            onChange={handleFilterChange}
          />

          <AlertStats
            totalAlerts={stats.totalAlerts}
            critical={stats.critical}
            unresolved={stats.unresolved}
            falsePositives={stats.falsePositives}
          />

          <AlertTable alerts={paginatedAlerts} onActionClick={handleAlertAction} />

          {filteredAlerts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAlerts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          )}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No alerts found matching your filters.</p>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}
