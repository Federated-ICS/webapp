import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import DashboardPage from '@/app/page'

describe('Dashboard Page Integration', () => {
  const API_URL = 'http://localhost:8000'

  beforeEach(() => {
    server.resetHandlers()
  })

  describe('Initial Load', () => {
    it('should display loading state initially', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            total: 12,
            critical: 3,
            unresolved: 8,
            false_positives: 1,
          })
        }),
        http.get(`${API_URL}/api/alerts`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(null)
        })
      )

      render(<DashboardPage />)

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument()
      })
    })

    it('should load and display system status', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 12,
            critical: 3,
            unresolved: 8,
            false_positives: 1,
          })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json(null)
        })
      )

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('System Status')).toBeInTheDocument()
      })

      // Check that unresolved alerts count is displayed
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('should load and display recent alerts', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 12,
            critical: 3,
            unresolved: 8,
            false_positives: 1,
          })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [
              {
                id: '1',
                title: 'Suspicious Login Attempt',
                description: 'Multiple failed login attempts detected',
                severity: 'critical',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [],
              },
              {
                id: '2',
                title: 'Unusual Network Traffic',
                description: 'Abnormal traffic pattern detected',
                severity: 'high',
                facility_id: 'facility_b',
                status: 'new',
                timestamp: '2024-01-15T09:45:00Z',
                sources: [],
              },
            ],
            total: 2,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json(null)
        })
      )

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Recent Alerts')).toBeInTheDocument()
      })

      expect(screen.getByText('Suspicious Login Attempt')).toBeInTheDocument()
      expect(screen.getByText('Unusual Network Traffic')).toBeInTheDocument()
    })

    it('should load and display FL status when round is active', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 12,
            critical: 3,
            unresolved: 8,
            false_positives: 1,
          })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json({
            id: 1,
            round_number: 42,
            status: 'in-progress',
            phase: 'training',
            progress: 67,
            epsilon: 0.5,
            model_accuracy: 89.5,
            clients: [],
            start_time: '2024-01-15T10:00:00Z',
          })
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          return HttpResponse.json([
            {
              id: '1',
              name: 'Facility A',
              facility_id: 'facility_a',
              status: 'active',
              progress: 85,
              loss: 0.12,
              accuracy: 94.2,
              current_epoch: 8,
              total_epochs: 10,
            },
            {
              id: '2',
              name: 'Facility B',
              facility_id: 'facility_b',
              status: 'active',
              progress: 72,
              loss: 0.18,
              accuracy: 91.8,
              current_epoch: 7,
              total_epochs: 10,
            },
            {
              id: '3',
              name: 'Facility C',
              facility_id: 'facility_c',
              status: 'delayed',
              progress: 45,
              loss: 0.25,
              accuracy: 88.5,
              current_epoch: 4,
              total_epochs: 10,
            },
          ])
        })
      )

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Federated Learning')).toBeInTheDocument()
      })

      expect(screen.getByText('Round #42')).toBeInTheDocument()
      // Check that 67% appears (multiple times is OK - in both System Status and FL Status)
      const progressTexts = screen.getAllByText('67%')
      expect(progressTexts.length).toBeGreaterThan(0)
    })

    it('should display no FL round message when no round is active', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 12,
            critical: 3,
            unresolved: 8,
            false_positives: 1,
          })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json(null)
        })
      )

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Federated Learning')).toBeInTheDocument()
      })

      expect(screen.getByText('No active round')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return new HttpResponse(null, { status: 500 })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          return new HttpResponse(null, { status: 500 })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should allow retry after error', async () => {
      let attemptCount = 0

      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          attemptCount++
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            total: 12,
            critical: 3,
            unresolved: 8,
            false_positives: 1,
          })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json(null)
        })
      )

      render(<DashboardPage />)

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await retryButton.click()

      // Should show system status after successful retry
      await waitFor(() => {
        expect(screen.getByText('System Status')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Error should be gone
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('should handle no alerts gracefully', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 0,
            critical: 0,
            unresolved: 0,
            false_positives: 0,
          })
        }),
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 1,
            limit: 3,
          })
        }),
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json(null)
        })
      )

      render(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Recent Alerts')).toBeInTheDocument()
      })

      expect(screen.getByText('No recent alerts')).toBeInTheDocument()
    })
  })
})
