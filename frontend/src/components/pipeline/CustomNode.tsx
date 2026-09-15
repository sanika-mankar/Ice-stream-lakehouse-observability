import type { NodeProps, Node } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { 
  Activity, 
  Database, 
  Server, 
  Settings, 
  Zap, 
  ShieldAlert, 
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PipelineNodeData } from '../../lib/types';

export function CustomNode({ data, selected }: NodeProps<Node<PipelineNodeData>>) {
  const nodeType = data.type || 'storage';
  const theme = getNodeTheme(nodeType, data.isCircuitOpen);
  const Icon = theme.icon;

  const isCircuitOpen = data.isCircuitOpen || data.status === 'CIRCUIT_BREAKER_OPEN';
  const isCritical = data.status === 'CRITICAL' || data.status === 'QUARANTINED' || isCircuitOpen;
  const isDegraded = data.status === 'DEGRADED' || data.status === 'WARNING';

  // Format processed count cleanly
  const formattedProcessed = data.metrics.processed >= 1000000
    ? `${(data.metrics.processed / 1000000).toFixed(1)}M`
    : data.metrics.processed >= 1000
    ? `${(data.metrics.processed / 1000).toFixed(1)}k`
    : `${data.metrics.processed}`;

  return (
    <div 
      className={cn(
        "w-[260px] bg-card text-card-foreground rounded-xl border transition-all duration-200 group shadow-sm flex flex-col overflow-visible select-none",
        selected 
          ? "ring-2 ring-primary/40 border-primary shadow-md" 
          : "border-border/90 hover:border-slate-400/80 hover:shadow-md",
        isCircuitOpen ? "ring-1 ring-rose-500/50 border-rose-500/60" : ""
      )}
    >
      {/* Top Semantic Accent Stripe */}
      <div className={cn("h-1 w-full rounded-t-xl shrink-0 transition-colors", theme.stripeColor)} />

      {/* Node Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105", theme.iconBadge)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs text-foreground truncate leading-tight">
              {data.label}
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block truncate mt-0.5">
              {theme.roleLabel}
            </span>
          </div>
        </div>

        {/* Semantic Status Indicator */}
        <div className="shrink-0 flex items-center gap-1.5 pl-1">
          {isCritical ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {isCircuitOpen ? 'TRIPPED' : 'ALERT'}
            </span>
          ) : isDegraded ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              PROBE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Metrics Section: 2x2 Clean Grid */}
      <div className="px-3.5 py-2.5 border-t border-border/60 bg-muted/20 grid grid-cols-2 gap-x-3 gap-y-2">
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
            Throughput
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {data.metrics.throughput.toLocaleString()}{' '}
            <span className="text-[10px] font-normal text-muted-foreground">/s</span>
          </span>
        </div>

        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
            Latency
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {data.metrics.latency}{' '}
            <span className="text-[10px] font-normal text-muted-foreground">ms</span>
          </span>
        </div>

        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
            Processed
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {formattedProcessed}
          </span>
        </div>

        <div>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground block">
            {nodeType === 'dlq' ? 'Violations' : 'Error Rate'}
          </span>
          <span className={cn(
            "font-mono text-xs font-bold",
            data.metrics.errorRate > 0 || (nodeType === 'dlq' && data.metrics.errors > 0)
              ? "text-rose-600 dark:text-rose-400"
              : "text-foreground"
          )}>
            {nodeType === 'dlq' 
              ? (data.metrics.errors || data.metrics.processed).toLocaleString()
              : `${data.metrics.errorRate.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Footer / Sub-info */}
      <div className="px-3.5 py-1.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-mono bg-card rounded-b-xl">
        <span className="truncate max-w-[150px]">{data.description}</span>
        <span className="text-[9px] uppercase tracking-wider opacity-80">{theme.layerTag}</span>
      </div>

      {/* Connection Handles (Target: Left & Top; Source: Right & Bottom) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left"
        className="!w-2 !h-2 !bg-card !border-2 !border-slate-400 hover:!border-primary !rounded-full transition-colors"
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="!w-2 !h-2 !bg-card !border-2 !border-slate-400 hover:!border-primary !rounded-full transition-colors"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right"
        className="!w-2 !h-2 !bg-card !border-2 !border-slate-400 hover:!border-primary !rounded-full transition-colors"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!w-2 !h-2 !bg-card !border-2 !border-slate-400 hover:!border-primary !rounded-full transition-colors"
      />
    </div>
  );
}

function getNodeTheme(type: string, isCircuitOpen?: boolean) {
  if (type === 'analytics' || type === 'circuit') {
    if (isCircuitOpen) {
      return {
        roleLabel: 'Reliability Gate',
        layerTag: 'Trip >2%',
        icon: AlertCircle,
        stripeColor: 'bg-rose-500',
        iconBadge: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      };
    }
    return {
      roleLabel: 'Reliability Gate',
      layerTag: 'Gate ≤2%',
      icon: Activity,
      stripeColor: 'bg-indigo-500',
      iconBadge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
    };
  }

  switch (type) {
    case 'source':
      return {
        roleLabel: 'Event Generator',
        layerTag: 'Layer 1',
        icon: Zap,
        stripeColor: 'bg-emerald-500',
        iconBadge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      };
    case 'kafka':
      return {
        roleLabel: 'Message Queue',
        layerTag: 'Layer 2',
        icon: Server,
        stripeColor: 'bg-blue-500',
        iconBadge: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      };
    case 'flink':
      return {
        roleLabel: 'Stream Processor',
        layerTag: '10s Window',
        icon: Cpu,
        stripeColor: 'bg-purple-500',
        iconBadge: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      };
    case 'quality':
      return {
        roleLabel: 'Validation Engine',
        layerTag: 'DQ-001..008',
        icon: Settings,
        stripeColor: 'bg-amber-500',
        iconBadge: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      };
    case 'storage':
      return {
        roleLabel: 'Clean Lakehouse',
        layerTag: 'Iceberg B2',
        icon: Database,
        stripeColor: 'bg-teal-500',
        iconBadge: 'bg-teal-500/10 text-teal-600 border-teal-500/20'
      };
    case 'dlq':
      return {
        roleLabel: 'Quarantine DLQ',
        layerTag: 'Quarantine B2',
        icon: ShieldAlert,
        stripeColor: 'bg-rose-500',
        iconBadge: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      };
    default:
      return {
        roleLabel: 'Service Node',
        layerTag: 'Service',
        icon: Database,
        stripeColor: 'bg-slate-500',
        iconBadge: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
      };
  }
}
