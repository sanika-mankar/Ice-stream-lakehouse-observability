import { NavLink, Outlet } from "react-router-dom";
import { 
  Activity, Database, GitCommit, LayoutDashboard, Settings, ShieldAlert, Workflow, Bell, Search,
  LineChart, Cloud, Network, Shield, Mail
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store/useStore";
import { DemoController } from "../components/ui/DemoController";

const CORE_ITEMS = [
  { name: "Overview", path: "/console/overview", icon: LayoutDashboard },
  { name: "Pipeline", path: "/console/pipeline", icon: Workflow },
  { name: "Data Quality", path: "/console/quality", icon: ShieldAlert },
  { name: "Contact Us", path: "/console/contact-us", icon: Mail },
];

const INFRASTRUCTURE_ITEMS = [
  { name: "Observability", path: "/console/observability", icon: GitCommit },
  { name: "Reliability", path: "/console/reliability", icon: Activity },
  { name: "Lakehouse", path: "/console/lakehouse", icon: Database },
  { name: "Analytics", path: "/console/analytics", icon: LineChart },
  { name: "Security Audit", path: "/console/security", icon: Shield },
  { name: "Network Mesh", path: "/console/network", icon: Network },
  { name: "Cloud Config", path: "/console/cloud", icon: Cloud },
  { name: "System", path: "/console/system", icon: Settings },
];

export default function DashboardLayout() {
  const { status, metrics } = useStore();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="flex h-14 items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-status-active flex items-center justify-center">
              <span className="text-background font-bold text-xs">IS</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight">ICE STREAM</h1>
          </div>
        </div>
        
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 uppercase">Infrastructure</div>
          <nav className="space-y-1">
            {INFRASTRUCTURE_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              )}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <DemoController />
        </div>

        <div className="p-4 border-t border-border mt-auto flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">Admin</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Production Ops</span>
              <span className="text-xs text-muted-foreground">v2.4.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/50 backdrop-blur-sm px-4 lg:px-6 sticky top-0 z-10">
          <nav className="flex items-center gap-1 shrink-0">
            {CORE_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all shrink-0",
                isActive ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              )}>
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex-1 flex items-center min-w-0 max-w-sm ml-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search resources, nodes, alerts..." 
                className="h-8 w-full rounded-md border border-input bg-transparent pl-8 pr-14 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <kbd className="absolute right-2 top-1.5 text-[10px] font-mono border border-border px-1.5 py-0.5 rounded text-muted-foreground bg-muted/60 select-none pointer-events-none">Ctrl+K</kbd>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto shrink-0">
            <div className="flex items-center gap-2 text-xs whitespace-nowrap shrink-0">
              <span className={cn("h-2 w-2 rounded-full shrink-0 animate-pulse", 
                status === 'HEALTHY' ? "bg-status-healthy" : 
                status === 'CRITICAL' ? "bg-status-critical" : "bg-status-warning"
              )}></span>
              <span className="font-medium text-muted-foreground hidden sm:inline-block whitespace-nowrap">
                {status === 'HEALTHY' ? 'All Systems Operational' : `System Status: ${status}`}
              </span>
            </div>
            
            <button className="relative text-muted-foreground hover:text-foreground transition-colors p-1" title="Alerts">
              <Bell className="h-4 w-4" />
              {metrics.activeIncidents > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-status-critical ring-2 ring-background" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
