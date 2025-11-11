const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  facility_id: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'false-positive';
  timestamp: string;
  sources: AlertSource[];
  attack_type?: string;
  attack_name?: string;
  correlation_confidence?: number;
  correlation_summary?: string;
}

export interface AlertSource {
  layer: number;
  model_name: string;
  confidence: number;
  detection_time: string;
  evidence: string;
  context_evidence?: Record<string, any>;
}

export interface AlertStats {
  total: number;
  critical: number;
  unresolved: number;
  false_positives: number;
}

export interface FLRound {
  id: number;
  round_number: number;
  status: 'in-progress' | 'completed' | 'failed';
  phase: 'distributing' | 'training' | 'aggregating' | 'complete';
  progress: number;
  epsilon: number | null;
  model_accuracy: number | null;
  clients: FLClient[];
  start_time: string;
  end_time?: string;
}

export interface FLClient {
  id: string;
  name: string;
  facility_id: string;
  status: 'active' | 'delayed' | 'offline';
  progress: number;
  loss: number;
  accuracy: number;
  current_epoch: number;
  total_epochs: number;
}

export interface PrivacyMetrics {
  epsilon: number;
  delta: string;
  data_size: string;
  encryption: string;
  privacy_budget_remaining: number;
}

export interface TechniqueNode {
  id: string;
  name: string;
  type: 'current' | 'predicted';
  probability: number;
}

export interface TechniqueLink {
  source: string;
  target: string;
  probability: number;
}

export interface AttackGraph {
  nodes: TechniqueNode[];
  links: TechniqueLink[];
}

export interface TechniqueDetails {
  id: string;
  name: string;
  description: string;
  detection?: string;
  mitigation?: string;
  platforms: string[];
  tactics: string[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Alerts API
  async getAlerts(params?: {
    severity?: string;
    facility?: string;
    status_filter?: string;
    search?: string;
    time_range?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    alerts: Alert[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request(`/api/alerts${query ? `?${query}` : ''}`);
  }

  async getAlertStats(): Promise<AlertStats> {
    return this.request('/api/alerts/stats');
  }

  async updateAlertStatus(alertId: string, status: string): Promise<Alert> {
    return this.request(`/api/alerts/${alertId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // FL Status API
  async getCurrentFLRound(): Promise<FLRound | null> {
    return this.request('/api/fl/rounds/current');
  }

  async getFLClients(): Promise<FLClient[]> {
    return this.request('/api/fl/clients');
  }

  async getPrivacyMetrics(): Promise<PrivacyMetrics> {
    return this.request('/api/fl/privacy-metrics');
  }

  async triggerFLRound(): Promise<FLRound> {
    return this.request('/api/fl/rounds/trigger', {
      method: 'POST',
    });
  }

  // Predictions API
  async getPredictions(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request(`/api/predictions${query ? `?${query}` : ''}`);
  }

  async getLatestPrediction() {
    return this.request('/api/predictions/latest');
  }

  // MITRE ATT&CK API
  async getAttackGraph(): Promise<AttackGraph> {
    return this.request('/api/mitre/graph');
  }

  async getAllTechniques(): Promise<TechniqueDetails[]> {
    return this.request('/api/mitre/techniques');
  }

  async getTechniqueDetails(techniqueId: string): Promise<TechniqueDetails> {
    return this.request(`/api/mitre/technique/${techniqueId}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
