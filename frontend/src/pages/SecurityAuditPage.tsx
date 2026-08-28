import { ShieldAlert, ShieldCheck, Lock, Key, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function SecurityAuditPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 pb-20 font-georgia">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* PII Data Access Logs */}
        <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5-2 8 8 0 0 0-5 2H2Z"/></svg>
            PII Data Access Audit (Last 24h)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 uppercase bg-black/">
                <tr>
                  <th className="px-3 py-2 rounded-tl-md">User / Role</th>
                  <th className="px-3 py-2">Table Accessed</th>
                  <th className="px-3 py-2">Rows</th>
                  <th className="px-3 py-2 rounded-tr-md">Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-slate-600">
                <tr className="hover:bg-black/50/5">
                  <td className="px-3 py-2 text-xs font-mono">analytics-svc</td>
                  <td className="px-3 py-2 text-xs">users.profiles (SSN)</td>
                  <td className="px-3 py-2 text-xs font-mono">1,250</td>
                  <td className="px-3 py-2 text-xs text-amber-400">Automated Masking Job</td>
                </tr>
                <tr className="hover:bg-black/50/5 bg-red-500/5">
                  <td className="px-3 py-2 text-xs font-mono text-red-400">j.doe@corp</td>
                  <td className="px-3 py-2 text-xs">payments.history</td>
                  <td className="px-3 py-2 text-xs font-mono">5</td>
                  <td className="px-3 py-2 text-xs text-red-400 font-medium">Flagged: Manual Query</td>
                </tr>
                <tr className="hover:bg-black/50/5">
                  <td className="px-3 py-2 text-xs font-mono">support-agent-22</td>
                  <td className="px-3 py-2 text-xs">users.contact</td>
                  <td className="px-3 py-2 text-xs font-mono">1</td>
                  <td className="px-3 py-2 text-xs text-slate-500">Ticket #99122</td>
                </tr>
                <tr className="hover:bg-black/50/5">
                  <td className="px-3 py-2 text-xs font-mono">ml-training-job</td>
                  <td className="px-3 py-2 text-xs">users.behavior</td>
                  <td className="px-3 py-2 text-xs font-mono">4.2M</td>
                  <td className="px-3 py-2 text-xs text-slate-500">Scheduled Training</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Status Details */}
        <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15L11 17L15 13"/></svg>
            Framework Compliance Details
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1 text-slate-800">
                <span>SOC 2 Type II</span>
                <span className="font-mono text-green-400">100% Passed</span>
              </div>
              <div className="w-full bg-black/ rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1 text-slate-800">
                <span>GDPR / CCPA</span>
                <span className="font-mono text-amber-400">92% (1 Warning)</span>
              </div>
              <div className="w-full bg-black/ rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <p className="text-[10px] text-amber-400/80 mt-1">Warning: Data retention policy &gt; 30 days on log bucket.</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 text-slate-800">
                <span>HIPAA</span>
                <span className="font-mono text-green-400">100% Passed</span>
              </div>
              <div className="w-full bg-black/ rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="pt-2 border-t border-black/5">
              <button className="w-full py-2 bg-blue-500/10 text-blue-400 text-sm font-medium border border-blue-500/20 rounded-md hover:bg-blue-500/20 transition-colors">
                Generate Auditor Report (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
