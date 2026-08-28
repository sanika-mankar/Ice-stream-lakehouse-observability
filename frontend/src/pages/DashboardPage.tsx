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
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500 pb-20 min-h-screen rounded-tl-2xl font-georgia">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight text-slate-800">Command Center</h1>
        <p className="text-slate-500 text-sm font-medium">Real-time observability and holistic pipeline health monitoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Events / sec"
          value={metrics.eventsPerSec.toLocaleString()}
          icon={Zap}
          trend={metrics.eventsPerSec > 2000 ? "up" : "down"}
          trendValue="Live"
          statusColor="text-blue-500"
        />
        <MetricCard
          title="Events Processed"
          value={(metrics.eventsProcessed / 1000000).toFixed(2) + "M"}
          icon={HardDrive}
          trend="up"
          trendValue="+12% today"
          statusColor="text-purple-500"
        />
        <MetricCard
          title="Data Quality Score"
          value={`${quality.qualityScore.toFixed(2)}%`}
          icon={CheckCircle2}
          trend={quality.qualityScore > 98 ? "stable" : "down"}
          statusColor={quality.qualityScore > 98 ? "text-green-500" : "text-red-500"}
        />
        <MetricCard
          title="Processing Latency"
          value={`${metrics.processingLatency}ms`}
          icon={Clock}
          trend={metrics.processingLatency > 100 ? "up" : "stable"}
          statusColor={metrics.processingLatency > 100 ? "text-amber-500" : "text-blue-500"}
        />
        <MetricCard
          title="Kafka Lag"
          value={metrics.kafkaLag.toLocaleString()}
          icon={Activity}
          trend={metrics.kafkaLag > 500 ? "up" : "stable"}
          statusColor={metrics.kafkaLag > 500 ? "text-amber-500" : "text-orange-400"}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          icon={AlertTriangle}
          trend={metrics.errorRate > 5 ? "up" : "stable"}
          statusColor={metrics.errorRate > 5 ? "text-red-500" : "text-slate-400"}
        />
        <MetricCard
          title="DLQ Records"
          value={metrics.dlqRecords.toLocaleString()}
          icon={ShieldAlert}
          statusColor="text-red-500"
        />
        <MetricCard
          title="Active Incidents"
          value={metrics.activeIncidents}
          icon={AlertTriangle}
          statusColor={metrics.activeIncidents > 0 ? "text-red-500" : "text-green-500"}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Pipeline Health Flowchart */}
        <Card className="glass col-span-1 lg:col-span-2 flex flex-col relative overflow-hidden group">
          <CardHeader className="border-b border-black/5 bg-black/5 relative z-10">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-800">
                <Network className="w-5 h-5 text-blue-500" />
                Pipeline Telemetry Flow
              </span>
              <StatusBadge status={status === 'HEALTHY' ? 'HEALTHY' : 'WARNING'} />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative bg-white/40">
            {/* The sketched image */}
            <img
              src="/pipeline_sketch.jpg"
              alt="Data Pipeline Architecture Sketch"
              className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.02]"
            />
            {/* Optional overlay gradient for better integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent pointer-events-none" />
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="glass col-span-1 flex flex-col h-[400px]">
          <CardHeader className="border-b border-black/5 bg-black/">
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
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
                  className="flex gap-3 p-3 rounded-lg border border-black/5 bg-black/ hover:bg-white/80 shadow-sm transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <StatusBadge status={event.severity} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-800 truncate">{event.source}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{event.message}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* System Resource Utilization */}
        <Card className="glass">
          <CardHeader className="border-b border-black/5 bg-black/">
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              Cluster Resource Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2 text-slate-600 font-medium">
                <span className="flex items-center gap-2"><Server className="w-3 h-3" /> Compute (vCPU)</span>
                <span className="font-mono font-bold text-amber-500">72% / 100%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 text-slate-600 font-medium">
                <span className="flex items-center gap-2"><HardDrive className="w-3 h-3" /> Memory (RAM)</span>
                <span className="font-mono font-bold text-green-500">45% / 100%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2 text-slate-600 font-medium">
                <span className="flex items-center gap-2"><Network className="w-3 h-3" /> Network Bandwidth</span>
                <span className="font-mono font-bold text-blue-500">88% / 10 Gbps</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / SLA Status */}
        <Card className="glass">
          <CardHeader className="border-b border-black/5 bg-black/">
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-500" />
              SLA Objectives & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-white/60 border border-black/5 shadow-sm text-center">
                <div className="text-xs text-slate-500 mb-1 font-medium">Uptime (90 Days)</div>
                <div className="text-2xl font-bold font-mono text-green-500">99.995%</div>
              </div>
              <div className="p-4 rounded-lg bg-white/60 border border-black/5 shadow-sm text-center">
                <div className="text-xs text-slate-500 mb-1 font-medium">Data Freshness</div>
                <div className="text-2xl font-bold font-mono text-blue-500">&lt; 2s</div>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2.5 px-4 bg-white/60 hover:bg-white border border-black/5 shadow-sm rounded-lg text-sm text-left font-semibold text-slate-700 transition-all flex items-center justify-between group">
                <span>View Full Incident Report</span>
                <svg className="text-slate-400 group-hover:text-slate-700 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <button className="w-full py-2.5 px-4 bg-white/60 hover:bg-white border border-black/5 shadow-sm rounded-lg text-sm text-left font-semibold text-slate-700 transition-all flex items-center justify-between group">
                <span>Configure Alert Thresholds</span>
                <svg className="text-slate-400 group-hover:text-slate-700 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
