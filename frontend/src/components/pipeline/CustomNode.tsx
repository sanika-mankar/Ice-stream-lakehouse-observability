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

  return (
    <div className="relative group transition-all duration-200">
      <div className={`w-[260px] bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md ${selected ? 'ring-2 ring-primary/60' : ''}`}>
        <div className={`h-1 w-full bg-gradient-to-r ${theme.stripe}`} />
        <div className="p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">{data.label}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">{theme.category}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
