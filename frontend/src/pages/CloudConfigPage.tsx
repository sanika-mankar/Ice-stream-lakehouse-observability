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
    </div>
  );
}
