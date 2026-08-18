import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Incident } from '../../lib/types';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';

interface IncidentDetailPanelProps {
  incident: Incident | null;
  onClose: () => void;
}

export function IncidentDetailPanel({ incident, onClose }: IncidentDetailPanelProps) {
  return (
    <div className={cn(
      "fixed right-0 top-14 bottom-0 w-[500px] bg-card border-l border-border shadow-2xl transition-transform duration-300 z-50 flex flex-col",
      incident ? "translate-x-0" : "translate-x-full"
    )}>
      {incident && (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-xl font-bold font-mono">{incident.id}</h2>
              <span className="text-xs text-muted-foreground">Affected: {incident.affectedComponent}</span>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={incident.status === 'RESOLVED' ? 'HEALTHY' : incident.status === 'OPEN' ? 'CRITICAL' : 'WARNING'} />
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Summary</h3>
              <p className="text-sm bg-muted/20 p-4 rounded-lg border border-border">{incident.description}</p>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Root Cause</h3>
              <p className="text-sm bg-status-critical/10 text-status-critical p-4 rounded-lg border border-status-critical/20">
                {incident.rootCause}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Metrics at Failure</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 border border-border rounded-lg p-4">
                  <span className="text-xs text-muted-foreground block mb-1">Error Rate</span>
                  <span className="text-2xl font-bold font-mono text-status-critical">{incident.errorRate}%</span>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-4">
                  <span className="text-xs text-muted-foreground block mb-1">Circuit Breaker Threshold</span>
                  <span className="text-2xl font-bold font-mono">{incident.threshold}%</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Timeline</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {[
                  { time: incident.startedAt, text: "Quality degradation detected", type: "warning" },
                  { time: new Date(new Date(incident.startedAt).getTime() + 6000).toISOString(), text: "Threshold exceeded", type: "critical" },
                  { time: new Date(new Date(incident.startedAt).getTime() + 7000).toISOString(), text: "Circuit breaker OPEN", type: "critical" },
                  { time: new Date(new Date(incident.startedAt).getTime() + 21000).toISOString(), text: "DLQ routing started", type: "info" },
                  ...(incident.resolvedAt ? [
                    { time: new Date(new Date(incident.resolvedAt).getTime() - 18000).toISOString(), text: "Recovery initiated", type: "warning" },
                    { time: incident.resolvedAt, text: "Circuit breaker CLOSED", type: "success" }
                  ] : [])
                ].map((event, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow",
                      event.type === 'critical' ? 'text-status-critical' : event.type === 'warning' ? 'text-status-warning' : event.type === 'success' ? 'text-status-healthy' : 'text-foreground'
                    )}>
                      <div className={cn("w-3 h-3 rounded-full", event.type === 'critical' ? 'bg-status-critical' : event.type === 'warning' ? 'bg-status-warning' : event.type === 'success' ? 'bg-status-healthy' : 'bg-foreground')} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-border bg-card shadow">
                      <div className="flex items-center justify-between mb-1">
                        <time className="font-mono text-xs text-muted-foreground">{new Date(event.time).toLocaleTimeString()}</time>
                      </div>
                      <div className="text-sm font-medium">{event.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="p-4 border-t border-border bg-muted/30">
            <Button variant="outline" className="w-full" onClick={() => {
              const blob = new Blob([JSON.stringify(incident, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `incident-report-${incident.id}.json`;
              a.click();
            }}>
              Export Incident Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
