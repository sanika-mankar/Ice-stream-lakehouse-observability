/**
 * WebSocket Event Contracts
 * Defines the real-time event payloads expected from the backend.
 */
import type { 
  SystemStatus, 
  DataQualityMetric, 
  ActivityEvent, 
  Incident, 
  QuarantineRecord 
} from './types';

export const WsEventType = {
  PIPELINE_STATUS_CHANGED: 'PIPELINE_STATUS_CHANGED',
  METRIC_UPDATED: 'METRIC_UPDATED',
  QUALITY_ALERT: 'QUALITY_ALERT',
  CIRCUIT_BREAKER_OPENED: 'CIRCUIT_BREAKER_OPENED',
  CIRCUIT_BREAKER_CLOSED: 'CIRCUIT_BREAKER_CLOSED',
  DLQ_RECORD_ADDED: 'DLQ_RECORD_ADDED',
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  SERVICE_STATUS_CHANGED: 'SERVICE_STATUS_CHANGED'
} as const;

export type WsEventType = typeof WsEventType[keyof typeof WsEventType];

export interface WsEventPayload {
  [WsEventType.PIPELINE_STATUS_CHANGED]: { status: SystemStatus; reason?: string };
  [WsEventType.METRIC_UPDATED]: { componentId: string; throughput: number; latency: number; errorRate: number };
  [WsEventType.QUALITY_ALERT]: { score: number; activeViolations: number; latestMetrics: DataQualityMetric };
  [WsEventType.CIRCUIT_BREAKER_OPENED]: { component: string; errorRate: number; threshold: number; triggeredAt: string };
  [WsEventType.CIRCUIT_BREAKER_CLOSED]: { component: string; recoveredAt: string };
  [WsEventType.DLQ_RECORD_ADDED]: { record: QuarantineRecord };
  [WsEventType.INCIDENT_CREATED]: { incident: Incident };
  [WsEventType.INCIDENT_RESOLVED]: { incidentId: string; resolvedAt: string; duration: string };
  [WsEventType.SERVICE_STATUS_CHANGED]: { serviceId: string; status: 'HEALTHY' | 'WARNING' | 'CRITICAL' };
}

export interface WebSocketMessage<T extends WsEventType> {
  type: T;
  payload: WsEventPayload[T];
  timestamp: string;
  eventId: string;
}
