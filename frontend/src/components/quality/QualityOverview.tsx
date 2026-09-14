import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useStore } from '../../lib/store/useStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { DataTable } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';

export function QualityOverview() {
  const { quality, metrics, quarantineRecords } = useStore();

  // Dynamic quality trend data based on current score
  const qualityTrend = Array.from({ length: 12 }).map((_, i) => {
    const noise = (Math.sin(i) * 0.4);
    const score = Math.min(100, Math.max(0, quality.qualityScore + noise));
    return {
      time: `${i * 2}:00`,
      score: Number(score.toFixed(1)),
      errorRate: Number(Math.max(0, 100 - score).toFixed(2)),
    };
  });

  // Calculate dynamic violation categories from quarantineRecords
  const violationCategories = React.useMemo(() => {
    const counts = { Schema: 0, NullValue: 0, TypeMismatch: 0, RangeBounds: 0, EnumViolation: 0 };
    quarantineRecords.forEach((r: any) => {
      const rid = (r.ruleId || r.rule_id || '').toUpperCase();
      if (rid === 'DQ-001' || rid === 'DQ-007' || rid === 'DQ-008') counts.Schema++;
      else if (rid === 'DQ-002') counts.NullValue++;
      else if (rid === 'DQ-003') counts.TypeMismatch++;
      else if (rid === 'DQ-004') counts.RangeBounds++;
      else counts.EnumViolation++;
    });
    return [
      { name: 'Schema (DQ-1/7/8)', count: counts.Schema, fill: '#f59e0b' },
      { name: 'Null Value (DQ-2)', count: counts.NullValue, fill: '#06b6d4' },
      { name: 'Type Mismatch (DQ-3)', count: counts.TypeMismatch, fill: '#ef4444' },
      { name: 'Range (DQ-4)', count: counts.RangeBounds, fill: '#8b5cf6' },
    ];
  }, [quarantineRecords]);

  const recentViolations = quarantineRecords.slice(0, 5).map((r: any) => ({
    id: r.id || r.eventId || 'V-01',
    ruleId: r.ruleId || r.rule_id || 'DQ-001',
    description: `Violation on field '${r.field || 'unknown'}': expected ${r.expected || 'valid'}, got ${r.actual || 'invalid'}`,
    severity: (r.severity || 'critical').toUpperCase(),
    timestamp: r.timestamp || new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-green-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold flex justify-between items-center">
              Overall Score
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{quality.qualityScore.toFixed(2)}%</div>
            <div className="flex items-center text-xs text-green-400 mt-1 font-medium">
              <TrendingUp className="w-3 h-3 mr-1" /> +0.5% vs yesterday
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-cyan-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold flex justify-between items-center">
              Valid Records
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{quality.validEvents.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Out of total processed</div>
          </CardContent>
        </Card>
        
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-red-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold flex justify-between items-center">
              Quarantined (DLQ)
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{quality.invalidEvents.toLocaleString()}</div>
            <div className="flex items-center text-xs text-red-400 mt-1 font-medium">
              <TrendingDown className="w-3 h-3 mr-1" /> -12% vs last hour
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-lg relative overflow-hidden group">
          <div className="absolute left-0 top-0 w-1 h-full bg-amber-400" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold flex justify-between items-center">
              Error Rate
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-mono ${metrics.errorRate > 2 ? 'text-red-500' : 'text-slate-800'}`}>
              {metrics.errorRate.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {metrics.errorRate > 2 ? 'BREACH: Exceeds strict 2.0% threshold' : 'Within strict 2.0% threshold'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <CardHeader className="border-b border-black/5 bg-black/">
            <CardTitle className="text-slate-800 text-sm">Quality Score Trend (24h)</CardTitle>
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

        <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <CardHeader className="border-b border-black/5 bg-black/">
            <CardTitle className="text-slate-800 text-sm">Violations by Category</CardTitle>
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

      <Card className="glass bg-white/40 backdrop-blur-md border-black/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <CardHeader className="border-b border-black/5 bg-black/">
          <CardTitle className="text-slate-800 text-sm">Recent Violations & Quarantine DLQ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/ text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Violation ID</th>
                  <th className="px-6 py-4 font-medium">Rule ID</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {recentViolations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-black/50/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-cyan-400">{violation.id}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{violation.ruleId}</td>
                    <td className="px-6 py-4 text-slate-700">{violation.description}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={violation.severity} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
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
