export type SystemStatus = "HEALTHY" | "WARNING" | "DEGRADED" | "CRITICAL" | "QUARANTINED" | "RECOVERING" | "CIRCUIT_BREAKER_OPEN";

export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: SystemStatus;
  trend: "up" | "down" | "stable";
  history: number[];
}

export interface DataQualityMetric {
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  qualityScore: number;
  timestamp: string;
}

export interface QualityViolation {
  id: string;
  ruleId: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  count: number;
  timestamp: string;
}

export type PipelineNodeData = Record<string, unknown> & {
  id: string;
  type: "source" | "kafka" | "flink" | "quality" | "storage" | "dlq" | "analytics";
  label: string;
  description: string;
  status: SystemStatus;
  metrics: {
    throughput: number;
    latency: number;
    errorRate: number;
    processed: number;
    errors: number;
  };
  lastActivity: string;
  isCircuitOpen?: boolean;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

import type { Node } from '@xyflow/react';

export interface Pipeline {
  nodes: Node<PipelineNodeData>[];
  edges: PipelineEdge[];
  status: SystemStatus;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATING' | 'RECOVERING' | 'RESOLVED';

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string;
  resolvedAt?: string;
  duration?: string;
  errorRate: number;
  threshold: number;
  affectedComponent: string;
  rootCause: string;
  description: string;
}

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  severity: 'warning' | 'error' | 'critical';
  threshold: string;
  status: 'active' | 'disabled';
  violationCount: number;
}

export interface QuarantineRecord {
  id: string;
  timestamp: string;
  eventId: string;
  transactionId: string;
  ruleId: string;
  field: string;
  expected: string;
  actual: string;
  source: string;
  schemaVersion: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface IcebergSnapshot {
  id: string;
  timestamp: string;
  records: number;
  operation: 'append' | 'overwrite' | 'delete' | 'replace';
  summary: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  severity: "info" | "warning" | "high" | "critical" | "success";
  source: string;
  eventType: string;
  message: string;
}

export interface ServiceHealth {
  id: string;
  name: string;
  status: SystemStatus;
  latencyMs: number;
  uptimePercentage: number;
  currentLoad: number;
  lastHeartbeat: string;
}

export interface NotificationAlert {
  id: string;
  timestamp: string;
  severity: "info" | "warning" | "high" | "critical";
  source: string;
  message: string;
  read: boolean;
  link?: string;
}
