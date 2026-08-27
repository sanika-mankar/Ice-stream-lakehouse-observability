import { BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { cn } from "../lib/utils";
import { MetricCard } from "../components/ui/MetricCard";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const revenueData = [
    { name: 'Jan', value: 40 }, { name: 'Feb', value: 70 }, { name: 'Mar', value: 45 },
    { name: 'Apr', value: 90 }, { name: 'May', value: 65 }, { name: 'Jun', value: 85 },
    { name: 'Jul', value: 120 }, { name: 'Aug', value: 100 }, { name: 'Sep', value: 140 },
    { name: 'Oct', value: 110 }, { name: 'Nov', value: 130 }, { name: 'Dec', value: 150 }
  ];
  const userGrowthData = [
    { name: 'Week 1', users: 1200 }, { name: 'Week 2', users: 1900 }, { name: 'Week 3', users: 1500 },
    { name: 'Week 4', users: 2800 }, { name: 'Week 5', users: 3400 }, { name: 'Week 6', users: 3100 },
    { name: 'Week 7', users: 4500 }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time insights and business intelligence.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80">
            Last 24 Hours
          </button>
          <button className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            7 Days
          </button>
          <button className="px-4 py-2 rounded-md border border-input text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            30 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value="$45,231.89"
          trend="up"
          trendValue="+20.1%"
          icon={DollarSign}
          statusColor="text-blue-500"
        />
        <MetricCard
          title="Active Users"
          value="2,350"
          trend="up"
          trendValue="+180.1%"
          icon={Users}
          statusColor="text-purple-500"
        />
        <MetricCard
          title="Sales"
          value="12,234"
          trend="up"
          trendValue="+19%"
          icon={Activity}
          statusColor="text-green-500"
        />
        <MetricCard
          title="Active Now"
          value="573"
          trend="up"
          trendValue="+201"
          icon={TrendingUp}
          statusColor="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl border border-black/10 p-6 flex flex-col h-[400px] bg-white/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Revenue Overview</h2>
            <BarChartIcon className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl border border-black/10 p-6 flex flex-col h-[400px] bg-white/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">User Growth Trend</h2>
            <LineChartIcon className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} fill="url(#colorUsers)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="glass rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Sales activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="px-4 py-3 rounded-l-md">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right rounded-r-md">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Olivia Martin", email: "olivia.martin@email.com", status: "Completed", method: "Credit Card", amount: "$1,999.00" },
                { name: "Jackson Lee", email: "jackson.lee@email.com", status: "Processing", method: "PayPal", amount: "$39.00" },
                { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", status: "Completed", method: "Credit Card", amount: "$299.00" },
                { name: "William Kim", email: "will@email.com", status: "Failed", method: "Bank Transfer", amount: "$99.00" },
                { name: "Sofia Davis", email: "sofia.davis@email.com", status: "Completed", method: "Credit Card", amount: "$39.00" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-4">
                    <div className="font-medium text-foreground">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", 
                      row.status === 'Completed' ? "bg-status-healthy/20 text-status-healthy" : 
                      row.status === 'Processing' ? "bg-blue-500/20 text-blue-500" : "bg-status-critical/20 text-status-critical"
                    )}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{row.method}</td>
                  <td className="px-4 py-4 text-right font-medium">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Query Performance Heatmap */}
        <div className="glass lg:col-span-2 rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Query Performance Heatmap (Top 10 Slowest)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 uppercase bg-black/">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Query Hash</th>
                  <th className="px-4 py-3">Source Engine</th>
                  <th className="px-4 py-3">Avg Latency</th>
                  <th className="px-4 py-3">P99 Latency</th>
                  <th className="px-4 py-3 rounded-tr-md">Scanned Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {[
                  { hash: "Q-8f92a1b", engine: "Trino", avg: "45.2s", p99: "120.4s", scanned: "4.2 TB", critical: true },
                  { hash: "Q-2c491xx", engine: "Spark SQL", avg: "12.8s", p99: "45.1s", scanned: "890 GB", critical: false },
                  { hash: "Q-99p21m1", engine: "Trino", avg: "8.4s", p99: "18.2s", scanned: "120 GB", critical: false },
                  { hash: "Q-4b2m9z8", engine: "Athena", avg: "6.1s", p99: "14.5s", scanned: "45 GB", critical: false },
                  { hash: "Q-1x8n3q4", engine: "Spark SQL", avg: "5.5s", p99: "12.1s", scanned: "2.1 TB", critical: false },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-black/50/5 text-slate-600 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-800 flex items-center gap-2">
                      {row.critical && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                      {row.hash}
                    </td>
                    <td className="px-4 py-3">{row.engine}</td>
                    <td className="px-4 py-3 font-mono">{row.avg}</td>
                    <td className={cn("px-4 py-3 font-mono font-bold", row.critical ? "text-red-400" : "text-amber-400")}>{row.p99}</td>
                    <td className="px-4 py-3 font-mono">{row.scanned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* ML Feature Store */}
          <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="m21 16-7.16-7.16a2.5 2.5 0 0 0-3.68 0L3 16"/><path d="m16 21-3.5-3.5a2.5 2.5 0 0 0-3.5 0L6 21"/></svg>
              ML Feature Store
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="flex justify-between text-slate-500 mb-1 text-xs">
                  <span>Feature Staleness (Avg)</span>
                  <span className="font-mono text-green-400">4m 12s</span>
                </div>
                <div className="w-full bg-black/ rounded-full h-1.5">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-slate-500 mb-1 text-xs">
                  <span>Online Store Cache Hit Rate</span>
                  <span className="font-mono text-blue-400">98.4%</span>
                </div>
                <div className="w-full bg-black/ rounded-full h-1.5">
                  <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-xs text-slate-400 block mb-2">Model Drift Alerts</span>
                <div className="p-2 border border-amber-500/30 bg-amber-500/10 rounded flex justify-between items-center text-amber-400 text-xs">
                  <span>FraudDetection_v4</span>
                  <span className="font-bold">Detected</span>
                </div>
              </div>
            </div>
          </div>

          {/* BI Reporting Status */}
          <div className="glass rounded-xl border border-black/10 p-6 bg-white/40 backdrop-blur-md flex-1">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <BarChart className="w-5 h-5 text-green-400" />
              BI Report Materialization
            </h2>
            <div className="space-y-3">
              {[
                { name: "Executive Summary", status: "Ready", time: "10m ago" },
                { name: "Sales Pipeline Data Mart", status: "Building", time: "45%" },
                { name: "Marketing Attribution", status: "Ready", time: "1h ago" },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b border-black/5 last:border-0 pb-3">
                  <span className="text-sm text-slate-600">{job.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", 
                      job.status === 'Ready' ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400 animate-pulse"
                    )}>{job.status}</span>
                    <span className="text-[10px] text-slate-400 font-mono w-12 text-right">{job.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
