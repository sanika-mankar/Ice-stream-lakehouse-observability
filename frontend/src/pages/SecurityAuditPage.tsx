import { ShieldAlert, ShieldCheck, Lock, Key, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function SecurityAuditPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security & Compliance</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time vulnerability monitoring, access logs, and compliance status.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Run Security Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-status-healthy/20 flex items-center justify-center mb-2">
            <ShieldCheck className="h-8 w-8 text-status-healthy" />
          </div>
          <h2 className="text-2xl font-bold">98%</h2>
          <p className="text-sm text-muted-foreground">Compliance Score</p>
        </div>
        
        <div className="glass p-6 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-status-warning/20 flex items-center justify-center mb-2">
            <AlertTriangle className="h-8 w-8 text-status-warning" />
          </div>
          <h2 className="text-2xl font-bold">12</h2>
          <p className="text-sm text-muted-foreground">Active Vulnerabilities</p>
        </div>

        <div className="glass p-6 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
            <Lock className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold">1,402</h2>
          <p className="text-sm text-muted-foreground">Policies Enforced</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl border border-border/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Vulnerabilities</h2>
          <div className="space-y-4">
            {[
              { id: "CVE-2026-1049", severity: "High", package: "express@4.18.2", status: "Open" },
              { id: "CVE-2026-0091", severity: "Medium", package: "lodash@4.17.20", status: "In Progress" },
              { id: "CVE-2025-4411", severity: "Low", package: "react@18.2.0", status: "Resolved" },
              { id: "CVE-2026-2104", severity: "Critical", package: "jsonwebtoken@8.5.1", status: "Open" },
              { id: "CVE-2025-9981", severity: "High", package: "axios@1.6.0", status: "Resolved" },
            ].map((vuln, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/30 hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", 
                    vuln.severity === 'Critical' ? "bg-status-critical" : 
                    vuln.severity === 'High' ? "bg-status-warning" : 
                    vuln.severity === 'Medium' ? "bg-blue-400" : "bg-status-healthy"
                  )} />
                  <div>
                    <div className="font-medium text-sm">{vuln.id}</div>
                    <div className="text-xs text-muted-foreground font-mono">{vuln.package}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">{vuln.severity}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{vuln.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl border border-border/50 p-6">
          <h2 className="text-lg font-semibold mb-4">IAM Activity Log</h2>
          <div className="space-y-4 h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {[
              { user: "admin@icestream.io", action: "Updated Role", resource: "arn:aws:iam::123:role/DataEng", time: "2 mins ago", icon: Key, color: "text-blue-400" },
              { user: "system-worker", action: "Assumed Role", resource: "arn:aws:iam::123:role/S3Reader", time: "15 mins ago", icon: CheckCircle2, color: "text-status-healthy" },
              { user: "unknown", action: "Failed Login", resource: "IP: 192.168.1.55", time: "1 hour ago", icon: ShieldAlert, color: "text-status-critical" },
              { user: "j.doe@icestream.io", action: "Created Policy", resource: "arn:aws:iam::123:policy/ReadO", time: "3 hours ago", icon: Key, color: "text-blue-400" },
              { user: "admin@icestream.io", action: "MFA Setup", resource: "User: s.smith", time: "5 hours ago", icon: Lock, color: "text-status-healthy" },
              { user: "admin@icestream.io", action: "Updated Role", resource: "arn:aws:iam::123:role/DataEng", time: "2 mins ago", icon: Key, color: "text-blue-400" },
              { user: "system-worker", action: "Assumed Role", resource: "arn:aws:iam::123:role/S3Reader", time: "15 mins ago", icon: CheckCircle2, color: "text-status-healthy" },
            ].map((log, i) => (
              <div key={i} className="flex gap-4 p-2">
                <div className="mt-0.5">
                  <log.icon className={cn("h-4 w-4", log.color)} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.user} on <span className="font-mono">{log.resource}</span></p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add compliance score gauges
