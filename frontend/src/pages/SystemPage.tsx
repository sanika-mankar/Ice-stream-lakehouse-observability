import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useStore } from '../lib/store/useStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Server, Database, CheckCircle2, Clock, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function SystemPage() {
  const { services, simulateTick, triggerIncident, triggerRecovery, triggerCircuitBreaker } = useStore();

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Infrastructure</h1>
        <p className="text-muted-foreground">Monitor the underlying nodes and services powering Ice Stream.</p>
      </div>

      <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card mb-8">
        <span className="text-sm font-semibold mr-4">Simulation Controls:</span>
        <Button size="sm" variant="outline" onClick={simulateTick}>Manual Tick</Button>
        <Button size="sm" variant="danger" onClick={triggerIncident}>Trigger Incident</Button>
        <Button size="sm" variant="danger" onClick={triggerCircuitBreaker}>Open Circuit Breaker</Button>
        <Button size="sm" variant="primary" onClick={triggerRecovery}>Trigger Recovery</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {services.map((svc) => (
          <Card key={svc.id} className="relative overflow-hidden group hover:border-border/80 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-active/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-muted">
                  {svc.id === 'kafka' && <Server className="w-5 h-5 text-status-active" />}
                  {svc.id === 'flink' && <Cpu className="w-5 h-5 text-status-warning" />}
                  {svc.id === 'iceberg' && <Database className="w-5 h-5 text-status-analytics" />}
                  {svc.id === 'quality' && <CheckCircle2 className="w-5 h-5 text-status-healthy" />}
                </div>
                <div>
                  <CardTitle className="text-base">{svc.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">ID: {svc.id}</p>
                </div>
              </div>
              <StatusBadge status={svc.status} />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> Latency</span>
                  <span className="font-semibold">{svc.latencyMs}ms</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Uptime</span>
                  <span className="font-semibold">{svc.uptimePercentage}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Load</span>
                  <span className="font-semibold">{svc.currentLoad}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Heartbeat</span>
                  <span className="font-semibold text-xs truncate" title={svc.lastHeartbeat}>
                    {new Date(svc.lastHeartbeat).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
