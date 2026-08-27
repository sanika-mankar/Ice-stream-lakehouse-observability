import { Cloud, Server, Database, Save, HardDrive, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";

export default function CloudConfigPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cloud Infrastructure</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage cloud regions, compute instances, and storage quotas.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-accent hover:text-accent-foreground flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Config
          </button>
          <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
            <Save className="h-4 w-4" />
            Apply Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { region: "us-east-1", status: "Active", servers: 42, compute: "68%", storage: "4.2 PB" },
          { region: "eu-west-2", status: "Active", servers: 18, compute: "45%", storage: "1.8 PB" },
          { region: "ap-south-1", status: "Degraded", servers: 12, compute: "92%", storage: "900 TB" }
        ].map((region, i) => (
          <div key={i} className="glass rounded-xl border border-border/50 p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Cloud className={cn("h-16 w-16 opacity-5 transition-transform group-hover:scale-110", 
                region.status === 'Active' ? "text-primary" : "text-status-warning"
              )} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl">{region.region}</h3>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded", 
                region.status === 'Active' ? "bg-status-healthy/20 text-status-healthy" : "bg-status-warning/20 text-status-warning"
              )}>
                {region.status}
              </span>
            </div>
            
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Server className="w-4 h-4"/> Compute Instances</span>
                <span className="font-mono font-medium">{region.servers}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                <div className={cn("h-1.5 rounded-full", parseInt(region.compute) > 80 ? "bg-status-warning" : "bg-primary")} style={{ width: region.compute }}></div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><HardDrive className="w-4 h-4"/> Storage Used</span>
                <span className="font-mono font-medium">{region.storage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Infrastructure as Code (IaC) Drift</h2>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">Last checked: 5 mins ago</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-4 py-3 rounded-l-md">Resource Type</th>
                <th className="px-4 py-3">Resource ID</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Drift Details</th>
                <th className="px-4 py-3 text-right rounded-r-md">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: "AWS::EC2::Instance", id: "i-0abcd1234efgh5678", state: "In Sync", details: "-", action: "None" },
                { type: "AWS::S3::Bucket", id: "icestream-prod-data-eu", state: "Drifted", details: "Tags modified manually", action: "Revert" },
                { type: "AWS::RDS::DBCluster", id: "prod-aurora-cluster-1", state: "In Sync", details: "-", action: "None" },
                { type: "AWS::IAM::Role", id: "DataScientistRole", state: "Drifted", details: "Policy attached outside IaC", action: "Review" },
                { type: "AWS::EKS::Cluster", id: "icestream-k8s-main", state: "In Sync", details: "-", action: "None" },
                { type: "AWS::EC2::SecurityGroup", id: "sg-0987654321fedcba", state: "Drifted", details: "Ingress rule added (Port 22)", action: "Revert (High Priority)" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-4 flex items-center gap-2">
                    {row.type.includes('DB') ? <Database className="w-4 h-4 text-muted-foreground" /> : 
                     row.type.includes('EC2') ? <Server className="w-4 h-4 text-muted-foreground" /> : 
                     <Cloud className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-mono text-xs">{row.type}</span>
                  </td>
                  <td className="px-4 py-4 font-medium">{row.id}</td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", 
                      row.state === 'In Sync' ? "bg-status-healthy/20 text-status-healthy" : "bg-status-warning/20 text-status-warning"
                    )}>
                      {row.state}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground text-xs">{row.details}</td>
                  <td className="px-4 py-4 text-right">
                    {row.state === 'Drifted' ? (
                       <button className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                         {row.action}
                       </button>
                    ) : (
                       <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Reserved Instance Coverage */}
        <div className="glass rounded-xl border border-white/10 p-6 bg-black/20 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Reserved Instance (RI) Coverage
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 text-white/80">
                <span>EC2 Compute Coverage (Target: 80%)</span>
                <span className="font-mono text-green-400">82%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-white/80">
                <span>RDS Database Coverage (Target: 90%)</span>
                <span className="font-mono text-amber-400">65%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5">
              <h4 className="text-sm font-semibold text-white mb-2">Cost Optimization Recommendation</h4>
              <p className="text-xs text-white/60 mb-3">Purchasing a 1-year No Upfront RI for `db.r6g.4xlarge` in `eu-west-2` will save approximately <strong className="text-green-400 font-mono">$1,240/mo</strong>.</p>
              <button className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded hover:bg-green-500/30 transition-colors">
                Review Purchase Options
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Cloud Topology */}
        <div className="glass rounded-xl border border-white/10 p-6 bg-black/20 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2v0a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/></svg>
            Multi-Cloud Transit Gateway
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-sm font-medium text-white">AWS (Primary)</div>
                  <div className="text-[10px] text-white/50">VPC: vpc-0a1b2c3d</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-green-400">Connected</div>
                <div className="text-[10px] text-white/50">BGP Active</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="w-px h-6 bg-white/20"></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-white">GCP (Analytics & ML)</div>
                  <div className="text-[10px] text-white/50">VPC: prod-data-net</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-green-400">Connected</div>
                <div className="text-[10px] text-white/50">IPSec Tunnel UP</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 px-2">
              <span className="text-[10px] text-white/40">Cross-Cloud Latency</span>
              <span className="text-[10px] font-mono font-bold text-green-400">8.2ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
