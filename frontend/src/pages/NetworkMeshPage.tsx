import { Network, Activity, ArrowRightLeft, Radio, Wifi, DatabaseZap } from "lucide-react";
import { cn } from "../lib/utils";

export default function NetworkMeshPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Mesh Topology</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visualize interconnectivity, bandwidth, and node health across the cluster.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse"></span>
            Syncing
          </div>
          <button className="px-4 py-2 rounded-md border border-input bg-card text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2">
            <Network className="h-4 w-4" />
            Discover Nodes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass rounded-xl border border-border/50 p-6 h-[500px] flex flex-col relative overflow-hidden">
          <h2 className="text-lg font-semibold mb-4">Topology Map</h2>
          <div className="absolute top-4 right-4 text-xs text-muted-foreground flex gap-3">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-healthy"></div> Active</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-warning"></div> Degraded</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-status-critical"></div> Offline</div>
          </div>
          
          {/* Simulated Network Graph */}
          <div className="flex-1 w-full relative flex items-center justify-center bg-black/20 rounded-lg border border-border/30 mt-2">
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            
            {/* Center node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)] z-10">
                <DatabaseZap className="h-8 w-8 text-primary" />
              </div>
              <span className="mt-2 text-xs font-bold">API Gateway</span>
            </div>

            {/* Connecting lines & satellite nodes (simplified DOM simulation) */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full">
                <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="hsl(var(--primary))" strokeWidth="2" strokeOpacity="0.4" />
                <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="hsl(var(--primary))" strokeWidth="2" strokeOpacity="0.4" />
                <line x1="50%" y1="50%" x2="25%" y2="75%" stroke="var(--color-status-warning)" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="4" />
                <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="hsl(var(--primary))" strokeWidth="2" strokeOpacity="0.4" />
              </svg>
            </div>

            <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-card border-2 border-status-healthy flex items-center justify-center z-10 shadow-lg">
                <Activity className="h-5 w-5 text-status-healthy" />
              </div>
              <span className="mt-2 text-[10px] font-medium bg-background/80 px-2 py-0.5 rounded">Auth Svc</span>
            </div>

            <div className="absolute top-[25%] left-[75%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-card border-2 border-status-healthy flex items-center justify-center z-10 shadow-lg">
                <Wifi className="h-5 w-5 text-status-healthy" />
              </div>
              <span className="mt-2 text-[10px] font-medium bg-background/80 px-2 py-0.5 rounded">Payments Svc</span>
            </div>

            <div className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-card border-2 border-status-warning flex items-center justify-center z-10 shadow-lg">
                <Radio className="h-5 w-5 text-status-warning" />
              </div>
              <span className="mt-2 text-[10px] font-medium bg-background/80 px-2 py-0.5 rounded text-status-warning">Legacy DB</span>
            </div>

            <div className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-full bg-card border-2 border-status-healthy flex items-center justify-center z-10 shadow-lg">
                <DatabaseZap className="h-5 w-5 text-status-healthy" />
              </div>
              <span className="mt-2 text-[10px] font-medium bg-background/80 px-2 py-0.5 rounded">Analytics DB</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass rounded-xl border border-border/50 p-6">
            <h2 className="text-lg font-semibold mb-4">Ingress / Egress</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-blue-400"/> Inbound Traffic</span>
                  <span className="font-mono">4.2 GB/s</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-400 h-2.5 rounded-full w-[65%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-purple-400"/> Outbound Traffic</span>
                  <span className="font-mono">1.8 GB/s</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-400 h-2.5 rounded-full w-[35%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl border border-border/50 p-6 flex-1">
            <h2 className="text-lg font-semibold mb-4">Routing Rules</h2>
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
                <div className="flex items-center justify-between font-medium mb-1">
                  <span>api-gateway-route</span>
                  <span className="text-xs px-2 py-0.5 bg-status-healthy/20 text-status-healthy rounded">Active</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">Match: /* → upstream_cluster</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
                <div className="flex items-center justify-between font-medium mb-1">
                  <span>auth-canary</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded">Testing</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">Weight: 90% (v1) / 10% (v2)</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
                <div className="flex items-center justify-between font-medium mb-1">
                  <span>legacy-db-fallback</span>
                  <span className="text-xs px-2 py-0.5 bg-status-warning/20 text-status-warning rounded">Triggered</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">Condition: Timeout &gt; 500ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Build SVG topology map

// Add ingress/egress bandwidth meters

// Implement routing rules view

// Finalize network mesh components
