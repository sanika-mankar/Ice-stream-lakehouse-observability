import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useStore } from '../../lib/store/useStore';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';

export function QualityRules() {
  const { qualityRules } = useStore();
  const [search, setSearch] = useState('');

  const filtered = qualityRules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Data Quality Rules</CardTitle>
          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search rules..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([JSON.stringify(qualityRules, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dq-rules-export.json`;
              a.click();
            }}>
              Export Rules
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Rule ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((rule) => (
                  <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{rule.id}</td>
                    <td className="px-4 py-3 font-medium">{rule.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={rule.severity === 'critical' ? 'danger' : rule.severity === 'error' ? 'warning' : 'default'}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-status-healthy"></span>
                        <span className="text-xs uppercase">{rule.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[300px]" title={rule.description}>{rule.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{rule.violationCount.toLocaleString()}</td>
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
