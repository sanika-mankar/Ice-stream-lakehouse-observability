import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useStore } from "../lib/store/useStore";
import { cn } from "../lib/utils";
import { Activity, ShieldAlert, CheckCircle2, Zap, Clock, HardDrive, AlertTriangle, Network, Server, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { status, metrics, quality, activityFeed } = useStore();

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Command Center</h1>
        <p className="text-muted-foreground text-sm font-medium">Real-time observability and holistic pipeline health monitoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Events / sec"
          value={metrics.eventsPerSec.toLocaleString()}
          icon={Zap}
          trend={metrics.eventsPerSec > 2000 ? "up" : "down"}
          trendValue="Live"
          statusColor="text-cyan-400"
        />
        <MetricCard
          title="Events Processed"
          value={(metrics.eventsProcessed / 1000000).toFixed(2) + "M"}
          icon={HardDrive}
          trend="up"
          trendValue="+12% today"
          statusColor="text-purple-400"
        />
        <MetricCard
          title="Data Quality Score"
          value={`${quality.qualityScore.toFixed(2)}%`}
          icon={CheckCircle2}
          trend={quality.qualityScore > 98 ? "stable" : "down"}
          statusColor={quality.qualityScore > 98 ? "text-green-400" : "text-status-critical"}
        />
        <MetricCard
          title="Processing Latency"
          value={`${metrics.processingLatency}ms`}
          icon={Clock}
          trend={metrics.processingLatency > 100 ? "up" : "stable"}
          statusColor={metrics.processingLatency > 100 ? "text-amber-400" : "text-blue-400"}
        />
        <MetricCard
          title="Kafka Lag"
          value={metrics.kafkaLag.toLocaleString()}
          icon={Activity}
          trend={metrics.kafkaLag > 500 ? "up" : "stable"}
          statusColor={metrics.kafkaLag > 500 ? "text-amber-400" : "text-white/60"}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          icon={AlertTriangle}
          trend={metrics.errorRate > 5 ? "up" : "stable"}
          statusColor={metrics.errorRate > 5 ? "text-red-400" : "text-white/60"}
        />
        <MetricCard
          title="DLQ Records"
          value={metrics.dlqRecords.toLocaleString()}
          icon={ShieldAlert}
          statusColor="text-red-400"
        />
        <MetricCard
          title="Active Incidents"
          value={metrics.activeIncidents}
          icon={AlertTriangle}
          statusColor={metrics.activeIncidents > 0 ? "text-red-400" : "text-green-400"}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Pipeline Health Flowchart */}
        <Card className="glass col-span-1 lg:col-span-2 flex flex-col bg-black/20 backdrop-blur-md border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="flex items-center gap-2 text-white">
              <Network className="w-5 h-5 text-cyan-400" />
              Pipeline Telemetry Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            <div className="flex items-center space-x-2 w-full max-w-3xl justify-between relative z-10">
              {[
                { name: 'INGEST', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]' },
                { name: 'PROCESS', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', shadow: 'shadow-[0_0_15px_rgba(192,132,252,0.2)]' },
                { name: 'VALIDATE', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', shadow: 'shadow-[0_0_15px_rgba(74,222,128,0.2)]' },
                { name: 'SERVE', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', shadow: 'shadow-[0_0_15px_rgba(96,165,250,0.2)]' }
              ].map((stage, idx, arr) => (
                <React.Fragment key={stage.name}>
                  <div className="flex flex-col items-center gap-3 group">
                    <div className={cn("h-16 w-16 rounded-xl border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-110", stage.bg, stage.border, stage.shadow)}>
                      <Activity className={cn("h-6 w-6", stage.color)} />
                    </div>
                    <span className="font-bold text-xs tracking-widest text-white/80">{stage.name}</span>
                    <StatusBadge status={status === 'HEALTHY' ? 'HEALTHY' : 'WARNING'} className="scale-90" />
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex-1 h-[2px] bg-white/10 relative overflow-visible">
                       {/* Animated flow dots */}
                       <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 overflow-hidden">
                          <div className={cn("w-1/3 h-full animate-[pulse_1s_ease-in-out_infinite]", stage.color.replace('text-', 'bg-'))} />
                       </div>
                       {/* Directional Arrow */}
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                       </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="glass col-span-1 flex flex-col h-[400px] bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              Live Activity Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence initial={false}>
              {activityFeed.slice(0, 10).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 p-3 rounded-lg border border-white/5 bg-black/40 hover:bg-white/5 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                     <StatusBadge status={event.severity} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-white/90 truncate">{event.source}</span>
                      <span className="text-[10px] font-mono text-white/40 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2">{event.message}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* System Resource Utilization */}
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              Cluster Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2 text-white/80">
                <span className="flex items-center gap-2"><Server className="w-3 h-3" /> Compute (vCPU)</span>
                <span className="font-mono font-bold text-amber-400">72% / 100%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 text-white/80">
                <span className="flex items-center gap-2"><HardDrive className="w-3 h-3" /> Memory (RAM)</span>
                <span className="font-mono font-bold text-green-400">45% / 100%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 text-white/80">
                <span className="flex items-center gap-2"><Network className="w-3 h-3" /> Network Bandwidth</span>
                <span className="font-mono font-bold text-cyan-400">88% / 10 Gbps</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / SLA Status */}
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              SLA Objectives & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-black/40 border border-white/5 text-center">
                <div className="text-xs text-white/50 mb-1">Uptime (90 Days)</div>
                <div className="text-2xl font-bold font-mono text-green-400">99.995%</div>
              </div>
              <div className="p-4 rounded-lg bg-black/40 border border-white/5 text-center">
                <div className="text-xs text-white/50 mb-1">Data Freshness</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">&lt; 2s</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <button className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-left font-medium text-white transition-colors flex items-center justify-between">
                <span>View Full Incident Report</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <button className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-left font-medium text-white transition-colors flex items-center justify-between">
                <span>Configure Alert Thresholds</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
