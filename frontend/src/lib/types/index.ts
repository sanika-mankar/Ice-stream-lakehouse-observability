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
