import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useStore } from '../../lib/store/useStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { DataTable } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';

export function QualityOverview() {
  const { quality } = useStore();

  // Mock trend data for charts
  const qualityTrend = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    score: 95 + Math.random() * 5,
    errorRate: Math.random() * 2
  }));

  const violationCategories = [
    { name: 'Schema', count: 845, fill: '#f59e0b' }, // amber-500
    { name: 'Null Value', count: 420, fill: '#06b6d4' }, // cyan-500
    { name: 'Type Mismatch', count: 180, fill: '#ef4444' }, // red-500
    { name: 'Range Bounds', count: 55, fill: '#8b5cf6' }, // violet-500
  ];

  const recentViolations = [
    { id: 'V-01', ruleId: 'DQ-001', description: 'Missing required field: transaction_id', severity: 'critical', timestamp: new Date().toISOString() },
    { id: 'V-02', ruleId: 'DQ-003', description: 'Type mismatch on field: price (expected float)', severity: 'high', timestamp: new Date(Date.now() - 5000).toISOString() },
    { id: 'V-03', ruleId: 'DQ-008', description: 'Enum violation on field: status', severity: 'medium', timestamp: new Date(Date.now() - 15000).toISOString() },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-green-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-white/50 font-bold flex justify-between items-center">
              Overall Score
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{quality.qualityScore.toFixed(2)}%</div>
            <div className="flex items-center text-xs text-green-400 mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> +0.5% vs yesterday
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-cyan-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-white/50 font-bold flex justify-between items-center">
              Valid Records
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{quality.validEvents.toLocaleString()}</div>
            <div className="text-xs text-white/50 mt-1 font-medium">Out of total processed</div>
          </CardContent>
        </Card>
        
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-red-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-white/50 font-bold flex justify-between items-center">
              Quarantined (DLQ)
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{quality.invalidEvents.toLocaleString()}</div>
            <div className="flex items-center text-xs text-red-400 mt-1 font-medium">
              <TrendingDown className="w-3 h-3 mr-1" /> -12% vs last hour
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-amber-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-white/50 font-bold flex justify-between items-center">
              Error Rate
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">0.12%</div>
            <div className="text-xs text-white/50 mt-1 font-medium">Within 1.0% SLA threshold</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-white text-sm">Quality Score Trend (24h)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qualityTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[90, 100]} stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#4ade80', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-white text-sm">Violations by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationCategories} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass bg-black/20 backdrop-blur-md border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <CardHeader className="border-b border-white/5 bg-white/5">
          <CardTitle className="text-white text-sm">Recent Violations & Quarantine DLQ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-white/60 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Violation ID</th>
                  <th className="px-6 py-4 font-medium">Rule ID</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentViolations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-cyan-400">{violation.id}</td>
                    <td className="px-6 py-4 font-mono text-white/80">{violation.ruleId}</td>
                    <td className="px-6 py-4 text-white/90">{violation.description}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={violation.severity} />
                    </td>
                    <td className="px-6 py-4 text-white/50 font-mono text-xs">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
