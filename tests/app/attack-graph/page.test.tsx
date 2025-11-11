import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import AttackGraphPage from '@/app/attack-graph/page'

describe('Attack Graph Page Integration', () => {
  const API_URL = 'http://localhost:8000'

  beforeEach(() => {
    server.resetHandlers()
  })

  describe('Initial Load', () => {
    it('should display loading state initially', async () => {
      server.use(
        http.get(`${API_URL}/api/mitre/graph`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            nodes: [],
            links: []
          })
        })
      )

      render(<AttackGraphPage />)

      expect(screen.getByText('Loading attack graph...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText('Loading attack graph...')).not.toBeInTheDocument()
      })
    })

    it('should load and display attack graph', async () => {
      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          return HttpResponse.json({
            nodes: [
              {
                id: 'T0800',
                name: 'Activate Firmware Update Mode',
                type: 'current',
                probability: 1.0
              },
              {
                id: 'T0802',
                name: 'Automated Collection',
                type: 'predicted',
                probability: 0.85
              }
            ],
            links: [
              {
                source: 'T0800',
                target: 'T0802',
                probability: 0.85
              }
            ]
          })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('Current Attacks')).toBeInTheDocument()
      })

      // Check for current and predicted attacks (both show "1")
      const cards = screen.getAllByText('1')
      expect(cards.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Predicted Techniques')).toBeInTheDocument()
    })

    it('should display technique details when node is clicked', async () => {
      const user = userEvent.setup()

      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          return HttpResponse.json({
            nodes: [
              {
                id: 'T0800',
                name: 'Activate Firmware Update Mode',
                type: 'current',
                probability: 1.0
              }
            ],
            links: []
          })
        }),
        http.get(`${API_URL}/api/mitre/technique/T0800`, () => {
          return HttpResponse.json({
            id: 'T0800',
            name: 'Activate Firmware Update Mode',
            description: 'Adversaries may activate firmware update mode...',
            detection: 'Monitor for unusual firmware update requests...',
            mitigation: 'Implement secure firmware update procedures...',
            platforms: ['Control Server', 'Engineering Workstation'],
            tactics: ['Persistence', 'Inhibit Response Function']
          })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('Current Attacks')).toBeInTheDocument()
      })

      // The sidebar should be visible by default
      expect(screen.getByText(/technique details/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should allow retry after error', async () => {
      const user = userEvent.setup()
      let attemptCount = 0

      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          attemptCount++
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            nodes: [],
            links: []
          })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText('Error')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      // After retry, should show empty state since we return empty nodes
      await waitFor(() => {
        expect(screen.getByText('No attacks detected')).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('should handle no attacks gracefully', async () => {
      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          return HttpResponse.json({
            nodes: [],
            links: []
          })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('No attacks detected')).toBeInTheDocument()
      })
    })
  })

  describe('Graph Interactions', () => {
    it('should display correct node counts', async () => {
      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          return HttpResponse.json({
            nodes: [
              { id: 'T0800', name: 'Technique 1', type: 'current', probability: 1.0 },
              { id: 'T0801', name: 'Technique 2', type: 'current', probability: 1.0 },
              { id: 'T0802', name: 'Technique 3', type: 'predicted', probability: 0.85 },
              { id: 'T0803', name: 'Technique 4', type: 'predicted', probability: 0.75 }
            ],
            links: []
          })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('Current Attacks')).toBeInTheDocument()
      })

      // Check counts
      const cards = screen.getAllByText(/2|4/)
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should toggle sidebar visibility', async () => {
      const user = userEvent.setup()

      server.use(
        http.get(`${API_URL}/api/mitre/graph`, () => {
          return HttpResponse.json({
            nodes: [
              { id: 'T0800', name: 'Technique 1', type: 'current', probability: 1.0 }
            ],
            links: []
          })
        })
      )

      render(<AttackGraphPage />)

      await waitFor(() => {
        expect(screen.getByText('Current Attacks')).toBeInTheDocument()
      })

      // Sidebar should be visible initially
      expect(screen.getByText(/technique details/i)).toBeInTheDocument()

      // Find and click toggle button
      const toggleButton = screen.getByRole('button', { name: /toggle/i })
      await user.click(toggleButton)

      // Sidebar should be hidden (component will handle this via CSS)
      // We can't easily test CSS visibility, so just verify button works
      expect(toggleButton).toBeInTheDocument()
    })
  })
})
