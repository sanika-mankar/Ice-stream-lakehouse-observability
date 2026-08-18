
import { NavLink, Outlet } from "react-router-dom";
import { 
  Activity, 
  Database, 
  GitCommit, 
  LayoutDashboard, 
  Settings, 
  ShieldAlert, 
  Workflow 
} from "lucide-react";
import { cn } from "../lib/utils";

const SIDEBAR_ITEMS = [
  { name: "Overview", path: "/overview", icon: LayoutDashboard },
  { name: "Pipeline", path: "/pipeline", icon: Workflow },
  { name: "Data Quality", path: "/quality", icon: ShieldAlert },
  { name: "Reliability", path: "/reliability", icon: Activity },
  { name: "Lakehouse", path: "/lakehouse", icon: Database },
  { name: "Observability", path: "/observability", icon: GitCommit },
  { name: "System", path: "/system", icon: Settings },
];

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card">
        <div className="flex h-14 items-center px-6 border-b border-border">
          <h1 className="font-bold text-xl tracking-tight text-status-active">
            ICE STREAM
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6">
          <div className="flex-1 flex items-center">
            {/* Breadcrumbs can go here */}
            <span className="text-sm text-muted-foreground font-medium">Production Environment</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-status-healthy"></span>
              System Healthy
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
