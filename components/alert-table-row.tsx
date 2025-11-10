"use client"

import { MoreVertical } from "lucide-react"
import { SeverityBadge } from "./severity-badge"
import { StatusBadge } from "./status-badge"
import { SourceIndicator } from "./source-indicator"
import type { Alert } from "@/utils/mock-data"

interface AlertTableRowProps {
  alert: Alert
  onActionClick: (alertId: string) => void
}

export const AlertTableRow = ({ alert, onActionClick }: AlertTableRowProps) => {
  return (
    <tr className="hover:bg-gray-800/50 transition-colors">
      <td className="px-6 py-4">
        <SeverityBadge severity={alert.severity} />
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-white">{alert.title}</p>
          <p className="text-sm text-gray-400">{alert.description}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-400">{alert.facility}</td>
      <td className="px-6 py-4">
        <SourceIndicator source={alert.source} severity={alert.severity} />
      </td>
      <td className="px-6 py-4 text-gray-400 text-sm">{alert.relativeTime}</td>
      <td className="px-6 py-4">
        <StatusBadge status={alert.status} />
      </td>
      <td className="px-6 py-4">
        <button
          onClick={() => onActionClick(alert.id)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={`Actions for alert ${alert.id}`}
        >
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  )
}
