import React from 'react';
import { cn } from '../../lib/utils';
import type { SystemStatus } from '../../lib/types';

export function StatusBadge({ status, className }: { status: SystemStatus | string; className?: string }) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'HEALTHY':
      case 'success':
        return 'bg-status-healthy/20 text-status-healthy border-status-healthy/50';
      case 'WARNING':
      case 'warning':
        return 'bg-status-warning/20 text-status-warning border-status-warning/50';
      case 'DEGRADED':
        return 'bg-status-warning/20 text-status-warning border-status-warning/50';
      case 'CRITICAL':
      case 'critical':
      case 'CIRCUIT_BREAKER_OPEN':
        return 'bg-status-critical/20 text-status-critical border-status-critical/50';
      case 'QUARANTINED':
        return 'bg-status-critical/20 text-status-critical border-status-critical/50';
      case 'RECOVERING':
        return 'bg-status-active/20 text-status-active border-status-active/50';
      case 'info':
        return 'bg-status-active/20 text-status-active border-status-active/50';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', getStatusColor(status), className)}>
      {status}
    </span>
  );
}
