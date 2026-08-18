/**
 * API Contract Types
 * Defines the strict interfaces expected from the real backend integration.
 */

export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Re-export core models to serve as the unified source of truth for the API layer
export type { 
  SystemStatus, 
  DataQualityMetric, 
  ActivityEvent, 
  ServiceHealth, 
  Incident, 
  QualityRule, 
  QuarantineRecord, 
  IcebergSnapshot 
} from '../types';
