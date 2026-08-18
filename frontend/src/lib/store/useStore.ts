import { create } from 'zustand';
import type { SystemStatus, DataQualityMetric, ActivityEvent, ServiceHealth, NotificationAlert, PipelineNodeData } from '../types';
import type { Node, Edge, OnNodesChange } from '@xyflow/react';
import { applyNodeChanges } from '@xyflow/react';

interface AppState {
  // Global States
  status: SystemStatus;
  setStatus: (status: SystemStatus) => void;
  
  // Real-time Metrics
  metrics: {
    eventsPerSec: number;
    eventsProcessed: number;
    errorRate: number;
    processingLatency: number;
    kafkaLag: number;
    dlqRecords: number;
    activeIncidents: number;
  };
  quality: DataQualityMetric;
  
  // React Flow State
  nodes: Node<PipelineNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<PipelineNodeData>>;
  setNodes: (nodes: Node<PipelineNodeData>[]) => void;
  
  // Feed & Infrastructure
  activityFeed: ActivityEvent[];
  services: ServiceHealth[];
  notifications: NotificationAlert[];

  // Simulation Triggers & State
  isSimulationRunning: boolean;
  toggleSimulation: () => void;
  simulateTick: () => void;
  injectWarning: () => void;
  injectSchemaFailure: () => void;
  triggerRecovery: () => void;
  openCircuitBreaker: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialNodes: Node<PipelineNodeData>[] = [
  {
    id: 'source',
    type: 'custom',
    position: { x: 50, y: 200 },
    data: { id: 'source', type: 'source', label: 'Data Generators', description: 'Mock transaction producers', status: 'HEALTHY', metrics: { throughput: 2450, latency: 5, errorRate: 0, processed: 1250000, errors: 0 }, lastActivity: new Date().toISOString() }
  },
  {
    id: 'kafka',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: { id: 'kafka', type: 'kafka', label: 'Kafka Ingestion', description: 'Distributed event streaming', status: 'HEALTHY', metrics: { throughput: 2450, latency: 12, errorRate: 0, processed: 1250000, errors: 0 }, lastActivity: new Date().toISOString() }
  },
  {
    id: 'flink',
    type: 'custom',
    position: { x: 750, y: 200 },
    data: { id: 'flink', type: 'flink', label: 'Flink Processing', description: 'Stateful stream processing', status: 'HEALTHY', metrics: { throughput: 2450, latency: 25, errorRate: 0, processed: 1250000, errors: 0 }, lastActivity: new Date().toISOString() }
  },
  {
    id: 'quality',
    type: 'custom',
    position: { x: 1100, y: 200 },
    data: { id: 'quality', type: 'quality', label: 'Quality Engine', description: 'Schema validation rules', status: 'HEALTHY', metrics: { throughput: 2450, latency: 18, errorRate: 0.12, processed: 1250000, errors: 1500 }, lastActivity: new Date().toISOString() }
  },
  {
    id: 'iceberg',
    type: 'custom',
    position: { x: 1450, y: 100 },
    data: { id: 'iceberg', type: 'storage', label: 'Iceberg Catalog', description: 'Data lakehouse storage', status: 'HEALTHY', metrics: { throughput: 2445, latency: 150, errorRate: 0, processed: 1248500, errors: 0 }, lastActivity: new Date().toISOString() }
  },
  {
    id: 'analytics',
    type: 'custom',
    position: { x: 1800, y: 100 },
    data: { id: 'analytics', type: 'analytics', label: 'Analytics API', description: 'Real-time serving layer', status: 'HEALTHY', metrics: { throughput: 1500, latency: 45, errorRate: 0, processed: 850000, errors: 0 }, lastActivity: new Date().toISOString() }
  },
  {
    id: 'dlq',
    type: 'custom',
    position: { x: 1450, y: 300 },
    data: { id: 'dlq', type: 'dlq', label: 'Quarantine / DLQ', description: 'Dead letter queue', status: 'HEALTHY', metrics: { throughput: 5, latency: 10, errorRate: 0, processed: 1500, errors: 0 }, lastActivity: new Date().toISOString() }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'source', target: 'kafka', type: 'custom', data: { state: 'HEALTHY' } },
  { id: 'e2', source: 'kafka', target: 'flink', type: 'custom', data: { state: 'HEALTHY' } },
  { id: 'e3', source: 'flink', target: 'quality', type: 'custom', data: { state: 'HEALTHY' } },
  { id: 'e4', source: 'quality', target: 'iceberg', type: 'custom', data: { state: 'HEALTHY' } },
  { id: 'e5', source: 'iceberg', target: 'analytics', type: 'custom', data: { state: 'HEALTHY' } },
  { id: 'e6', source: 'quality', target: 'dlq', type: 'custom', data: { state: 'HEALTHY' } }
];

export const useStore = create<AppState>((set, get) => ({
  status: 'HEALTHY',
  setStatus: (status) => set({ status }),
  
  metrics: {
    eventsPerSec: 2450,
    eventsProcessed: 1250000,
    errorRate: 0.12,
    processingLatency: 45,
    kafkaLag: 120,
    dlqRecords: 1500,
    activeIncidents: 0,
  },
  
  quality: {
    totalEvents: 1250000,
    validEvents: 1248500,
    invalidEvents: 1500,
    qualityScore: 99.88,
    timestamp: new Date().toISOString(),
  },
  
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  setNodes: (nodes) => set({ nodes }),
  
  activityFeed: [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      severity: 'info',
      source: 'Ingestion Engine',
      eventType: 'Startup',
      message: 'System initialization complete. Pipeline healthy.'
    }
  ],
  
  services: [
    { id: 'kafka', name: 'Kafka Cluster', status: 'HEALTHY', latencyMs: 12, uptimePercentage: 99.99, currentLoad: 45, lastHeartbeat: new Date().toISOString() },
    { id: 'flink', name: 'Flink Processors', status: 'HEALTHY', latencyMs: 25, uptimePercentage: 99.95, currentLoad: 60, lastHeartbeat: new Date().toISOString() },
    { id: 'iceberg', name: 'Iceberg Catalog', status: 'HEALTHY', latencyMs: 150, uptimePercentage: 99.99, currentLoad: 30, lastHeartbeat: new Date().toISOString() },
    { id: 'quality', name: 'Quality Engine', status: 'HEALTHY', latencyMs: 18, uptimePercentage: 99.99, currentLoad: 55, lastHeartbeat: new Date().toISOString() },
  ],
  
  notifications: [],

  isSimulationRunning: true,
  toggleSimulation: () => set(state => ({ isSimulationRunning: !state.isSimulationRunning })),

  simulateTick: () => {
    const { isSimulationRunning, status, metrics, quality, nodes, edges } = get();
    if (!isSimulationRunning) return;
    
    const variance = (Math.random() - 0.5) * 0.1; 
    let newEps = Math.floor(metrics.eventsPerSec * (1 + variance));
    if (newEps < 500) newEps = 500;
    if (newEps > 10000) newEps = 10000;

    const newProcessed = metrics.eventsProcessed + newEps;
    
    // Process Node Updates based on Global Status
    const updatedNodes = nodes.map(node => {
      const isCbOpen = status === 'CIRCUIT_BREAKER_OPEN';
      
      let nodeEps = newEps;
      let nodeLat = node.data.metrics.latency;
      
      if (isCbOpen && (node.id === 'flink' || node.id === 'quality' || node.id === 'iceberg' || node.id === 'analytics')) {
        nodeEps = 0;
      }
      
      if (status === 'WARNING') {
        nodeLat += Math.random() * 10;
      } else if (status === 'CRITICAL') {
        nodeLat += Math.random() * 30;
      } else if (status === 'HEALTHY') {
        nodeLat = Math.max(5, nodeLat - 5);
      }
      
      let nodeStatus = node.data.status;
      if (status === 'CIRCUIT_BREAKER_OPEN' && node.id === 'flink') nodeStatus = 'CIRCUIT_BREAKER_OPEN';
      else if (status === 'CRITICAL' && node.id === 'quality') nodeStatus = 'CRITICAL';
      else if (status === 'WARNING' && (node.id === 'kafka' || node.id === 'flink')) nodeStatus = 'WARNING';
      else nodeStatus = 'HEALTHY';

      return {
        ...node,
        data: {
          ...node.data,
          status: nodeStatus,
          isCircuitOpen: nodeStatus === 'CIRCUIT_BREAKER_OPEN',
          lastActivity: new Date().toISOString(),
          metrics: {
            ...node.data.metrics,
            throughput: nodeEps,
            latency: Math.floor(nodeLat),
            processed: node.data.metrics.processed + nodeEps,
            errorRate: status === 'CRITICAL' && node.id === 'quality' ? 15.4 : (status === 'WARNING' ? 4.2 : node.data.metrics.errorRate)
          }
        }
      };
    });

    const updatedEdges = edges.map(edge => {
      let edgeState = 'HEALTHY';
      if (status === 'CIRCUIT_BREAKER_OPEN' && (edge.id === 'e2' || edge.id === 'e3' || edge.id === 'e4' || edge.id === 'e5')) {
        edgeState = 'CIRCUIT_BREAKER_OPEN';
      } else if (status === 'CRITICAL') {
        edgeState = 'CRITICAL';
        if (edge.id === 'e6') edgeState = 'QUARANTINED'; // Quality to DLQ gets busy
      } else if (status === 'WARNING') {
        edgeState = 'WARNING';
      }
      return { ...edge, data: { ...edge.data, state: edgeState } };
    });

    set({
      metrics: {
        ...metrics,
        eventsPerSec: newEps,
        eventsProcessed: newProcessed,
      },
      quality: {
        ...quality,
        totalEvents: newProcessed,
        timestamp: new Date().toISOString(),
      },
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  },

  injectWarning: () => {
    const newEvent: ActivityEvent = { id: generateId(), timestamp: new Date().toISOString(), severity: 'warning', source: 'Kafka Ingestion', eventType: 'High Load', message: 'Kafka partitions showing elevated lag.' };
    set(state => ({
      status: 'WARNING',
      metrics: { ...state.metrics, kafkaLag: 8500 },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  },

  injectSchemaFailure: () => {
    const newEvent: ActivityEvent = { id: generateId(), timestamp: new Date().toISOString(), severity: 'critical', source: 'Quality Engine', eventType: 'Schema Mismatch', message: 'Massive spike in schema validation errors.' };
    set(state => ({
      status: 'CRITICAL',
      metrics: { ...state.metrics, errorRate: 15.4, activeIncidents: state.metrics.activeIncidents + 1 },
      quality: { ...state.quality, qualityScore: 84.5 },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  },

  openCircuitBreaker: () => {
    const newEvent: ActivityEvent = { id: generateId(), timestamp: new Date().toISOString(), severity: 'high', source: 'Flink Processing', eventType: 'Circuit Breaker', message: 'Circuit breaker OPEN. Downstream processing halted.' };
    set(state => ({
      status: 'CIRCUIT_BREAKER_OPEN',
      metrics: { ...state.metrics, eventsPerSec: 0, processingLatency: 0 },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  },

  triggerRecovery: () => {
    const newEvent: ActivityEvent = { id: generateId(), timestamp: new Date().toISOString(), severity: 'success', source: 'System Supervisor', eventType: 'Recovery', message: 'Pipeline recovered. Systems HEALTHY.' };
    set(state => ({
      status: 'HEALTHY',
      metrics: { ...state.metrics, errorRate: 0.12, activeIncidents: Math.max(0, state.metrics.activeIncidents - 1), kafkaLag: 120 },
      quality: { ...state.quality, qualityScore: 99.8 },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  }
}));
