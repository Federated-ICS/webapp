import { describe, it, expect } from 'vitest'
import { server } from '../setup'
import { http, HttpResponse } from 'msw'
import { apiClient } from '@/lib/api-client'

describe('API Client - Alerts', () => {
  const API_URL = 'http://localhost:8000'

  describe('getAlerts', () => {
    it('should fetch alerts successfully', async () => {
      // Arrange: Mock API response
      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          return HttpResponse.json({
            alerts: [
              {
                id: '123',
                title: 'Test Alert',
                severity: 'critical',
                facility_id: 'facility_a',
                status: 'new',
                timestamp: '2024-01-15T10:00:00Z',
                description: 'Test description',
                sources: [],
              },
            ],
            total: 1,
            page: 1,
            pages: 1,
            limit: 10,
          })
        })
      )

      // Act: Call API client
      const result = await apiClient.getAlerts()

      // Assert: Check response
      expect(result.alerts).toHaveLength(1)
      expect(result.alerts[0].title).toBe('Test Alert')
      expect(result.total).toBe(1)
    })

    it('should handle filters correctly', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts`, ({ request }) => {
          const url = new URL(request.url)
          const severity = url.searchParams.get('severity')
          const facility = url.searchParams.get('facility')

          expect(severity).toBe('critical')
          expect(facility).toBe('facility_a')

          return HttpResponse.json({
            alerts: [],
            total: 0,
            page: 1,
            pages: 0,
            limit: 10,
          })
        })
      )

      await apiClient.getAlerts({
        severity: 'critical',
        facility: 'facility_a',
      })
    })

    it('should handle API errors', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts`, () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(apiClient.getAlerts()).rejects.toThrow('API Error: 500')
    })
  })

  describe('getAlertStats', () => {
    it('should fetch alert statistics', async () => {
      server.use(
        http.get(`${API_URL}/api/alerts/stats`, () => {
          return HttpResponse.json({
            total: 20,
            critical: 5,
            unresolved: 12,
            false_positives: 2,
          })
        })
      )

      const stats = await apiClient.getAlertStats()

      expect(stats.total).toBe(20)
      expect(stats.critical).toBe(5)
      expect(stats.unresolved).toBe(12)
      expect(stats.false_positives).toBe(2)
    })
  })

  describe('updateAlertStatus', () => {
    it('should update alert status', async () => {
      const alertId = '123'
      
      server.use(
        http.put(`${API_URL}/api/alerts/${alertId}/status`, async ({ request }) => {
          const body = await request.json() as { status: string }
          expect(body).toEqual({ status: 'acknowledged' })

          return HttpResponse.json({
            id: alertId,
            status: 'acknowledged',
            title: 'Test Alert',
            severity: 'high',
            facility_id: 'facility_a',
            timestamp: '2024-01-15T10:00:00Z',
            description: 'Test',
            sources: [],
          })
        })
      )

      const result = await apiClient.updateAlertStatus(alertId, 'acknowledged')

      expect(result.status).toBe('acknowledged')
    })
  })
})

describe('API Client - FL Status', () => {
  const API_URL = 'http://localhost:8000'

  describe('getCurrentFLRound', () => {
    it('should fetch current FL round', async () => {
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
        })
      )

      const round = await apiClient.getCurrentFLRound()

      expect(round?.round_number).toBe(42)
      expect(round?.progress).toBe(67)
      expect(round?.phase).toBe('training')
    })

    it('should return null when no active round', async () => {
      server.use(
        http.get(`${API_URL}/api/fl/rounds/current`, () => {
          return HttpResponse.json(null)
        })
      )

      const round = await apiClient.getCurrentFLRound()

      expect(round).toBeNull()
    })
  })

  describe('getFLClients', () => {
    it('should fetch all FL clients', async () => {
      server.use(
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
        })
      )

      const clients = await apiClient.getFLClients()

      expect(clients).toHaveLength(2)
      expect(clients[0].name).toBe('Facility A')
      expect(clients[1].name).toBe('Facility B')
    })
  })

  describe('triggerFLRound', () => {
    it('should trigger new FL round', async () => {
      server.use(
        http.post(`${API_URL}/api/fl/rounds/trigger`, () => {
          return HttpResponse.json({
            id: 2,
            round_number: 43,
            status: 'in-progress',
            phase: 'distributing',
            progress: 0,
            clients: [],
            epsilon: 0.5,
            model_accuracy: 0,
            start_time: '2024-01-15T10:00:00Z',
          }, { status: 201 })
        })
      )

      const round = await apiClient.triggerFLRound()

      expect(round.round_number).toBe(43)
      expect(round.status).toBe('in-progress')
    })
  })

  describe('getPrivacyMetrics', () => {
    it('should fetch privacy metrics', async () => {
      server.use(
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

      const metrics = await apiClient.getPrivacyMetrics()

      expect(metrics.epsilon).toBe(0.82)
      expect(metrics.delta).toBe('10⁻⁵')
      expect(metrics.encryption).toBe('AES-256')
    })
  })
})
