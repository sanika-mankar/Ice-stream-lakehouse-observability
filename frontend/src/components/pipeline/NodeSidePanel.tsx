import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PipelineNodeData } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';

interface NodeSidePanelProps {
  node: PipelineNodeData | null;
  onClose: () => void;
}

export function NodeSidePanel({ node, onClose }: NodeSidePanelProps) {
  return (
    <div className={cn(
      "absolute right-0 top-0 h-full w-96 bg-card border-l border-border shadow-2xl transition-transform duration-300 z-20 flex flex-col",
      node ? "translate-x-0" : "translate-x-full"
    )}>
      {node && (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-lg font-bold">{node.label}</h2>
              <span className="text-xs text-muted-foreground uppercase">{node.type} node</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <section>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Status Overview</h3>
              <div className="bg-muted/20 border border-border rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium">Current State</span>
                <StatusBadge status={node.isCircuitOpen ? 'CIRCUIT_BREAKER_OPEN' : node.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{node.description}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Live Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Throughput</span>
                  <span className="text-xl font-bold font-mono">{node.metrics.throughput.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/s</span></span>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Latency</span>
                  <span className="text-xl font-bold font-mono">{node.metrics.latency} <span className="text-sm font-normal text-muted-foreground">ms</span></span>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Total Processed</span>
                  <span className="text-xl font-bold font-mono">{(node.metrics.processed / 1000).toFixed(1)}k</span>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Error Rate</span>
                  <span className={cn("text-xl font-bold font-mono", node.metrics.errorRate > 5 ? "text-status-critical" : "")}>
                    {node.metrics.errorRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Configuration</h3>
              <div className="bg-muted/20 border border-border rounded-lg overflow-hidden text-xs font-mono">
                <div className="flex border-b border-border p-2">
                  <span className="text-muted-foreground w-1/3">Node ID</span>
                  <span className="text-foreground flex-1">{node.id}</span>
                </div>
                <div className="flex border-b border-border p-2">
                  <span className="text-muted-foreground w-1/3">Version</span>
                  <span className="text-foreground flex-1">v2.4.1</span>
                </div>
                <div className="flex p-2">
                  <span className="text-muted-foreground w-1/3">Last Activity</span>
                  <span className="text-foreground flex-1">{new Date(node.lastActivity).toLocaleTimeString()}</span>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
