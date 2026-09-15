import { create } from 'zustand';
import { 
  MarkerType,
  applyNodeChanges, 
  type Node, 
  type Edge, 
  type OnNodesChange 
} from '@xyflow/react';
import { api } from '../api/client';
import type { 
  PipelineNodeData, 
  Incident, 
  IcebergSnapshot, 
  SystemStatus, 
  QualityRule, 
  QuarantineRecord 
} from '../types';

export type ConnectionStatus = 'LIVE' | 'STALE' | 'OFFLINE';

export interface IncidentRecord {
  incident_id: string;
  incident_type: string;
  severity: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVING' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  circuit_state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  error_rate: number;
  threshold: number;
  processed_count: number;
  valid_count: number;
  invalid_count: number;
  window_start: string;
  window_end: string;
  reason: string;
  affected_component: string;
  recovery_attempts: number;
  resolution_reason?: string | null;
}

export interface CircuitBreakerEvent {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  time: string;
  reason: string;
}

export interface ServiceStatus {
  id: string;
  name: string;
  status: SystemStatus;
  latencyMs: number;
  uptimePercentage: number;
  currentLoad: number;
  lastHeartbeat: string;
}

export interface ActivityItem {
  id: string;
  type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  message: string;
  timestamp: string;
}

export interface AppState {
  // Connection & Health
  connectionStatus: ConnectionStatus;
  status: SystemStatus;
  lastUpdated: string | null;
  pipelineState: 'HEALTHY' | 'DEGRADED' | 'TRIPPED' | 'RECOVERING' | 'FAILED';
  circuitBreakerStatus: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  circuitBreakerThreshold: number;
  recoveryAttempts: number;
  circuitBreakerEvents: CircuitBreakerEvent[];

  // Metrics
  metrics: {
    eventsProcessed: number;
    validEvents: number;
    invalidEvents: number;
    errorRate: number;
    qualityScore: number;
    throughput: number;
    eventsPerSec: number;
    processingLatency: number;
    kafkaLag: number;
    dlqRecords: number;
    activeIncidents: number;
    uptimeSeconds: number;
    lastCheckpoint: string | null;
    lastEventTime: string | null;
  };

  // Quality Aggregations
  quality: {
    qualityScore: number;
    validEvents: number;
    invalidEvents: number;
    totalEvents: number;
  };

  // Live React Flow Topology
  nodes: Node<PipelineNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<PipelineNodeData>>;
  setNodes: (nodes: Node<PipelineNodeData>[]) => void;

  // Incidents
  incidents: Incident[];
  activeIncidents: IncidentRecord[];
  incidentHistory: IncidentRecord[];

  // Lakehouse Storage Info
  snapshots: IcebergSnapshot[];
  lakehouseTables: Array<{
    name: string;
    type: string;
    format: string;
    partition_spec: string;
    warehouse_path: string;
    description: string;
    metadata_location?: string;
  }>;
  lakehouseStatus: Record<string, unknown> | null;

  // System & Services
  services: ServiceStatus[];
  system: Record<string, unknown> | null;
  activityFeed: ActivityItem[];
  qualityRules: QualityRule[];
  quarantineRecords: QuarantineRecord[];

  // Simulation / Demo flags (Truthful operations)
  isSimulationRunning: boolean;

  // Actions
  fetchInitialData: () => Promise<void>;
  fetchQuarantineRecords: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  triggerRecovery: () => Promise<boolean>;
  acknowledgeIncident: (id: string) => Promise<boolean>;
  resolveIncident: (id: string, reason: string) => Promise<boolean>;
  refreshIncidents: () => Promise<void>;
  refreshLakehouse: () => Promise<void>;

  // Simulation & Generator Actions
  simulateTick: () => void;
  injectWarning: () => Promise<void>;
  injectSchemaFailure: () => Promise<void>;
  openCircuitBreaker: () => Promise<void>;
  toggleSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  injectDemoScenario: (scenario: string) => Promise<void>;
}

const CANONICAL_RULES: QualityRule[] = [
  { id: 'DQ-001', name: 'REQUIRED_FIELD_MISSING', description: 'Mandatory event fields (event_id, timestamp, customer_id, amount) must be present', severity: 'critical', threshold: '0%', status: 'active', violationCount: 0 },
  { id: 'DQ-002', name: 'NULL_REQUIRED_FIELD', description: 'Mandatory fields must not evaluate to null or empty string', severity: 'critical', threshold: '0%', status: 'active', violationCount: 0 },
  { id: 'DQ-003', name: 'INVALID_TYPE', description: 'Payload field data types must strictly conform to schema specification', severity: 'error', threshold: '0.1%', status: 'active', violationCount: 0 },
  { id: 'DQ-004', name: 'INVALID_RANGE', description: 'Numeric values must fall within domain ranges (amount > 0 and <= 1,000,000)', severity: 'error', threshold: '0.1%', status: 'active', violationCount: 0 },
  { id: 'DQ-005', name: 'INVALID_ENUM', description: 'Categorical fields must match enumerated domains (status, payment_method)', severity: 'warning', threshold: '0.5%', status: 'active', violationCount: 0 },
  { id: 'DQ-006', name: 'DUPLICATE_EVENT', description: 'Event ID must be globally unique within tumbling state deduplication window', severity: 'warning', threshold: '1.0%', status: 'active', violationCount: 0 },
  { id: 'DQ-007', name: 'SCHEMA_MISMATCH', description: 'Record fields and types must adhere to registered avro/json table schema', severity: 'critical', threshold: '0%', status: 'active', violationCount: 0 },
  { id: 'DQ-008', name: 'UNKNOWN_SCHEMA_VERSION', description: 'Schema version in payload must be known and registered with validation engine', severity: 'critical', threshold: '0%', status: 'active', violationCount: 0 }
];

const defaultNodes: Node<PipelineNodeData>[] = [
  // Column 1: Ingestion Sources
  {
    id: 'source',
    type: 'custom',
    position: { x: 40, y: 40 },
    data: {
      id: 'source',
      label: 'Python Producer',
      type: 'source',
      status: 'HEALTHY',
      description: 'Kafka streaming transaction generator',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 12, processed: 0, errorRate: 0, errors: 0 }
    }
  },
  {
    id: 'kafka',
    type: 'custom',
    position: { x: 40, y: 300 },
    data: {
      id: 'kafka',
      label: 'Aiven Kafka',
      type: 'kafka',
      status: 'HEALTHY',
      description: 'SASL_SSL events topic broker',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 18, processed: 0, errorRate: 0, errors: 0 }
    }
  },

  // Column 2: Compute & Real-time Validation
  {
    id: 'flink',
    type: 'custom',
    position: { x: 420, y: 40 },
    data: {
      id: 'flink',
      label: 'Apache Flink 1.18',
      type: 'flink',
      status: 'HEALTHY',
      description: '10s tumbling window stream aggregation',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 24, processed: 0, errorRate: 0, errors: 0 }
    }
  },
  {
    id: 'quality',
    type: 'custom',
    position: { x: 420, y: 300 },
    data: {
      id: 'quality',
      label: 'Validation Engine',
      type: 'quality',
      status: 'HEALTHY',
      description: 'Rules DQ-001 through DQ-008 schema validation',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 15, processed: 0, errorRate: 0, errors: 0 }
    }
  },

  // Column 3: Circuit Breaker Gate
  {
    id: 'circuit',
    type: 'custom',
    position: { x: 800, y: 170 },
    data: {
      id: 'circuit',
      label: 'Circuit Breaker',
      type: 'analytics',
      status: 'HEALTHY',
      description: 'Strict 2% error threshold gate',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 5, processed: 0, errorRate: 0, errors: 0 }
    }
  },

  // Column 4: Storage Sinks (Clean Lakehouse vs DLQ Quarantine)
  {
    id: 'clean_sink',
    type: 'custom',
    position: { x: 1180, y: 40 },
    data: {
      id: 'clean_sink',
      label: 'Iceberg Clean Sink',
      type: 'storage',
      status: 'HEALTHY',
      description: 'Backblaze B2 S3FileIO + Parquet lakehouse',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 45, processed: 0, errorRate: 0, errors: 0 }
    }
  },
  {
    id: 'dlq_sink',
    type: 'custom',
    position: { x: 1180, y: 300 },
    data: {
      id: 'dlq_sink',
      label: 'Iceberg DLQ Sink',
      type: 'dlq',
      status: 'HEALTHY',
      description: 'Backblaze B2 Quarantine Parquet store',
      lastActivity: new Date().toISOString(),
      metrics: { throughput: 0, latency: 40, processed: 0, errorRate: 0, errors: 0 }
    }
  }
];

const defaultEdges: Edge[] = [
  { 
    id: 'e-source-kafka', 
    source: 'source', 
    sourceHandle: 'bottom',
    target: 'kafka', 
    targetHandle: 'top',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
    data: { state: 'HEALTHY' }
  },
  { 
    id: 'e-kafka-flink', 
    source: 'kafka', 
    sourceHandle: 'right',
    target: 'flink', 
    targetHandle: 'left',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
    data: { state: 'HEALTHY', label: 'Stream Feed' }
  },
  { 
    id: 'e-kafka-quality', 
    source: 'kafka', 
    sourceHandle: 'right',
    target: 'quality', 
    targetHandle: 'left',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
    data: { state: 'HEALTHY', label: 'DQ Rules' }
  },
  { 
    id: 'e-flink-circuit', 
    source: 'flink', 
    sourceHandle: 'right',
    target: 'circuit', 
    targetHandle: 'left',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    data: { state: 'HEALTHY' }
  },
  { 
    id: 'e-quality-circuit', 
    source: 'quality', 
    sourceHandle: 'right',
    target: 'circuit', 
    targetHandle: 'left',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    data: { state: 'HEALTHY' }
  },
  { 
    id: 'e-circuit-clean', 
    source: 'circuit', 
    sourceHandle: 'right',
    target: 'clean_sink', 
    targetHandle: 'left',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
    data: { state: 'HEALTHY', label: 'Valid (≤ 2%)' }
  },
  { 
    id: 'e-circuit-dlq', 
    source: 'circuit', 
    sourceHandle: 'right',
    target: 'dlq_sink', 
    targetHandle: 'left',
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#f43f5e' },
    data: { state: 'HEALTHY', label: 'Quarantine' }
  }
];

let wsInstance: WebSocket | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;

export const useStore = create<AppState>((set, get) => ({
  connectionStatus: 'OFFLINE',
  status: 'HEALTHY',
  lastUpdated: null,
  pipelineState: 'HEALTHY',
  circuitBreakerStatus: 'CLOSED',
  circuitBreakerThreshold: 2.0,
  recoveryAttempts: 0,
  circuitBreakerEvents: [
    { state: 'CLOSED', time: new Date().toISOString(), reason: 'Initial healthy state — Error rate under 2.0%' }
  ],

  metrics: {
    eventsProcessed: 0,
    validEvents: 0,
    invalidEvents: 0,
    errorRate: 0.0,
    qualityScore: 100.0,
    throughput: 0,
    eventsPerSec: 0,
    processingLatency: 22,
    kafkaLag: 0,
    dlqRecords: 0,
    activeIncidents: 0,
    uptimeSeconds: 0,
    lastCheckpoint: null,
    lastEventTime: null
  },

  quality: {
    qualityScore: 100.0,
    validEvents: 0,
    invalidEvents: 0,
    totalEvents: 0
  },

  nodes: defaultNodes,
  edges: defaultEdges,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    });
  },

  setNodes: (nodes) => set({ nodes }),

  incidents: [],
  activeIncidents: [],
  incidentHistory: [],

  snapshots: [],
  lakehouseTables: [
    {
      name: 'clean_events',
      type: 'CLEAN',
      format: 'PARQUET',
      partition_spec: 'day(timestamp)',
      warehouse_path: 's3a://iceberg-lakehouse/warehouse/clean_events',
      description: 'Validated transactions meeting all DQ-001 through DQ-008 quality standards'
    },
    {
      name: 'dlq_events',
      type: 'QUARANTINE_DLQ',
      format: 'PARQUET',
      partition_spec: 'rule_id, day(timestamp)',
      warehouse_path: 's3a://iceberg-lakehouse/warehouse/dlq_events',
      description: 'Quarantine storage for payloads failing validation rules or circuit tripped events'
    }
  ],
  lakehouseStatus: null,

  services: [
    { id: 'kafka', name: 'Aiven Kafka Cluster', status: 'HEALTHY', latencyMs: 18, uptimePercentage: 99.98, currentLoad: 35, lastHeartbeat: new Date().toISOString() },
    { id: 'flink', name: 'Apache Flink Engine (v1.18.1)', status: 'HEALTHY', latencyMs: 24, uptimePercentage: 99.95, currentLoad: 42, lastHeartbeat: new Date().toISOString() },
    { id: 'iceberg', name: 'Iceberg + Backblaze B2 Lakehouse', status: 'HEALTHY', latencyMs: 45, uptimePercentage: 100.0, currentLoad: 20, lastHeartbeat: new Date().toISOString() },
    { id: 'quality', name: 'ValidationEngine (DQ-001..008)', status: 'HEALTHY', latencyMs: 12, uptimePercentage: 99.99, currentLoad: 28, lastHeartbeat: new Date().toISOString() }
  ],

  system: null,
  activityFeed: [
    { id: '1', type: 'SUCCESS', message: 'Pipeline initialized with Backblaze B2 storage', timestamp: new Date().toISOString() },
    { id: '2', type: 'INFO', message: 'Connected to Aiven Kafka SASL_SSL streaming cluster', timestamp: new Date().toISOString() }
  ],
  qualityRules: CANONICAL_RULES,
  quarantineRecords: [],

  isSimulationRunning: false,

  fetchInitialData: async () => {
    try {
      const [health, metricsData, incidentList, lakehouseStatusData, snapshotsData, systemData, quarantineData] = await Promise.allSettled([
        api.getHealth(),
        api.getMetrics(),
        api.getIncidents(undefined, 100),
        api.getLakehouseStatus(),
        api.getLakehouseSnapshots(),
        api.getSystemInfo(),
        api.getQuarantineRecords({ limit: 100 }),
      ]);

      let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
      let pipelineHealth: SystemStatus = 'HEALTHY';
      if (health.status === 'fulfilled') {
        const h = health.value;
        circuitState = (h.circuit_state as 'CLOSED' | 'OPEN' | 'HALF_OPEN') || 'CLOSED';
        pipelineHealth = circuitState === 'OPEN' ? 'CRITICAL' : circuitState === 'HALF_OPEN' ? 'WARNING' : 'HEALTHY';
      }

      let m = get().metrics;
      if (metricsData.status === 'fulfilled') {
        const d = metricsData.value;
        const total = d.processed_events_total ?? 0;
        const valid = d.valid_events_total ?? 0;
        const invalid = d.invalid_events_total ?? 0;
        const errorRate = d.current_error_rate !== undefined ? d.current_error_rate * 100 : (total > 0 ? (invalid / total) * 100 : 0);
        const qualityScore = d.quality_score ?? Math.max(0, 100 - errorRate);
        const throughput = d.throughput_events_per_second ?? 0;

        m = {
          ...m,
          eventsProcessed: total,
          validEvents: valid,
          invalidEvents: invalid,
          errorRate,
          qualityScore,
          throughput,
          eventsPerSec: throughput,
          dlqRecords: invalid,
          activeIncidents: d.circuit_state === 'OPEN' ? 1 : 0
        };
      }

      const incidentsMap: Incident[] = [];
      const incidentRecords: IncidentRecord[] = [];
      if (incidentList.status === 'fulfilled') {
        const raw = Array.isArray(incidentList.value) ? incidentList.value : (incidentList.value as any).incidents || [];
        raw.forEach((inc: any) => {
          incidentRecords.push({
            incident_id: inc.incident_id,
            incident_type: inc.incident_type || 'CIRCUIT_BREAKER_TRIP',
            severity: inc.severity || 'critical',
            status: inc.status,
            created_at: inc.created_at,
            updated_at: inc.updated_at,
            resolved_at: inc.resolved_at,
            circuit_state: inc.circuit_state,
            error_rate: inc.error_rate || 0,
            threshold: inc.threshold || 2.0,
            processed_count: inc.processed_count || 0,
            valid_count: inc.valid_count || 0,
            invalid_count: inc.invalid_count || 0,
            window_start: inc.window_start || '',
            window_end: inc.window_end || '',
            reason: inc.reason || 'Threshold exceeded',
            affected_component: inc.affected_component || 'ValidationEngine',
            recovery_attempts: inc.recovery_attempts || 0,
            resolution_reason: inc.resolution_reason
          });

          incidentsMap.push({
            id: inc.incident_id,
            severity: (inc.severity?.toLowerCase() as any) || 'critical',
            status: inc.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
            startedAt: inc.created_at,
            resolvedAt: inc.resolved_at,
            duration: inc.resolved_at ? 'Resolved' : 'Active',
            errorRate: inc.error_rate ? Number((inc.error_rate * 100).toFixed(2)) : 0,
            threshold: 2.0,
            affectedComponent: inc.affected_component || 'ValidationEngine',
            rootCause: inc.reason || 'Error rate exceeded strict 2% threshold',
            description: `Incident ${inc.incident_id}: ${inc.reason || 'Circuit breaker opened'}`
          });
        });
      }

      let snaps: IcebergSnapshot[] = [];
      if (snapshotsData.status === 'fulfilled') {
        const rawSnaps = Array.isArray(snapshotsData.value) ? snapshotsData.value : (snapshotsData.value as any).snapshots || [];
        snaps = rawSnaps.map((s: any) => ({
          id: s.snapshot_id || s.id || String(s.sequence_number || 'snap'),
          timestamp: s.timestamp || new Date().toISOString(),
          operation: s.operation || 'APPEND',
          records: s.records || s.record_count || 0,
          manifestFiles: s.manifest_files || 1
        }));
      }

      let qRecords: QuarantineRecord[] = [];
      const ruleCounts: Record<string, number> = {};
      if (quarantineData.status === 'fulfilled' && Array.isArray(quarantineData.value)) {
        qRecords = quarantineData.value;
        qRecords.forEach((r: any) => {
          const rid = (r.rule_id || r.ruleId || '').toUpperCase();
          ruleCounts[rid] = (ruleCounts[rid] || 0) + 1;
        });
      }

      const updatedRules = CANONICAL_RULES.map((rule) => ({
        ...rule,
        violationCount: ruleCounts[rule.id] || 0,
      }));

      set({
        connectionStatus: 'LIVE',
        status: pipelineHealth,
        pipelineState: circuitState === 'OPEN' ? 'TRIPPED' : circuitState === 'HALF_OPEN' ? 'RECOVERING' : 'HEALTHY',
        circuitBreakerStatus: circuitState,
        metrics: m,
        quality: {
          qualityScore: m.qualityScore,
          validEvents: m.validEvents,
          invalidEvents: m.invalidEvents,
          totalEvents: m.eventsProcessed
        },
        incidents: incidentsMap,
        activeIncidents: incidentRecords.filter(i => i.status !== 'RESOLVED'),
        incidentHistory: incidentRecords,
        snapshots: snaps,
        quarantineRecords: qRecords,
        qualityRules: updatedRules,
        lakehouseStatus: lakehouseStatusData.status === 'fulfilled' ? lakehouseStatusData.value : null,
        system: systemData.status === 'fulfilled' ? systemData.value : null,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      set({ connectionStatus: 'STALE' });
    }
  },

  fetchQuarantineRecords: async () => {
    try {
      const records = await api.getQuarantineRecords({ limit: 100 });
      const ruleCounts: Record<string, number> = {};
      records.forEach((r: any) => {
        const rid = (r.rule_id || r.ruleId || '').toUpperCase();
        ruleCounts[rid] = (ruleCounts[rid] || 0) + 1;
      });
      const updatedRules = CANONICAL_RULES.map((rule) => ({
        ...rule,
        violationCount: ruleCounts[rule.id] || 0,
      }));
      set({
        quarantineRecords: records,
        qualityRules: updatedRules,
      });
    } catch (e) {
      console.error('Failed to fetch quarantine records:', e);
    }
  },

  connectWebSocket: () => {
    if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Resolve WebSocket endpoint: explicit VITE_WS_URL > derived from VITE_API_URL > local window.location
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl && import.meta.env.VITE_API_URL) {
      const apiHost = (import.meta.env.VITE_API_URL as string)
        .replace(/^https?:\/\//, '')
        .replace(/\/api\/?$/, '')
        .replace(/\/+$/, '');
      const wsProto = (import.meta.env.VITE_API_URL as string).startsWith('https://') ? 'wss:' : 'ws:';
      wsUrl = `${wsProto}//${apiHost}/ws`;
    }
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}/ws`;
    }

    try {
      wsInstance = new WebSocket(wsUrl);

      wsInstance.onopen = () => {
        set({ connectionStatus: 'LIVE' });
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
            wsInstance.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      wsInstance.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const now = new Date().toISOString();

          if (msg.type === 'initial_state' || msg.type === 'metrics_update') {
            const data = msg.payload || msg.data || {};
            const total = data.processed_events_total ?? data.processed_count ?? 0;
            const valid = data.valid_events_total ?? data.valid_count ?? 0;
            const invalid = data.invalid_events_total ?? data.invalid_count ?? 0;
            const errorRate = data.current_error_rate !== undefined
              ? data.current_error_rate * 100
              : (data.error_rate !== undefined ? data.error_rate * 100 : (total > 0 ? (invalid / total) * 100 : 0));
            const qualityScore = data.quality_score ?? Math.max(0, 100 - errorRate);
            const throughput = data.throughput_events_per_second ?? data.throughput ?? 0;
            const circuit = (data.circuit_state as 'CLOSED' | 'OPEN' | 'HALF_OPEN') || get().circuitBreakerStatus;
            const activeIncCount = data.active_incident_count ?? (Array.isArray(data.active_incidents) ? data.active_incidents.length : (circuit === 'OPEN' ? 1 : 0));

            // If invalid count changed or > 0, refresh quarantine records and incidents
            if (invalid > 0 && invalid !== get().metrics.invalidEvents) {
              get().fetchQuarantineRecords();
              get().refreshIncidents();
            }

            set((state) => ({
              connectionStatus: 'LIVE',
              lastUpdated: now,
              circuitBreakerStatus: circuit,
              status: circuit === 'OPEN' ? 'CRITICAL' : circuit === 'HALF_OPEN' ? 'WARNING' : 'HEALTHY',
              pipelineState: circuit === 'OPEN' ? 'TRIPPED' : circuit === 'HALF_OPEN' ? 'RECOVERING' : 'HEALTHY',
              metrics: {
                ...state.metrics,
                eventsProcessed: total,
                validEvents: valid,
                invalidEvents: invalid,
                errorRate,
                qualityScore,
                throughput,
                eventsPerSec: throughput,
                dlqRecords: invalid,
                activeIncidents: activeIncCount
              },
              quality: {
                qualityScore,
                validEvents: valid,
                invalidEvents: invalid,
                totalEvents: total
              }
            }));
          } else if (msg.type === 'circuit_state_changed') {
            const data = msg.data || {};
            const toState = (data.to_state as 'CLOSED' | 'OPEN' | 'HALF_OPEN') || 'CLOSED';
            const reason = data.reason || 'Circuit state transition';

            set((state) => ({
              circuitBreakerStatus: toState,
              status: toState === 'OPEN' ? 'CRITICAL' : toState === 'HALF_OPEN' ? 'WARNING' : 'HEALTHY',
              pipelineState: toState === 'OPEN' ? 'TRIPPED' : toState === 'HALF_OPEN' ? 'RECOVERING' : 'HEALTHY',
              circuitBreakerEvents: [
                { state: toState, time: now, reason },
                ...state.circuitBreakerEvents.slice(0, 19)
              ],
              activityFeed: [
                { id: String(Date.now()), type: toState === 'OPEN' ? 'CRITICAL' : 'SUCCESS', message: `Circuit breaker transitioned to ${toState}: ${reason}`, timestamp: now },
                ...state.activityFeed.slice(0, 19)
              ]
            }));
          }
        } catch (e) {
          console.error('Error processing WebSocket frame:', e);
        }
      };

      wsInstance.onclose = () => {
        set({ connectionStatus: 'OFFLINE' });
        if (pingInterval) clearInterval(pingInterval);
        setTimeout(() => {
          get().connectWebSocket();
        }, 5000);
      };

      wsInstance.onerror = () => {
        set({ connectionStatus: 'STALE' });
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      set({ connectionStatus: 'OFFLINE' });
    }
  },

  disconnectWebSocket: () => {
    if (pingInterval) clearInterval(pingInterval);
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }
  },

  triggerRecovery: async () => {
    try {
      const res = await api.triggerRecovery();
      if (res.success) {
        set((state) => ({
          circuitBreakerStatus: 'HALF_OPEN',
          status: 'WARNING',
          pipelineState: 'RECOVERING',
          recoveryAttempts: state.recoveryAttempts + 1,
          circuitBreakerEvents: [
            { state: 'HALF_OPEN', time: new Date().toISOString(), reason: 'Manual recovery triggered via API (/api/recovery)' },
            ...state.circuitBreakerEvents
          ],
          activityFeed: [
            { id: String(Date.now()), type: 'WARNING', message: 'Manual recovery triggered: Circuit is now HALF_OPEN', timestamp: new Date().toISOString() },
            ...state.activityFeed
          ]
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Recovery request failed:', e);
      return false;
    }
  },

  acknowledgeIncident: async (id: string) => {
    try {
      const res = await api.acknowledgeIncident(id);
      if (res.success) {
        await get().refreshIncidents();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to acknowledge incident:', e);
      return false;
    }
  },

  resolveIncident: async (id: string, reason: string) => {
    try {
      const res = await api.resolveIncident(id, reason);
      if (res.success) {
        await get().refreshIncidents();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to resolve incident:', e);
      return false;
    }
  },

  refreshIncidents: async () => {
    try {
      const res = await api.getIncidents(undefined, 100);
      const raw = Array.isArray(res) ? res : (res as any).incidents || [];
      const incidentRecords: IncidentRecord[] = raw.map((inc: any) => ({
        incident_id: inc.incident_id,
        incident_type: inc.incident_type || 'CIRCUIT_BREAKER_TRIP',
        severity: inc.severity || 'critical',
        status: inc.status,
        created_at: inc.created_at,
        updated_at: inc.updated_at,
        resolved_at: inc.resolved_at,
        circuit_state: inc.circuit_state,
        error_rate: inc.error_rate || 0,
        threshold: inc.threshold || 2.0,
        processed_count: inc.processed_count || 0,
        valid_count: inc.valid_count || 0,
        invalid_count: inc.invalid_count || 0,
        window_start: inc.window_start || '',
        window_end: inc.window_end || '',
        reason: inc.reason || 'Threshold exceeded',
        affected_component: inc.affected_component || 'ValidationEngine',
        recovery_attempts: inc.recovery_attempts || 0,
        resolution_reason: inc.resolution_reason
      }));

      const incidentsMap: Incident[] = raw.map((inc: any) => ({
        id: inc.incident_id,
        severity: (inc.severity?.toLowerCase() as any) || 'critical',
        status: inc.status === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
        startedAt: inc.created_at,
        resolvedAt: inc.resolved_at,
        duration: inc.resolved_at ? 'Resolved' : 'Active',
        errorRate: inc.error_rate ? Number((inc.error_rate * 100).toFixed(2)) : 0,
        threshold: 2.0,
        affectedComponent: inc.affected_component || 'ValidationEngine',
        rootCause: inc.reason || 'Error rate exceeded strict 2% threshold',
        description: `Incident ${inc.incident_id}: ${inc.reason || 'Circuit breaker opened'}`
      }));

      set({
        incidents: incidentsMap,
        activeIncidents: incidentRecords.filter(i => i.status !== 'RESOLVED'),
        incidentHistory: incidentRecords
      });
    } catch (e) {
      console.error('Failed to refresh incidents:', e);
    }
  },

  refreshLakehouse: async () => {
    try {
      const [statusRes, snapshotsRes] = await Promise.all([
        api.getLakehouseStatus(),
        api.getLakehouseSnapshots()
      ]);
      const rawSnaps = Array.isArray(snapshotsRes) ? snapshotsRes : (snapshotsRes as any).snapshots || [];
      const snaps: IcebergSnapshot[] = rawSnaps.map((s: any) => ({
        id: s.snapshot_id || s.id || String(s.sequence_number || 'snap'),
        timestamp: s.timestamp || new Date().toISOString(),
        operation: s.operation || 'APPEND',
        records: s.records || s.record_count || 0,
        manifestFiles: s.manifest_files || 1
      }));
      set({
        lakehouseStatus: statusRes,
        snapshots: snaps
      });
    } catch (e) {
      console.error('Failed to refresh lakehouse:', e);
    }
  },

  // Real simulation engine actions connected to backend API
  simulateTick: () => {
    get().fetchInitialData();
  },

  injectWarning: async () => {
    try {
      await api.produceSimulationBatch({ scenario: 'degradation', count: 30 });
      await get().fetchInitialData();
      await get().fetchQuarantineRecords();
      set((state) => ({
        activityFeed: [
          { id: String(Date.now()), type: 'WARNING', message: 'Injected load warning: Elevated transaction throughput with sub-threshold violations', timestamp: new Date().toISOString() },
          ...state.activityFeed.slice(0, 19)
        ]
      }));
    } catch (e) {
      console.error('injectWarning error:', e);
    }
  },

  injectSchemaFailure: async () => {
    try {
      const res = await api.injectViolation('DQ-003', 2);
      await get().fetchInitialData();
      await get().fetchQuarantineRecords();
      set((state) => ({
        activityFeed: [
          { id: String(Date.now()), type: 'CRITICAL', message: `Injected schema failure (DQ-003: INVALID_TYPE): Routed ${res.quarantined_count || 1} records to DLQ Quarantine`, timestamp: new Date().toISOString() },
          ...state.activityFeed.slice(0, 19)
        ]
      }));
    } catch (e) {
      console.error('injectSchemaFailure error:', e);
    }
  },

  openCircuitBreaker: async () => {
    try {
      const res = await api.injectViolation('BREAKER_TRIP', 5);
      await get().fetchInitialData();
      await get().fetchQuarantineRecords();
      set((state) => ({
        activityFeed: [
          { id: String(Date.now()), type: 'CRITICAL', message: `Direct Circuit Breaker trip requested: Injected ${res.invalid} invalid transactions; Circuit state is now OPEN`, timestamp: new Date().toISOString() },
          ...state.activityFeed.slice(0, 19)
        ]
      }));
    } catch (e) {
      console.error('openCircuitBreaker error:', e);
    }
  },

  toggleSimulation: async () => {
    const running = get().isSimulationRunning;
    try {
      if (running) {
        await api.stopSimulationStream();
        set((state) => ({
          isSimulationRunning: false,
          activityFeed: [
            { id: String(Date.now()), type: 'INFO', message: 'Continuous simulation streamer paused', timestamp: new Date().toISOString() },
            ...state.activityFeed.slice(0, 19)
          ]
        }));
      } else {
        await api.startSimulationStream(0.01);
        set((state) => ({
          isSimulationRunning: true,
          activityFeed: [
            { id: String(Date.now()), type: 'SUCCESS', message: 'Continuous streaming generator active: Producing live transactions at 5 events/sec', timestamp: new Date().toISOString() },
            ...state.activityFeed.slice(0, 19)
          ]
        }));
      }
    } catch (e) {
      console.error('toggleSimulation error:', e);
      set((s) => ({ isSimulationRunning: !s.isSimulationRunning }));
    }
  },

  resetSimulation: async () => {
    try {
      await api.resetSimulation();
      await get().fetchInitialData();
      await get().fetchQuarantineRecords();
      set({
        activityFeed: [
          { id: String(Date.now()), type: 'SUCCESS', message: 'Simulation reset: All metrics cleared, circuit restored to CLOSED, quarantine emptied', timestamp: new Date().toISOString() }
        ]
      });
    } catch (e) {
      console.error('resetSimulation error:', e);
    }
  },

  injectDemoScenario: async (scenario: string) => {
    try {
      if (scenario === 'recovery') {
        await api.produceSimulationBatch({ scenario: 'recovery' });
        await get().fetchInitialData();
        await get().fetchQuarantineRecords();
        set((state) => ({
          activityFeed: [
            { id: String(Date.now()), type: 'SUCCESS', message: 'Automated recovery executed: Probe batch verified clean; Circuit restored to CLOSED', timestamp: new Date().toISOString() },
            ...state.activityFeed.slice(0, 19)
          ]
        }));
      } else {
        const res = await api.produceSimulationBatch({ scenario });
        await get().fetchInitialData();
        await get().fetchQuarantineRecords();

        let message = '';
        let type: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' = 'SUCCESS';

        if (scenario === 'incident') {
          message = `Critical failure scenario triggered: Error rate exceeded 2% threshold; Circuit Breaker TRIPPED to OPEN (${res.invalid} bad events quarantined)`;
          type = 'CRITICAL';
        } else if (scenario === 'degradation') {
          message = `Degraded pipeline batch processed: Sub-threshold anomalies detected (${res.invalid} events quarantined, CB CLOSED)`;
          type = 'WARNING';
        } else {
          message = `Healthy pipeline batch processed: ${res.processed} valid transactions passed all 8 DQ rules (0% error rate)`;
          type = 'SUCCESS';
        }

        set((state) => ({
          activityFeed: [
            { id: String(Date.now()), type, message, timestamp: new Date().toISOString() },
            ...state.activityFeed.slice(0, 19)
          ]
        }));
      }
    } catch (e) {
      console.error('injectDemoScenario error:', e);
    }
  }
}));
