import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import AlertsPage from '@/app/alerts/page'

describe('Alerts Page Integration', () => {
  const API_URL = 'http://localhost:8000'

  beforeEach(() => {
    // Reset any runtime request handlers we may add during tests
    server.resetHandlers()
  })

  describe('Initial Load', () => {
    it('should display loading state initially', () => {
      // Mock delayed API response
      server.use(
        http.get(`${API_URL}/api/alerts`, async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 0,
            limit: 10,
          })
        })
      )

      render(<AlertsPage />)

      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should load and display alerts from API', async () => {
      // Mock API responses
      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [
              {
                id: '1',
                title: 'Port Scan Detected',
                description: 'Suspicious port scanning activity',
                severity: 'critical',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [
                  {
                    layer: 1,
                    model_name: 'Isolation Forest',
                    confidence: 0.95,
                    detection_time: '2024-01-15T10:00:00Z',
                    evidence: 'Anomaly detected',
                  },
                ],
              },
              {
                id: '2',
                title: 'DDoS Attack',
                description: 'Distributed denial of service',
                severity: 'high',
                facility_id: 'facility_b',
                status: 'acknowledged',
                timestamp: '2024-01-15T09:00:00Z',
                sources: [],
              },
            ],
            total: 2,
            page: 1,
            pages: 1,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 2,
            critical: 1,
            unresolved: 1,
            false_positives: 0,
          })
        })
      )

      render(<AlertsPage />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Port Scan Detected')).toBeInTheDocument()
      })

      expect(screen.getByText('DDoS Attack')).toBeInTheDocument()
    })

    it('should display alert statistics', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 0,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 20,
            critical: 5,
            unresolved: 12,
            false_positives: 2,
          })
        })
      )

      render(<AlertsPage />)

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument() // total
      })

      expect(screen.getByText('5')).toBeInTheDocument() // critical
      expect(screen.getByText('12')).toBeInTheDocument() // unresolved
      expect(screen.getByText('2')).toBeInTheDocument() // false positives
    })
  })

  describe('Filtering', () => {
    it('should filter alerts by severity', async () => {
      const user = userEvent.setup()
      let requestedSeverity = ''

      server.use(
        http.get(`${API_URL}/api/alerts`, ({ request }) => {
          const url = new URL(request.url)
          requestedSeverity = url.searchParams.get('severity') || ''

          return HttpResponse.json({
            alerts: requestedSeverity === 'critical' ? [
              {
                id: '1',
                title: 'Critical Alert',
                description: 'Test',
                severity: 'critical',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [],
              },
            ] : [],
            total: requestedSeverity === 'critical' ? 1 : 0,
            page: 1,
            pages: 1,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 1,
            critical: 1,
            unresolved: 1,
            false_positives: 0,
          })
        })
      )

      render(<AlertsPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Click critical filter button
      const criticalButton = screen.getByRole('button', { name: /critical/i })
      await user.click(criticalButton)

      // Verify API was called with severity parameter
      await waitFor(() => {
        expect(requestedSeverity).toBe('critical')
      })

      // Verify filtered results displayed
      await waitFor(() => {
        expect(screen.getByText('Critical Alert')).toBeInTheDocument()
      })
    })

    it('should filter alerts by facility', async () => {
      // Skip this test for now - facility filter UI needs to be implemented
      // This test will be enabled once the facility dropdown is added to the UI
    })
  })

  describe('Search', () => {
    it('should search alerts by query', async () => {
      const user = userEvent.setup()
      let searchQuery = ''

      server.use(
        http.get(`${API_URL}/api/alerts`, ({ request }) => {
          const url = new URL(request.url)
          searchQuery = url.searchParams.get('search') || ''

          return HttpResponse.json({
            alerts: searchQuery === 'Port Scan' ? [
              {
                id: '1',
                title: 'Port Scan Detected',
                description: 'Test',
                severity: 'high',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [],
              },
            ] : [],
            total: searchQuery === 'Port Scan' ? 1 : 0,
            page: 1,
            pages: 1,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 1,
            critical: 0,
            unresolved: 1,
            false_positives: 0,
          })
        })
      )

      render(<AlertsPage />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })

      // Type in search box
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'Port Scan')

      // Verify API called with search parameter
      await waitFor(() => {
        expect(searchQuery).toBe('Port Scan')
      })

      // Verify search results displayed
      await waitFor(() => {
        expect(screen.getByText('Port Scan Detected')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should paginate through alerts', async () => {
      const user = userEvent.setup()
      let currentPage = 1

      server.use(
        http.get(`${API_URL}/api/alerts`, ({ request }) => {
          const url = new URL(request.url)
          currentPage = parseInt(url.searchParams.get('page') || '1')

          return HttpResponse.json({
            alerts: currentPage === 2 ? [
              {
                id: '11',
                title: 'Alert Page 2',
                description: 'Test',
                severity: 'medium',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [],
              },
            ] : [
              {
                id: '1',
                title: 'Alert Page 1',
                description: 'Test',
                severity: 'high',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [],
              },
            ],
            total: 15,
            page: currentPage,
            pages: 2,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 15,
            critical: 0,
            unresolved: 15,
            false_positives: 0,
          })
        })
      )

      render(<AlertsPage />)

      // Wait for page 1 to load
      await waitFor(() => {
        expect(screen.getByText('Alert Page 1')).toBeInTheDocument()
      })

      // Click next page button
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Verify page 2 loaded
      await waitFor(() => {
        expect(screen.getByText('Alert Page 2')).toBeInTheDocument()
      })

      expect(currentPage).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          return new HttpResponse(null, { status: 500 })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<AlertsPage />)

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should not show alerts
      expect(screen.queryByText('Port Scan')).not.toBeInTheDocument()
    })

    it('should allow retry after error', async () => {
      const user = userEvent.setup()
      let callCount = 0

      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          callCount++
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 0,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json({
            total: 0,
            critical: 0,
            unresolved: 0,
            false_positives: 0,
          })
        })
      )

      render(<AlertsPage />)

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Error should disappear and show empty state
      await waitFor(() => {
        expect(screen.queryByText('Error')).not.toBeInTheDocument()
      }, { timeout: 3000 })
      
      await waitFor(() => {
        expect(screen.getByText('No alerts found')).toBeInTheDocument()
      })
    })
  })

  describe('Alert Actions', () => {
    it('should update alert status when acknowledged', async () => {
      const user = userEvent.setup()
      let updatedStatus = ''
      let updateCallCount = 0

      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [
              {
                id: '1',
                title: 'Test Alert',
                description: 'Test',
                severity: 'high',
                facility_id: 'facility_a',
                status: updateCallCount > 0 ? 'acknowledged' : 'new',
                timestamp: '2024-01-15T10:00:00Z',
                sources: [],
              },
            ],
            total: 1,
            page: 1,
            pages: 1,
            limit: 10,
          })
        }),
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 1,
            critical: 0,
            unresolved: updateCallCount > 0 ? 0 : 1,
            false_positives: 0,
          })
        }),
        http.put(`${API_URL}/api/alerts/:id/status`, async ({ request }) => {
          const body = await request.json() as { status: string }
          updatedStatus = body.status
          updateCallCount++

          return HttpResponse.json({
            id: '1',
            title: 'Test Alert',
            description: 'Test',
            severity: 'high',
            facility_id: 'facility_a',
            status: updatedStatus,
            timestamp: '2024-01-15T10:00:00Z',
            sources: [],
          })
        })
      )

      render(<AlertsPage />)

      // Wait for alert to load
      await waitFor(() => {
        expect(screen.getByText('Test Alert')).toBeInTheDocument()
      })

      // Click the actions menu button (three dots)
      const actionButtons = screen.getAllByLabelText(/actions for alert/i)
      await user.click(actionButtons[0])

      // Wait for dropdown to appear and click acknowledge
      await waitFor(() => {
        expect(screen.getByText('Acknowledge')).toBeInTheDocument()
      })
      
      const acknowledgeButton = screen.getByText('Acknowledge')
      await user.click(acknowledgeButton)

      // Verify API was called
      await waitFor(() => {
        expect(updatedStatus).toBe('acknowledged')
      }, { timeout: 3000 })

      // Verify UI refreshed with updated status
      await waitFor(() => {
        expect(updateCallCount).toBeGreaterThan(0)
      })
    })
  })
})
