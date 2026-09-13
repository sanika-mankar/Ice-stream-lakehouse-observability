import { create } from 'zustand';
import type { Node, Edge, OnNodesChange } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';
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
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  triggerRecovery: () => Promise<boolean>;
  acknowledgeIncident: (id: string) => Promise<boolean>;
  resolveIncident: (id: string, reason: string) => Promise<boolean>;
  refreshIncidents: () => Promise<void>;
  refreshLakehouse: () => Promise<void>;

  // Safe stubs for compatibility
  simulateTick: () => void;
  injectWarning: () => void;
  injectSchemaFailure: () => void;
  openCircuitBreaker: () => void;
  toggleSimulation: () => void;
  injectDemoScenario: (scenario: string) => void;
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
  {
    id: 'source',
    type: 'custom',
    position: { x: 50, y: 180 },
    data: { id: 'source', type: 'source', label: 'Python Producer', description: 'Kafka streaming transactions', status: 'HEALTHY', metrics: { throughput: 0, latency: 12, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  },
  {
    id: 'kafka',
    type: 'custom',
    position: { x: 380, y: 180 },
    data: { id: 'kafka', type: 'kafka', label: 'Aiven Kafka', description: 'SASL_SSL events topic', status: 'HEALTHY', metrics: { throughput: 0, latency: 18, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  },
  {
    id: 'flink',
    type: 'custom',
    position: { x: 720, y: 70 },
    data: { id: 'flink', type: 'flink', label: 'Apache Flink 1.18', description: '10s tumbling window stream engine', status: 'HEALTHY', metrics: { throughput: 0, latency: 24, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  },
  {
    id: 'quality',
    type: 'custom',
    position: { x: 720, y: 300 },
    data: { id: 'quality', type: 'quality', label: 'Validation Engine', description: 'Rules DQ-001 through DQ-008', status: 'HEALTHY', metrics: { throughput: 0, latency: 15, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  },
  {
    id: 'circuit',
    type: 'custom',
    position: { x: 1060, y: 180 },
    data: { id: 'circuit', type: 'analytics', label: 'Circuit Breaker', description: 'Strict 2% error threshold gate', status: 'HEALTHY', metrics: { throughput: 0, latency: 5, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  },
  {
    id: 'clean_sink',
    type: 'custom',
    position: { x: 1400, y: 70 },
    data: { id: 'clean_sink', type: 'storage', label: 'Iceberg Clean Sink', description: 'Backblaze B2 S3FileIO + Parquet', status: 'HEALTHY', metrics: { throughput: 0, latency: 45, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  },
  {
    id: 'dlq_sink',
    type: 'custom',
    position: { x: 1400, y: 300 },
    data: { id: 'dlq_sink', type: 'dlq', label: 'Iceberg DLQ Sink', description: 'Backblaze B2 Quarantine Parquet', status: 'HEALTHY', metrics: { throughput: 0, latency: 40, errorRate: 0, processed: 0, errors: 0 }, lastActivity: 'Active' }
  }
];

const defaultEdges: Edge[] = [
  { id: 'e-source-kafka', source: 'source', target: 'kafka', animated: true, style: { stroke: '#00f0ff', strokeWidth: 2 } },
  { id: 'e-kafka-flink', source: 'kafka', target: 'flink', animated: true, style: { stroke: '#ff0055', strokeWidth: 2 } },
  { id: 'e-kafka-quality', source: 'kafka', target: 'quality', animated: true, style: { stroke: '#ff0055', strokeWidth: 2 } },
  { id: 'e-flink-circuit', source: 'flink', target: 'circuit', animated: true, style: { stroke: '#ffaa00', strokeWidth: 2 } },
  { id: 'e-quality-circuit', source: 'quality', target: 'circuit', animated: true, style: { stroke: '#00ff66', strokeWidth: 2 } },
  { id: 'e-circuit-clean', source: 'circuit', target: 'clean_sink', animated: true, style: { stroke: '#00ff66', strokeWidth: 2 } },
  { id: 'e-circuit-dlq', source: 'circuit', target: 'dlq_sink', animated: false, style: { stroke: '#ff3344', strokeWidth: 2 } }
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
      const [health, metricsData, incidentList, lakehouseStatusData, snapshotsData, systemData] = await Promise.allSettled([
        api.getHealth(),
        api.getMetrics(),
        api.getIncidents(undefined, 100),
        api.getLakehouseStatus(),
        api.getLakehouseSnapshots(),
        api.getSystemInfo()
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
        const total = d.processed_events_total || 0;
        const valid = d.valid_events_total || 0;
        const invalid = d.invalid_events_total || 0;
        const errorRate = d.current_error_rate ? d.current_error_rate * 100 : (total > 0 ? (invalid / total) * 100 : 0);
        const qualityScore = d.quality_score || Math.max(0, 100 - errorRate);
        const throughput = d.throughput_events_per_second || 0;

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
        lakehouseStatus: lakehouseStatusData.status === 'fulfilled' ? lakehouseStatusData.value : null,
        system: systemData.status === 'fulfilled' ? systemData.value : null,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      set({ connectionStatus: 'STALE' });
    }
  },

  connectWebSocket: () => {
    if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

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
            const data = msg.data || {};
            const total = data.processed_count || 0;
            const valid = data.valid_count || 0;
            const invalid = data.invalid_count || 0;
            const errorRate = data.error_rate ? data.error_rate * 100 : (total > 0 ? (invalid / total) * 100 : 0);
            const qualityScore = Math.max(0, 100 - errorRate);
            const throughput = data.throughput || 0;
            const circuit = (data.circuit_state as 'CLOSED' | 'OPEN' | 'HALF_OPEN') || get().circuitBreakerStatus;

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
                activeIncidents: circuit === 'OPEN' ? 1 : 0
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

  // Safe stubs to maintain backwards compatibility without fake data
  simulateTick: () => {
    get().fetchInitialData();
  },
  injectWarning: () => {
    console.info('Load warning notification requested');
  },
  injectSchemaFailure: () => {
    console.info('Schema failure observation requested');
  },
  openCircuitBreaker: () => {
    console.info('Circuit breaker test state requested');
  },
  toggleSimulation: () => {
    set((s) => ({ isSimulationRunning: !s.isSimulationRunning }));
  },
  injectDemoScenario: (scenario: string) => {
    if (scenario === 'recovery') {
      get().triggerRecovery();
    } else {
      get().fetchInitialData();
    }
  }
}));
