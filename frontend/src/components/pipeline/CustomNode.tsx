import type { NodeProps, Node } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Activity, Database, Server, Settings, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PipelineNodeData } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

export function CustomNode({ data, selected }: NodeProps<Node<PipelineNodeData>>) {
  const Icon = getIcon(data.type);
  
  const isHealthy = data.status === 'HEALTHY' || data.status === 'RECOVERING';
  const isWarning = data.status === 'WARNING' || data.status === 'DEGRADED';
  const isCritical = data.status === 'CRITICAL' || data.status === 'QUARANTINED' || data.status === 'CIRCUIT_BREAKER_OPEN';
  
  const borderColor = isHealthy ? 'border-status-healthy' 
    : isWarning ? 'border-status-warning' 
    : isCritical ? 'border-status-critical' 
    : 'border-border';

  const glowColor = isHealthy ? 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
    : isWarning ? 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
    : isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
    : '';

  return (
    <div className={cn(
      "w-[300px] rounded-xl border-2 bg-card/90 backdrop-blur transition-all duration-300",
      selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
      borderColor,
      isCritical ? 'animate-pulse' : '',
      selected || isCritical || isWarning ? glowColor : ''
    )}>
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md bg-background border", borderColor)}>
            <Icon className={cn("w-4 h-4", 
              isHealthy ? "text-status-healthy" : isWarning ? "text-status-warning" : "text-status-critical"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-none">{data.label}</h3>
            <span className="text-[10px] text-muted-foreground uppercase">{data.type}</span>
          </div>
        </div>
        <StatusBadge status={data.isCircuitOpen ? 'CIRCUIT_BREAKER_OPEN' : data.status} className="text-[10px] px-1.5 py-0" />
      </div>

      {/* Node Metrics */}
      <div className="p-3 grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground mb-1 text-[10px] uppercase">Throughput</span>
          <span className="font-medium font-mono">{data.metrics.throughput.toLocaleString()} /s</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground mb-1 text-[10px] uppercase">Latency</span>
          <span className="font-medium font-mono">{data.metrics.latency}ms</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground mb-1 text-[10px] uppercase">Processed</span>
          <span className="font-medium font-mono">{(data.metrics.processed / 1000).toFixed(1)}k</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground mb-1 text-[10px] uppercase">Error Rate</span>
          <span className={cn("font-medium font-mono", data.metrics.errorRate > 5 ? "text-status-critical" : "")}>
            {data.metrics.errorRate.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Handles */}
      {data.type !== 'source' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className={cn("w-3 h-3 border-2 border-background", borderColor)} 
        />
      )}
      {data.type !== 'analytics' && data.type !== 'dlq' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className={cn("w-3 h-3 border-2 border-background", borderColor)} 
        />
      )}
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case 'source': return Zap;
    case 'kafka': return Server;
    case 'flink': return Cpu;
    case 'quality': return Settings;
    case 'storage': return Database;
    case 'dlq': return ShieldAlert;
    case 'analytics': return Activity;
    default: return Database;
  }
}
