/**
 * Real REST API client for Ice Stream (Master 7).
 * Connects directly to FastAPI backend without mock or simulated data.
 */

// Normalize backend URL: if provided, guarantee it routes to /api endpoint
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errDetail = 'An error occurred while fetching data';
      let errCode = 'API_ERROR';
      try {
        const body = await res.json();
        if (body.detail?.error?.message) {
          errDetail = body.detail.error.message;
          errCode = body.detail.error.code || errCode;
        } else if (typeof body.detail === 'string') {
          errDetail = body.detail;
        }
      } catch {
        // use default error message
      }
      throw new ApiError(errDetail, res.status, errCode);
    }
    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : 'Network error: backend unreachable';
    throw new ApiError(msg, 0, 'NETWORK_ERROR');
  }
}

export const api = {
  getHealth: () => request<{
    status: string;
    pipeline_state: string;
    circuit_state: string;
    uptime_seconds: number;
    timestamp: string;
    service: string;
    version: string;
  }>('/health'),

  getMetrics: () => request<{
    processed_events_total: number;
    valid_events_total: number;
    invalid_events_total: number;
    current_error_rate: number;
    quality_score: number;
    throughput_events_per_second: number;
    circuit_state: string;
    pipeline_state: string;
    incident_count: number;
    active_incident_count: number;
    recovery_attempts: number;
    last_successful_checkpoint: string | null;
    last_event_time: string | null;
    uptime_seconds: number;
  }>('/metrics'),

  getIncidents: (status?: string, limit = 50) => {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    query.append('limit', String(limit));
    return request<any[]>(`/incidents?${query.toString()}`);
  },

  getActiveIncidents: () => request<any[]>('/incidents/active'),

  getIncident: (id: string) => request<any>(`/incidents/${id}`),

  acknowledgeIncident: (id: string) =>
    request<any>(`/incidents/${id}/acknowledge`, { method: 'POST' }),

  resolveIncident: (id: string, reason: string) =>
    request<any>(`/incidents/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  triggerRecovery: () =>
    request<{
      success: boolean;
      circuit_state: string;
      recovery_attempts: number;
      message: string;
    }>('/recovery', { method: 'POST' }),

  getPipelineStatus: () =>
    request<{
      pipeline_state: string;
      circuit_state: string;
      nodes: any[];
      edges: any[];
      metrics: any;
    }>('/pipeline/status'),

  getLakehouseStatus: () => request<any>('/lakehouse/status'),

  getLakehouseTables: () => request<any[]>('/lakehouse/tables'),

  getLakehouseSnapshots: () => request<any[]>('/lakehouse/snapshots'),

  getSystemInfo: () => request<any>('/system'),

  // Quarantine & DLQ
  getQuarantineRecords: (params?: { limit?: number; rule_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.rule_id) query.append('rule_id', params.rule_id);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request<any[]>(`/quarantine${qs ? `?${qs}` : ''}`);
  },

  getQuarantineRecord: (id: string) => request<any>(`/quarantine/${id}`),

  clearQuarantine: () => request<any>('/quarantine', { method: 'DELETE' }),

  // Simulation & Generator
  produceSimulationBatch: (data: { count?: number; error_rate?: number; scenario?: string }) =>
    request<any>('/simulation/produce', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  injectViolation: (rule_id: string, count = 1) =>
    request<any>('/simulation/inject', {
      method: 'POST',
      body: JSON.stringify({ rule_id, count }),
    }),

  resetSimulation: () => request<any>('/simulation/reset', { method: 'POST' }),

  startSimulationStream: (error_rate = 0.0) =>
    request<any>(`/simulation/stream/start?error_rate=${error_rate}`, { method: 'POST' }),

  stopSimulationStream: () => request<any>('/simulation/stream/stop', { method: 'POST' }),

  getSimulationStreamStatus: () => request<{ running: boolean; error_rate: number }>('/simulation/stream/status'),
};
