import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useStore } from '../../lib/store/useStore';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';
import type { QuarantineRecord } from '../../lib/types';
import { ViolationInspector } from './ViolationInspector';

export function QualityViolations() {
  const { quarantineRecords } = useStore();
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(null);

  const filtered = quarantineRecords.filter(r => 
    r.ruleId.toLowerCase().includes(search.toLowerCase()) || 
    r.field.toLowerCase().includes(search.toLowerCase()) ||
    r.eventId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Quarantined</span>
            <span className="text-3xl font-bold font-mono">1,500</span>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Rate</span>
            <span className="text-3xl font-bold font-mono text-status-critical">5 / sec</span>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Violation</span>
            <span className="text-xl font-bold font-mono text-status-critical mt-1 text-center truncate w-full">INVALID_TYPE</span>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Source</span>
            <span className="text-xl font-bold font-mono mt-1 text-center truncate w-full">mobile_app_ios</span>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Violations</CardTitle>
          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search violations..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([JSON.stringify(quarantineRecords, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `violations-export.json`;
              a.click();
            }}>
              Export Violations
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Event ID</th>
                  <th className="px-4 py-3 font-medium">Rule</th>
                  <th className="px-4 py-3 font-medium">Field</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedRecord(record)}>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(record.timestamp).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-mono">{record.eventId}</td>
                    <td className="px-4 py-3 font-medium text-status-critical">{record.ruleId}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{record.field}</td>
                    <td className="px-4 py-3">{record.source}</td>
                    <td className="px-4 py-3">
                      <Badge variant={record.severity === 'critical' ? 'danger' : record.severity === 'error' ? 'warning' : 'default'}>
                        {record.severity.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No violations found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <ViolationInspector record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
