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

export function CustomNode({ data, selected }: CustomNodeProps) {
  const theme = CATEGORY_THEMES[data.type] || CATEGORY_THEMES.stream;
  const IconComponent = theme.icon;

  const getStatusBadge = () => {
    if (data.isCircuitOpen || data.status === 'CIRCUIT_BREAKER_OPEN') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          TRIPPED
        </span>
      );
    }
    if (data.status === 'DEGRADED') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          PROBE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ACTIVE
      </span>
    );
  };

  return (
    <div className="relative group transition-all duration-200">
      <div className={`w-[260px] bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md ${selected ? 'ring-2 ring-primary/60' : ''}`}>
        <div className={`h-1 w-full bg-gradient-to-r ${theme.stripe}`} />
        <div className="p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-lg border flex-shrink-0 ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate leading-tight">{data.label}</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide mt-0.5">{theme.category}</p>
              </div>
            </div>
            <div className="flex-shrink-0">{getStatusBadge()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
