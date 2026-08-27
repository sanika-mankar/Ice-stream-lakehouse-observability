import { Activity, Search, ShieldAlert, Zap, Filter, Clock, ArrowUpRight, Cpu, Target, AlertCircle, Bell, Terminal, BarChart2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function ObservabilityPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
            <Activity className="text-primary w-8 h-8" /> 
            Observability Platform
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Deep inspection of distributed traces, metrics, application logs, and SLOs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search traces (trace_id: xyz)..." 
              className="h-9 w-72 rounded-md border border-black/10 bg-white/60 px-9 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-slate-800"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-black/10 bg-black/ text-sm font-medium hover:bg-black/50/10 text-slate-800 transition-colors">
            <Filter className="h-4 w-4" />
            Advanced Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Traces", value: "24,591", trend: "+14% (1h)", icon: Activity, color: "text-blue-400" },
          { label: "Global Error Rate", value: "0.04%", trend: "-0.01% (1h)", icon: ShieldAlert, color: "text-red-400" },
          { label: "P99 Latency", value: "112ms", trend: "-5ms (1h)", icon: Clock, color: "text-amber-400" },
          { label: "Total Throughput", value: "12.4k/s", trend: "+2.1k (1h)", icon: Zap, color: "text-green-400" }
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-xl border border-black/10 flex flex-col gap-3 bg-white/40 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
              <span className={cn("text-xs font-semibold", stat.trend.startsWith('+') ? "text-green-400" : "text-green-400")}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Distributed Tracing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl border border-black/10 p-6 flex flex-col bg-white/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              Live Distributed Traces
            </h2>
            <span className="text-xs text-slate-500 bg-black/ px-2 py-1 rounded">Auto-refreshing (1s)</span>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { service: "payment-gateway", id: "tr-11c9x4", latency: "820ms", status: "warning", spans: 14, path: "API -> Auth -> Payments -> DB" },
              { service: "auth-service", id: "tr-9f82d1", latency: "45ms", status: "success", spans: 3, path: "API -> Auth -> Redis" },
              { service: "notification-worker", id: "tr-77x0z2", latency: "TIMEOUT", status: "critical", spans: 2, path: "Worker -> SMTP" },
              { service: "inventory-db", id: "tr-55b1a9", latency: "12ms", status: "success", spans: 1, path: "DB Read" },
              { service: "user-profile-api", id: "tr-33m9p4", latency: "65ms", status: "success", spans: 5, path: "API -> Profile -> Cache -> DB" },
            ].map((trace, i) => (
              <div key={i} className="flex flex-col p-4 rounded-lg bg-white/60 border border-black/5 hover:bg-black/50/5 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-2 rounded-full", 
                      trace.status === 'success' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : 
                      trace.status === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    )} />
                    <div>
                      <div className="font-mono text-sm text-slate-800 group-hover:text-primary transition-colors">{trace.id}</div>
                      <div className="text-xs text-slate-500">{trace.service}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-mono text-sm text-slate-800">{trace.latency}</div>
                      <div className="text-xs text-slate-400">{trace.spans} spans</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-800/30 group-hover:text-slate-800 transition-colors" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-800/30 font-mono mt-1 border-t border-black/5 pt-2">
                  Path: {trace.path}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Health Grid */}
        <div className="glass rounded-xl border border-black/10 p-6 flex flex-col bg-white/40 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Service Health Grid
          </h2>
          <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '400px' }}>
            {[
              { name: "API Gateway", status: "Healthy", cpu: "42%" },
              { name: "Auth Service", status: "Healthy", cpu: "18%" },
              { name: "Users DB", status: "Healthy", cpu: "35%" },
              { name: "Orders DB", status: "Warning", cpu: "88%" },
              { name: "Kafka Broker A", status: "Healthy", cpu: "60%" },
              { name: "Kafka Broker B", status: "Healthy", cpu: "62%" },
              { name: "Redis Cache", status: "Healthy", cpu: "12%" },
              { name: "Elasticsearch", status: "Healthy", cpu: "45%" },
              { name: "Flink Jobs", status: "Healthy", cpu: "75%" },
              { name: "SMTP Relay", status: "Critical", cpu: "0%" },
            ].map((service, i) => (
              <div key={i} className={cn("flex flex-col p-4 bg-white/60 border rounded-lg transition-colors", 
                service.status === 'Healthy' ? "border-black/5 hover:border-green-500/30" : 
                service.status === 'Warning' ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"
              )}>
                <span className="text-xs font-medium text-slate-800 mb-1 truncate">{service.name}</span>
                <div className="flex items-center justify-between mt-auto">
                  <span className={cn("text-[10px] font-bold uppercase", 
                    service.status === 'Healthy' ? "text-green-400" : 
                    service.status === 'Warning' ? "text-amber-400" : "text-red-400"
                  )}>{service.status}</span>
                  <span className="text-[10px] font-mono text-slate-500">CPU: {service.cpu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SLO / SLI Tracking */}
      <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Service Level Objectives (SLOs)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/ text-slate-500">
              <tr>
                <th className="p-3 font-medium rounded-tl-lg">Service</th>
                <th className="p-3 font-medium">SLI Description</th>
                <th className="p-3 font-medium">Target</th>
                <th className="p-3 font-medium">Current (30d)</th>
                <th className="p-3 font-medium">Error Budget Remaining</th>
                <th className="p-3 font-medium rounded-tr-lg">Burn Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[
                { s: "API Gateway", sli: "Latency < 200ms", t: "99.9%", c: "99.95%", eb: "85%", br: "0.8x (Normal)", brc: "text-green-400" },
                { s: "Auth Service", sli: "Success Rate", t: "99.99%", c: "99.98%", eb: "20%", br: "2.5x (High)", brc: "text-amber-400" },
                { s: "Checkout API", sli: "Success Rate", t: "99.9%", c: "99.2%", eb: "-15%", br: "14.2x (Critical)", brc: "text-red-400" },
                { s: "Data Ingestion", sli: "Latency < 5s", t: "99.0%", c: "99.8%", eb: "92%", br: "0.2x (Low)", brc: "text-green-400" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-black/50/5 text-slate-800">
                  <td className="p-3 font-medium">{row.s}</td>
                  <td className="p-3 text-slate-800/70 text-xs">{row.sli}</td>
                  <td className="p-3 font-mono">{row.t}</td>
                  <td className="p-3 font-mono">{row.c}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div className={cn("h-full", row.eb.startsWith('-') ? "bg-red-500" : parseInt(row.eb) < 30 ? "bg-amber-500" : "bg-green-500")} style={{ width: row.eb.startsWith('-') ? '100%' : row.eb }} />
                      </div>
                      <span className="text-xs font-mono">{row.eb}</span>
                    </div>
                  </td>
                  <td className={cn("p-3 text-xs font-bold", row.brc)}>{row.br}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts & Incidents */}
        <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Active Alerts & Incidents
          </h2>
          <div className="space-y-3">
            {[
              { rule: "HighErrorRate", target: "checkout-api", duration: "14m", sev: "CRITICAL" },
              { rule: "PodCrashLoop", target: "notification-worker-pod-x9", duration: "2h 45m", sev: "WARNING" },
              { rule: "DiskSpaceRunningOut", target: "kafka-broker-3", duration: "12m", sev: "WARNING" },
              { rule: "DbConnectionPoolDepleted", target: "orders-db", duration: "4m", sev: "CRITICAL" },
            ].map((alert, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-white/60 border border-black/5 rounded-lg border-l-2" style={{ borderLeftColor: alert.sev === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                <div>
                  <div className="font-mono text-sm text-slate-800">{alert.rule}</div>
                  <div className="text-xs text-slate-500 mt-1">Target: {alert.target}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider", alert.sev === 'CRITICAL' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400")}>{alert.sev}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Stream Simulator */}
        <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            Log Stream Simulator
          </h2>
          <div className="bg-[#0a0a0a] p-4 rounded-lg font-mono text-[11px] leading-relaxed text-slate-800/70 h-[320px] overflow-y-auto custom-scrollbar border border-black/5 flex-1 shadow-inner">
            <div className="mb-2 pb-2 border-b border-black/10 flex justify-between text-slate-400">
              <span>tail -f /var/log/containers/*.log</span>
              <span className="flex gap-2">
                <span className="text-blue-400">INFO</span>
                <span className="text-amber-400">WARN</span>
                <span className="text-red-400">ERROR</span>
              </span>
            </div>
            <div className="space-y-1.5">
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:32Z</span> <span className="text-purple-400">auth-service</span> Token validated for user user_891x</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:33Z</span> <span className="text-cyan-400">payment-api</span> Processing transaction txn_9912...</div>
              <div className="bg-amber-500/10 -mx-4 px-4 py-0.5"><span className="text-amber-400 font-bold">[WARN]</span> <span className="text-slate-400">2026-08-20T10:15:33Z</span> <span className="text-yellow-400">inventory-db</span> High memory usage detected on shard 3 (88%)</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:34Z</span> <span className="text-cyan-400">payment-api</span> Transaction txn_9912 completed successfully.</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:35Z</span> <span className="text-orange-400">analytics-worker</span> Ingested 4,500 events in batch processing.</div>
              <div className="bg-red-500/10 -mx-4 px-4 py-0.5"><span className="text-red-400 font-bold">[ERROR]</span> <span className="text-slate-400">2026-08-20T10:15:36Z</span> <span className="text-pink-400">notification-svc</span> Failed to connect to SMTP relay. Connection timed out.</div>
              <div className="bg-amber-500/10 -mx-4 px-4 py-0.5"><span className="text-amber-400 font-bold">[WARN]</span> <span className="text-slate-400">2026-08-20T10:15:36Z</span> <span className="text-pink-400">notification-svc</span> Retrying connection to SMTP relay (Attempt 1/3)...</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:38Z</span> <span className="text-pink-400">notification-svc</span> SMTP relay connection established.</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:39Z</span> <span className="text-purple-400">auth-service</span> New session created for IP 192.168.1.44</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:40Z</span> <span className="text-gray-400">storage-node</span> Compaction completed. Freed 1.2GB.</div>
              <div><span className="text-blue-400 font-bold">[INFO]</span> <span className="text-slate-400">2026-08-20T10:15:42Z</span> <span className="text-green-400">api-gateway</span> Request throughput nominal at 4,500 RPS.</div>
              <div className="animate-pulse"><span className="text-slate-400">_</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
