
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useStore } from "../lib/store/useStore";
import { Activity, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const { status, quality } = useStore();

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Monitor the overall health and real-time performance of Ice Stream.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass border-l-4 border-l-status-healthy">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-status-healthy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-healthy">{status}</div>
            <p className="text-xs text-muted-foreground mt-1">All services operational</p>
          </CardContent>
        </Card>

        <Card className="glass border-l-4 border-l-status-active">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Data Quality Score</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-status-active" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-active">{quality.qualityScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Based on {quality.totalEvents.toLocaleString()} events</p>
          </CardContent>
        </Card>

        <Card className="glass border-l-4 border-l-status-critical">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quarantined Events</CardTitle>
            <ShieldAlert className="h-4 w-4 text-status-critical" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-critical">{quality.invalidEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires manual investigation</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for Pipeline Node Map to be built in Master Prompt 3 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Live Data Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full flex items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
            <p className="text-muted-foreground text-sm">React Flow Pipeline Map will be rendered here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
