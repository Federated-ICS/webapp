import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import FLStatusPage from '@/app/fl-status/page'

describe('FL Status Page Integration', () => {
  const API_URL = 'http://localhost:8000'

  beforeEach(() => {
    server.resetHandlers()
  })

  describe('Initial Load', () => {
    it('should display loading state initially', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(null)
        }),
        http.get(`${API_URL}/api/fl/clients`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json([])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            epsilon: 0.5,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.5,
          })
        })
      )

      render(<FLStatusPage />)

      expect(screen.getByText('Loading FL status...')).toBeInTheDocument()
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading FL status...')).not.toBeInTheDocument()
      })
    })

    it('should load and display current FL round', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json({
            id: 1,
            round_number: 42,
            status: 'in-progress',
            phase: 'training',
            progress: 67,
            epsilon: 0.82,
            model_accuracy: 92.5,
            clients: [],
            start_time: '2024-01-15T10:00:00Z',
          })
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          return HttpResponse.json([])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return HttpResponse.json({
            epsilon: 0.82,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.18,
          })
        })
      )

      render(<FLStatusPage />)

      await waitFor(() => {
        expect(screen.getByText('Round #42')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('Training on Local Data')).toBeInTheDocument()
    })

    it('should display FL clients', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json({
            id: 1,
            round_number: 42,
            status: 'in-progress',
            phase: 'training',
            progress: 67,
            epsilon: 0.82,
            model_accuracy: 92.5,
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
          ])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return HttpResponse.json({
            epsilon: 0.82,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.18,
          })
        })
      )

      render(<FLStatusPage />)

      await waitFor(() => {
        expect(screen.getByText('Facility A')).toBeInTheDocument()
      })

      expect(screen.getByText('Facility B')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument() // Facility A progress
      expect(screen.getByText('72%')).toBeInTheDocument() // Facility B progress
    })

    it('should display privacy metrics', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json({
            id: 1,
            round_number: 42,
            status: 'in-progress',
            phase: 'training',
            progress: 67,
            epsilon: 0.82,
            model_accuracy: 92.5,
            clients: [],
            start_time: '2024-01-15T10:00:00Z',
          })
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          return HttpResponse.json([])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return HttpResponse.json({
            epsilon: 0.82,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.18,
          })
        })
      )

      render(<FLStatusPage />)

      // Wait for privacy metrics to load - epsilon is displayed in the round progress card
      await waitFor(() => {
        const privacyLabels = screen.getAllByText('Privacy (ε)')
        expect(privacyLabels.length).toBeGreaterThan(0)
      }, { timeout: 3000 })

      // Check that epsilon value is displayed (formatted as 0.82)
      expect(screen.getByText('0.82')).toBeInTheDocument()
    })
  })

  describe('No Active Round', () => {
    it('should handle no active round gracefully', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json(null)
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          return HttpResponse.json([])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return HttpResponse.json({
            epsilon: 0.5,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.5,
          })
        })
      )

      render(<FLStatusPage />)

      await waitFor(() => {
        expect(screen.getByText('No active FL round')).toBeInTheDocument()
      })
    })
  })

  describe('Trigger FL Round', () => {
    it('should trigger new FL round when button clicked', async () => {
      const user = userEvent.setup()
      let roundTriggered = false

      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          if (roundTriggered) {
            return HttpResponse.json({
              id: 2,
              round_number: 43,
              status: 'in-progress',
              phase: 'distributing',
              progress: 0,
              epsilon: 0.5,
              model_accuracy: 0,
              clients: [],
              start_time: new Date().toISOString(),
            })
          }
          return HttpResponse.json(null)
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          return HttpResponse.json([])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return HttpResponse.json({
            epsilon: 0.5,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.5,
          })
        }),
        http.post(`${API_URL}/api/fl/rounds/trigger`, () => {
          roundTriggered = true
          return HttpResponse.json({
            id: 2,
            round_number: 43,
            status: 'in-progress',
            phase: 'distributing',
            progress: 0,
            epsilon: 0.5,
            model_accuracy: 0,
            clients: [],
            start_time: new Date().toISOString(),
          }, { status: 201 })
        })
      )

      render(<FLStatusPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('No active FL round')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Click trigger button
      const triggerButton = screen.getByRole('button', { name: /trigger/i })
      await user.click(triggerButton)

      // Verify new round displayed
      await waitFor(() => {
        expect(screen.getByText('Round #43')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('Distributing Global Model')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return new HttpResponse(null, { status: 500 })
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          return new HttpResponse(null, { status: 500 })
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<FLStatusPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should allow retry after error', async () => {
      const user = userEvent.setup()
      let attemptCount = 0

      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          attemptCount++
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json(null)
        }),
        http.get(`${API_URL}/api/fl/clients`, () => {
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json([])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            epsilon: 0.5,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.5,
          })
        })
      )

      render(<FLStatusPage />)

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify retry button exists
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()

      // Click retry
      await user.click(retryButton)

      // Should show no active round message after successful retry
      await waitFor(() => {
        expect(screen.getByText('No active FL round')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Error should be gone
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })
  })

  describe('Client Status Display', () => {
    it('should show different client statuses', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json({
            id: 1,
            round_number: 42,
            status: 'in-progress',
            phase: 'training',
            progress: 50,
            epsilon: 0.82,
            model_accuracy: 92.5,
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
              status: 'delayed',
              progress: 45,
              loss: 0.25,
              accuracy: 88.5,
              current_epoch: 4,
              total_epochs: 10,
            },
            {
              id: '3',
              name: 'Facility C',
              facility_id: 'facility_c',
              status: 'offline',
              progress: 0,
              loss: 0,
              accuracy: 0,
              current_epoch: 0,
              total_epochs: 10,
            },
          ])
        }),
        http.get(`${API_URL}/api/fl/privacy-metrics`, () => {
          return HttpResponse.json({
            epsilon: 0.82,
            delta: '10⁻⁵',
            data_size: '~10 MB',
            encryption: 'AES-256',
            privacy_budget_remaining: 0.18,
          })
        })
      )

      render(<FLStatusPage />)

      await waitFor(() => {
        expect(screen.getByText('Facility A')).toBeInTheDocument()
      })

      expect(screen.getByText('Facility B')).toBeInTheDocument()
      expect(screen.getByText('Facility C')).toBeInTheDocument()

      // Check for status indicators
      const activeStatus = screen.getAllByText(/active/i)
      expect(activeStatus.length).toBeGreaterThan(0)
    })
  })
})
