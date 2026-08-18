import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useStore } from "../lib/store/useStore";
import { Activity, ShieldAlert, CheckCircle2, Zap, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { status, metrics, quality, activityFeed } = useStore();

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground">Real-time observability and pipeline health monitoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Events / sec"
          value={metrics.eventsPerSec.toLocaleString()}
          icon={Zap}
          trend={metrics.eventsPerSec > 2000 ? "up" : "down"}
          trendValue="Live"
          statusColor="text-status-active"
        />
        <MetricCard
          title="Events Processed"
          value={(metrics.eventsProcessed / 1000000).toFixed(2) + "M"}
          icon={HardDrive}
          trend="up"
          trendValue="+12% today"
        />
        <MetricCard
          title="Data Quality Score"
          value={`${quality.qualityScore.toFixed(2)}%`}
          icon={CheckCircle2}
          trend={quality.qualityScore > 98 ? "stable" : "down"}
          statusColor={quality.qualityScore > 98 ? "text-status-healthy" : "text-status-critical"}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(2)}%`}
          icon={AlertTriangle}
          trend={metrics.errorRate > 5 ? "up" : "stable"}
          statusColor={metrics.errorRate > 5 ? "text-status-critical" : "text-muted-foreground"}
        />
        <MetricCard
          title="Processing Latency"
          value={`${metrics.processingLatency}ms`}
          icon={Clock}
          trend={metrics.processingLatency > 100 ? "up" : "stable"}
          statusColor={metrics.processingLatency > 100 ? "text-status-warning" : "text-muted-foreground"}
        />
        <MetricCard
          title="Kafka Lag"
          value={metrics.kafkaLag.toLocaleString()}
          icon={Activity}
          trend={metrics.kafkaLag > 500 ? "up" : "stable"}
          statusColor={metrics.kafkaLag > 500 ? "text-status-warning" : "text-muted-foreground"}
        />
        <MetricCard
          title="DLQ Records"
          value={metrics.dlqRecords.toLocaleString()}
          icon={ShieldAlert}
          statusColor="text-status-critical"
        />
        <MetricCard
          title="Active Incidents"
          value={metrics.activeIncidents}
          icon={AlertTriangle}
          statusColor={metrics.activeIncidents > 0 ? "text-status-critical" : "text-status-healthy"}
        />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Static Pipeline Flow Placeholder (Prompt 3 replaces this with React Flow) */}
        <Card className="col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Pipeline Health</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/10 rounded-b-lg border-t border-border">
            <div className="flex items-center space-x-4 w-full max-w-2xl justify-between">
              {['INGEST', 'PROCESS', 'VALIDATE', 'SERVE'].map((stage, idx, arr) => (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-xl border-2 border-status-active bg-status-active/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,184,217,0.2)]">
                      <Activity className="h-6 w-6 text-status-active" />
                    </div>
                    <span className="font-semibold text-sm tracking-wider">{stage}</span>
                    <StatusBadge status={status === 'HEALTHY' ? 'HEALTHY' : 'WARNING'} />
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="flex-1 h-[2px] bg-status-active/50 relative">
                       <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 overflow-hidden">
                          <div className="w-full h-full bg-status-active animate-[pulse_1.5s_ease-in-out_infinite]" />
                       </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="col-span-1 flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle>Live Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 space-y-4">
            <AnimatePresence initial={false}>
              {activityFeed.slice(0, 15).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 border-b border-border pb-3 last:border-0"
                >
                  <div className="mt-0.5 flex-shrink-0">
                     <StatusBadge status={event.severity} />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{event.source}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{event.message}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
