import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useStore } from '../lib/store/useStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Server, Database, CheckCircle2, Clock, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function SystemPage() {
  const { services, simulateTick, injectSchemaFailure, triggerRecovery, openCircuitBreaker } = useStore();

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-georgia">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Infrastructure</h1>
        <p className="text-muted-foreground">Monitor the underlying nodes and services powering Ice Stream.</p>
      </div>

      <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card mb-8">
        <span className="text-sm font-semibold mr-4">Simulation Controls:</span>
        <Button size="sm" variant="outline" onClick={simulateTick}>Manual Tick</Button>
        <Button size="sm" variant="danger" onClick={injectSchemaFailure}>Trigger Incident</Button>
        <Button size="sm" variant="danger" onClick={openCircuitBreaker}>Open Circuit Breaker</Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Kubernetes Node Health */}
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Kubernetes Node Health (EKS / GKE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-black/">
                  <tr>
                    <th className="px-3 py-2 rounded-tl-md">Node Name</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">CPU Press.</th>
                    <th className="px-3 py-2">Mem Press.</th>
                    <th className="px-3 py-2">Disk Press.</th>
                    <th className="px-3 py-2 rounded-tr-md">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-slate-600">
                  <tr className="hover:bg-black/50/5">
                    <td className="px-3 py-2 text-xs font-mono">ip-10-0-1-12.ec2</td>
                    <td className="px-3 py-2 text-xs">Worker (Kafka)</td>
                    <td className="px-3 py-2 text-xs font-mono text-amber-400">78%</td>
                    <td className="px-3 py-2 text-xs font-mono text-green-400">42%</td>
                    <td className="px-3 py-2 text-xs font-mono text-green-400">12%</td>
                    <td className="px-3 py-2 text-xs text-green-400 font-bold">Ready</td>
                  </tr>
                  <tr className="hover:bg-black/50/5 bg-red-500/5">
                    <td className="px-3 py-2 text-xs font-mono">ip-10-0-2-45.ec2</td>
                    <td className="px-3 py-2 text-xs">Worker (Flink)</td>
                    <td className="px-3 py-2 text-xs font-mono text-red-400 font-bold">95%</td>
                    <td className="px-3 py-2 text-xs font-mono text-red-400 font-bold">91%</td>
                    <td className="px-3 py-2 text-xs font-mono text-green-400">22%</td>
                    <td className="px-3 py-2 text-xs text-amber-400 font-bold animate-pulse">SchedulingDisabled</td>
                  </tr>
                  <tr className="hover:bg-black/50/5">
                    <td className="px-3 py-2 text-xs font-mono">ip-10-0-3-88.ec2</td>
                    <td className="px-3 py-2 text-xs">Worker (Trino)</td>
                    <td className="px-3 py-2 text-xs font-mono text-green-400">12%</td>
                    <td className="px-3 py-2 text-xs font-mono text-green-400">30%</td>
                    <td className="px-3 py-2 text-xs font-mono text-amber-400">75%</td>
                    <td className="px-3 py-2 text-xs text-green-400 font-bold">Ready</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* OOM Kill Events */}
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Recent OOM Kills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { pod: "flink-taskmanager-8b4", namespace: "streaming", time: "12m ago" },
                { pod: "trino-worker-22x", namespace: "analytics", time: "2h ago" },
                { pod: "kafka-broker-3", namespace: "messaging", time: "1d ago" },
              ].map((ev, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-red-500/20 bg-red-500/5 rounded-lg border-l-2" style={{ borderLeftColor: '#ef4444' }}>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{ev.pod}</div>
                    <div className="text-xs text-slate-500 mt-1">NS: {ev.namespace}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold tracking-wider bg-red-500/20 text-red-400">OOMKilled</span>
                    <span className="text-[10px] text-slate-400">{ev.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-xs text-slate-500">
                Action Required: Consider increasing memory limits for <code className="text-pink-400">flink-taskmanager</code> deployments.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Control Plane Status */}
          <Card className="glass bg-white/40 backdrop-blur-md border-black/10 flex-1">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" /> Control Plane Health
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-sm text-slate-800">API Server Latency</span>
                  <span className="font-mono text-green-400 text-sm">12ms</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-sm text-slate-800">etcd Leader Election</span>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Stable</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-800">Scheduler Queue</span>
                  <span className="font-mono text-slate-600 text-sm">0 pending</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DaemonSet Health */}
          <Card className="glass bg-white/40 backdrop-blur-md border-black/10 flex-1">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" /> DaemonSet Rollouts
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-sm text-slate-800">fluentd (Logging)</span>
                  <span className="text-xs font-mono text-slate-500">24/24 ready</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-sm text-slate-800">datadog-agent</span>
                  <span className="text-xs font-mono text-amber-400 animate-pulse">22/24 ready</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-800">node-exporter</span>
                  <span className="text-xs font-mono text-slate-500">24/24 ready</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
