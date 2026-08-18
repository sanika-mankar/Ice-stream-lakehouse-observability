import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useStore } from '../../lib/store/useStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { DataTable } from '../ui/DataTable';
import { StatusBadge } from '../ui/StatusBadge';

export function QualityOverview() {
  const { quality } = useStore();

  // Mock trend data for charts
  const qualityTrend = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    score: 95 + Math.random() * 5,
    errorRate: Math.random() * 2
  }));

  const violationCategories = [
    { name: 'Schema', count: 845, fill: 'var(--color-status-warning)' },
    { name: 'Null Value', count: 420, fill: 'var(--color-status-active)' },
    { name: 'Type Mismatch', count: 180, fill: 'var(--color-status-critical)' },
    { name: 'Range Bounds', count: 55, fill: 'var(--color-status-analytics)' },
  ];

  const recentViolations = [
    { id: 'V-01', ruleId: 'DQ-001', description: 'Missing required field: transaction_id', severity: 'critical', timestamp: new Date().toISOString() },
    { id: 'V-02', ruleId: 'DQ-003', description: 'Type mismatch on field: price (expected float)', severity: 'high', timestamp: new Date(Date.now() - 5000).toISOString() },
    { id: 'V-03', ruleId: 'DQ-008', description: 'Enum violation on field: status', severity: 'medium', timestamp: new Date(Date.now() - 15000).toISOString() },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Quality</h1>
        <p className="text-muted-foreground">Monitor schema compliance and real-time data integrity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overall Score</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-status-healthy">{quality.qualityScore.toFixed(2)}%</div></CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Valid Records</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{quality.validEvents.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Quarantined</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-status-critical">{quality.invalidEvents.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Error Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-status-warning">0.12%</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quality Score Trend (24h)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[90, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--color-status-active)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Violations by Category</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationCategories} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Violations & Quarantine DLQ</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={recentViolations}
            columns={[
              { header: "Violation ID", accessorKey: "id", className: "font-mono font-medium" },
              { header: "Rule ID", accessorKey: "ruleId", className: "font-mono" },
              { header: "Description", accessorKey: "description" },
              { 
                header: "Severity", 
                accessorKey: "severity", 
                cell: (row) => <StatusBadge status={row.severity} /> 
              },
              { 
                header: "Timestamp", 
                accessorKey: "timestamp",
                cell: (row) => new Date(row.timestamp).toLocaleTimeString()
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
