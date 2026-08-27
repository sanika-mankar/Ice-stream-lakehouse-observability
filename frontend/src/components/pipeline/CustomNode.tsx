import type { NodeProps, Node } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Activity, Database, Server, Settings, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PipelineNodeData } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';

export function CustomNode({ data, selected }: NodeProps<Node<PipelineNodeData>>) {
  const Icon = getIcon(data.type);
  const theme = getThemeColor(data.type);
  
  const isCritical = data.status === 'CRITICAL' || data.status === 'QUARANTINED' || data.status === 'CIRCUIT_BREAKER_OPEN';
  const isWarning = data.status === 'WARNING' || data.status === 'DEGRADED';

  // Wavy, hand-drawn border radius
  const handDrawnBorder = {
    borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
  };

  return (
    <div 
      className={cn(
        "w-[260px] p-4 bg-[#111111]/80 backdrop-blur-sm border-[3px] transition-all duration-300 group flex flex-col gap-4",
        isCritical ? 'animate-pulse' : '',
        selected ? 'opacity-100 scale-105' : 'opacity-90'
      )}
      style={{
        ...handDrawnBorder,
        borderColor: theme.color,
        boxShadow: `0 0 15px ${theme.color}33, inset 0 0 10px ${theme.color}22`,
      }}
    >
      {/* Header section with Icon & Title */}
      <div className="flex flex-col items-center justify-center gap-2 text-center relative z-10">
        <Icon 
          className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" 
          style={{ color: theme.color, filter: `drop-shadow(0 0 8px ${theme.color})` }}
        />
        <div>
          <h3 className="font-semibold text-lg leading-tight tracking-wide" style={{ color: '#ffffff', textShadow: `0 0 5px ${theme.color}` }}>
            {data.label}
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80" style={{ color: theme.color }}>
            {data.type}
          </span>
        </div>
        
        {/* Status indicator (if not healthy) */}
        {(isCritical || isWarning) && (
          <div className="absolute -top-6 -right-2">
            <StatusBadge status={data.isCircuitOpen ? 'CIRCUIT_BREAKER_OPEN' : data.status} className="text-[9px] px-2 py-0.5" />
          </div>
        )}
      </div>

      {/* Metrics Section - styled as a simple grid */}
      <div className="grid grid-cols-2 gap-3 mt-2 border-t border-dashed pt-3" style={{ borderColor: `${theme.color}66` }}>
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60" style={{ color: theme.color }}>Throughput</span>
          <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">{data.metrics.throughput.toLocaleString()} <span className="text-[10px] opacity-50">/s</span></span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60" style={{ color: theme.color }}>Latency</span>
          <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">{data.metrics.latency} <span className="text-[10px] opacity-50">ms</span></span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60" style={{ color: theme.color }}>Processed</span>
          <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">{(data.metrics.processed / 1000).toFixed(1)}k</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60" style={{ color: theme.color }}>Errors</span>
          <span className="font-mono text-sm font-bold text-slate-800 tracking-wider">
            {data.metrics.errorRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Handles */}
      {data.type !== 'source' && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="w-1.5 h-1.5 opacity-0" // Hide default handles, CustomEdge will draw to it
        />
      )}
      {data.type !== 'analytics' && data.type !== 'dlq' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="w-1.5 h-1.5 opacity-0"
        />
      )}
    </div>
  );
}

function getThemeColor(type: string): { name: string; color: string } {
  switch (type) {
    case 'source': return { name: 'collect', color: '#00f0ff' }; // Cyan
    case 'kafka': return { name: 'ingest', color: '#ff0055' }; // Pink
    case 'flink': 
    case 'quality': return { name: 'compute', color: '#00ff66' }; // Green
    case 'storage': 
    case 'dlq': return { name: 'store', color: '#ffea00' }; // Yellow
    case 'analytics': return { name: 'consume', color: '#ff8800' }; // Orange
    default: return { name: 'default', color: '#ffffff' };
  }
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
