import { useState, useMemo } from 'react';
import { useStore } from '../lib/store/useStore';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { IncidentDetailPanel } from '../components/pipeline/IncidentDetailPanel';
import type { Incident } from '../lib/types';
import { Search } from 'lucide-react';

export default function ReliabilityPage() {
  const { incidents, circuitBreakerStatus, circuitBreakerEvents, metrics } = useStore();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [search, setSearch] = useState('');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => 
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      inc.affectedComponent.toLowerCase().includes(search.toLowerCase()) ||
      inc.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [incidents, search]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Reliability & Incidents</h1>
        <p className="text-muted-foreground">Manage system incidents and monitor circuit breaker health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass md:col-span-2">
          <CardHeader>
            <CardTitle>Circuit Breaker State</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-8">
            <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl min-w-[200px]">
              <div className={`text-4xl font-bold font-mono mb-2 ${circuitBreakerStatus === 'CLOSED' ? 'text-status-healthy' : circuitBreakerStatus === 'OPEN' ? 'text-status-critical' : 'text-status-warning'}`}>
                {circuitBreakerStatus}
              </div>
              <span className="text-sm text-muted-foreground">Current State</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Configured Threshold</span>
                <span className="font-mono font-medium">5.0% Error Rate</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Current Error Rate</span>
                <span className={`font-mono font-medium ${metrics.errorRate > 5 ? 'text-status-critical' : 'text-status-healthy'}`}>
                  {metrics.errorRate.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">DLQ Routing Volume</span>
                <span className="font-mono font-medium">{metrics.dlqRecords.toLocaleString()} events</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Recovery Status</span>
                <span className="font-mono font-medium">{circuitBreakerStatus === 'OPEN' ? 'Halted' : 'Monitoring'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent State Transitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {circuitBreakerEvents.map((evt, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${evt.state === 'CLOSED' ? 'bg-status-healthy' : evt.state === 'OPEN' ? 'bg-status-critical' : 'bg-status-warning'}`} />
                    {i !== circuitBreakerEvents.length - 1 && <div className="w-px h-full bg-border my-1" />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm">{evt.state}</span>
                      <span className="text-xs text-muted-foreground">{new Date(evt.time).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{evt.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Incident Log</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Incident ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Component</th>
                  <th className="px-4 py-3 font-medium text-right">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIncidents.map((incident) => (
                  <tr 
                    key={incident.id} 
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <td className="px-4 py-3 font-mono font-medium">{incident.id}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={incident.status === 'RESOLVED' ? 'HEALTHY' : incident.status === 'OPEN' ? 'CRITICAL' : 'WARNING'} className="px-2 py-0.5" />
                      <span className="ml-2 text-xs">{incident.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={incident.severity === 'critical' ? 'danger' : incident.severity === 'high' ? 'warning' : 'default'}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(incident.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{incident.duration || '-'}</td>
                    <td className="px-4 py-3">{incident.affectedComponent}</td>
                    <td className="px-4 py-3 text-right font-mono text-status-critical">{incident.errorRate}%</td>
                  </tr>
                ))}
                {filteredIncidents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No incidents found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Chaos Engineering Experiments */}
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              Chaos Engineering Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Pod Random Termination (Auth)", status: "PASSED", impact: "None", time: "2h ago" },
                { name: "Network Latency Injection (+500ms on DB)", status: "PASSED", impact: "Degraded API", time: "1d ago" },
                { name: "Kafka Leader Election Failover", status: "PASSED", impact: "None", time: "3d ago" },
                { name: "S3 Bucket Policy Misconfig", status: "FAILED", impact: "Outage (2m)", time: "1w ago" },
              ].map((exp, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-black/5 bg-white/60 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{exp.name}</div>
                    <div className="text-xs text-slate-500 mt-1">Impact: {exp.impact}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold tracking-wider", 
                      exp.status === 'PASSED' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>{exp.status}</span>
                    <span className="text-[10px] text-slate-400">{exp.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disaster Recovery Metrics */}
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Disaster Recovery (RTO / RPO)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1 text-slate-800">
                  <span>Recovery Time Objective (RTO)</span>
                  <span className="font-mono text-green-400">Actual: 4m 12s / Target: 15m</span>
                </div>
                <div className="w-full bg-black/ rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1 text-slate-800">
                  <span>Recovery Point Objective (RPO)</span>
                  <span className="font-mono text-amber-400">Actual: 42s / Target: 1m</span>
                </div>
                <div className="w-full bg-black/ rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 border border-black/5 rounded-lg bg-white/60 text-center">
                  <div className="text-xs text-slate-500 mb-1">Last Failover Test</div>
                  <div className="font-mono text-lg text-slate-800">12 Days Ago</div>
                </div>
                <div className="p-4 border border-black/5 rounded-lg bg-white/60 text-center">
                  <div className="text-xs text-slate-500 mb-1">Active Region</div>
                  <div className="font-mono text-lg text-blue-400">us-east-1</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <IncidentDetailPanel incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    </div>
  );
}
