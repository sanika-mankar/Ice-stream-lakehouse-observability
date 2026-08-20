import { Activity, Search, ShieldAlert, Zap, Filter, Clock, ArrowUpRight, Cpu } from "lucide-react";
import { cn } from "../lib/utils";

export default function ObservabilityPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observability Platform</h1>
          <p className="text-muted-foreground mt-1 text-sm">Deep inspection of distributed traces, metrics, and application logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search traces by ID..." 
              className="h-9 w-64 rounded-md border border-input bg-background/50 px-9 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-card text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Traces", value: "24,591", trend: "+14%", icon: Activity, color: "text-blue-500" },
          { label: "Error Rate", value: "0.04%", trend: "-0.01%", icon: ShieldAlert, color: "text-status-critical" },
          { label: "Avg Latency", value: "112ms", trend: "-5ms", icon: Clock, color: "text-status-warning" },
          { label: "Throughput", value: "12.4k/s", trend: "+2.1k", icon: Zap, color: "text-status-healthy" }
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-xl border border-border/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className={cn("text-xs font-semibold", stat.trend.startsWith('+') ? "text-status-healthy" : "text-status-healthy")}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl border border-border/50 p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-6">Live Distributed Traces</h2>
          <div className="space-y-4 flex-1">
            {[
              { service: "auth-service", id: "tr-9f82d1", latency: "45ms", status: "success" },
              { service: "payment-gateway", id: "tr-11c9x4", latency: "820ms", status: "warning" },
              { service: "inventory-db", id: "tr-55b1a9", latency: "12ms", status: "success" },
              { service: "notification-worker", id: "tr-77x0z2", latency: "TIMEOUT", status: "critical" },
              { service: "user-profile-api", id: "tr-33m9p4", latency: "65ms", status: "success" },
              { service: "billing-service", id: "tr-22v4q1", latency: "115ms", status: "success" },
              { service: "auth-service", id: "tr-9f82d2", latency: "42ms", status: "success" },
            ].map((trace, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/30 hover:bg-card/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full", 
                    trace.status === 'success' ? "bg-status-healthy" : 
                    trace.status === 'warning' ? "bg-status-warning" : "bg-status-critical"
                  )} />
                  <div>
                    <div className="font-mono text-sm">{trace.id}</div>
                    <div className="text-xs text-muted-foreground">{trace.service}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono text-sm">{trace.latency}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl border border-border/50 p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-6">Service Health Grid</h2>
          <div className="grid grid-cols-2 gap-3">
            {["API Gateway", "Auth", "Users DB", "Orders DB", "Kafka A", "Kafka B", "Redis Cache", "Search", "Analytics", "Storage"].map((service, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-4 bg-card/40 border border-border/30 rounded-lg hover:border-primary/30 transition-colors">
                <Cpu className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-xs font-medium text-center">{service}</span>
                <span className="text-[10px] text-status-healthy mt-1">Healthy</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-xl border border-border/50 p-6">
         <h2 className="text-lg font-semibold mb-4">Log Stream Simulator</h2>
         <div className="bg-black/50 p-4 rounded-lg font-mono text-xs overflow-x-auto space-y-2 text-muted-foreground h-64 overflow-y-auto custom-scrollbar">
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:32Z (auth-service) Token validated for user user_891x</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:33Z (payment-api) Processing transaction txn_9912...</div>
           <div><span className="text-status-warning">[WARN]</span> 2026-08-20T10:15:33Z (inventory-db) High memory usage detected on shard 3 (88%)</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:34Z (payment-api) Transaction txn_9912 completed successfully.</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:35Z (analytics-worker) Ingested 4,500 events in batch processing.</div>
           <div><span className="text-status-critical">[ERROR]</span> 2026-08-20T10:15:36Z (notification-svc) Failed to connect to SMTP relay. Connection timed out.</div>
           <div><span className="text-status-warning">[WARN]</span> 2026-08-20T10:15:36Z (notification-svc) Retrying connection to SMTP relay (Attempt 1/3)...</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:38Z (notification-svc) SMTP relay connection established.</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:39Z (auth-service) New session created for IP 192.168.1.44</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:40Z (storage-node) Compaction completed. Freed 1.2GB.</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:42Z (api-gateway) Request throughput nominal at 4,500 RPS.</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:45Z (auth-service) Token validated for user user_112z</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:48Z (search-indexer) Reindexed 500 documents successfully.</div>
           <div><span className="text-blue-400">[INFO]</span> 2026-08-20T10:15:52Z (metrics-collector) Flushed metrics to time-series DB.</div>
         </div>
      </div>
    </div>
  );
}

// Add metrics summary cards

// Implement distributed traces table

// Integrate log stream simulator
