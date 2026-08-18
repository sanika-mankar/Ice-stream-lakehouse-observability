import { create } from 'zustand';
import type { SystemStatus, DataQualityMetric, Pipeline, ActivityEvent, ServiceHealth, NotificationAlert } from '../types';

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
  
  // Feed & Infrastructure
  pipeline: Pipeline;
  activityFeed: ActivityEvent[];
  services: ServiceHealth[];
  notifications: NotificationAlert[];

  // Simulation Triggers
  simulateTick: () => void;
  triggerIncident: () => void;
  triggerRecovery: () => void;
  triggerCircuitBreaker: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

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
  
  pipeline: {
    nodes: [],
    edges: [],
    status: 'HEALTHY',
  },
  
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

  simulateTick: () => {
    const { status, metrics, quality } = get();
    
    // Simulate slight fluctuations in metrics
    const variance = (Math.random() - 0.5) * 0.1; 
    let newEps = Math.floor(metrics.eventsPerSec * (1 + variance));
    // Clamp
    if (newEps < 500) newEps = 500;
    if (newEps > 10000) newEps = 10000;

    const newProcessed = metrics.eventsProcessed + newEps;
    
    let newLatency = metrics.processingLatency;
    let newLag = metrics.kafkaLag;
    
    // If not healthy, metrics suffer
    if (status !== 'HEALTHY') {
      newLatency += Math.floor(Math.random() * 20);
      newLag += Math.floor(Math.random() * 100);
    } else {
      newLatency = Math.max(15, newLatency - Math.floor(Math.random() * 5));
      newLag = Math.max(0, newLag - Math.floor(Math.random() * 20));
    }

    set({
      metrics: {
        ...metrics,
        eventsPerSec: newEps,
        eventsProcessed: newProcessed,
        processingLatency: newLatency,
        kafkaLag: newLag,
      },
      quality: {
        ...quality,
        totalEvents: newProcessed,
        timestamp: new Date().toISOString(),
      }
    });
  },

  triggerIncident: () => {
    const newEvent: ActivityEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      severity: 'critical',
      source: 'Validation Engine',
      eventType: 'Schema Mismatch',
      message: 'Sudden spike in invalid schema violations detected.'
    };
    
    set((state) => ({
      status: 'CRITICAL',
      metrics: {
        ...state.metrics,
        errorRate: 15.4,
        activeIncidents: state.metrics.activeIncidents + 1,
      },
      quality: {
        ...state.quality,
        qualityScore: 84.5,
      },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  },

  triggerRecovery: () => {
    const newEvent: ActivityEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      severity: 'success',
      source: 'System Supervisor',
      eventType: 'Recovery',
      message: 'Pipeline recovery initiated and stabilized.'
    };
    
    set((state) => ({
      status: 'HEALTHY',
      metrics: {
        ...state.metrics,
        errorRate: 0.12,
        activeIncidents: Math.max(0, state.metrics.activeIncidents - 1),
      },
      quality: {
        ...state.quality,
        qualityScore: 99.8,
      },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  },

  triggerCircuitBreaker: () => {
    const newEvent: ActivityEvent = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      severity: 'high',
      source: 'Ingestion API',
      eventType: 'Circuit Breaker',
      message: 'Circuit breaker opened to prevent cascading failure.'
    };
    
    set((state) => ({
      status: 'CIRCUIT_BREAKER_OPEN',
      metrics: {
        ...state.metrics,
        eventsPerSec: 0,
        processingLatency: 0,
      },
      activityFeed: [newEvent, ...state.activityFeed].slice(0, 50),
    }));
  }
}));
