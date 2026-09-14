import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useStore } from '../../lib/store/useStore';
import { Search, PlusCircle, Trash2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import type { QuarantineRecord } from '../../lib/types';
import { ViolationInspector } from './ViolationInspector';
import { api } from '../../lib/api/client';

export function QualityViolations() {
  const { quarantineRecords, metrics, fetchQuarantineRecords, fetchInitialData } = useStore();
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<QuarantineRecord | null>(null);
  const [injectingRule, setInjectingRule] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return quarantineRecords.filter((r: any) => {
      const rid = String(r.ruleId || r.rule_id || '').toLowerCase();
      const fld = String(r.field || '').toLowerCase();
      const eid = String(r.eventId || r.event_id || '').toLowerCase();
      const s = search.toLowerCase();
      return rid.includes(s) || fld.includes(s) || eid.includes(s);
    });
  }, [quarantineRecords, search]);

  // Compute top violation rule & top source dynamically
  const { topRule, topSource } = useMemo(() => {
    if (!quarantineRecords.length) return { topRule: 'None', topSource: 'None' };
    const rules: Record<string, number> = {};
    const sources: Record<string, number> = {};
    quarantineRecords.forEach((r: any) => {
      const rid = r.ruleId || r.rule_id || 'UNKNOWN';
      const src = r.source || 'web';
      rules[rid] = (rules[rid] || 0) + 1;
      sources[src] = (sources[src] || 0) + 1;
    });
    const sortedRules = Object.entries(rules).sort((a, b) => b[1] - a[1]);
    const sortedSources = Object.entries(sources).sort((a, b) => b[1] - a[1]);
    return {
      topRule: sortedRules[0] ? sortedRules[0][0] : 'None',
      topSource: sortedSources[0] ? sortedSources[0][0] : 'None',
    };
  }, [quarantineRecords]);

  const handleQuickInject = async (ruleId: string) => {
    setInjectingRule(ruleId);
    try {
      await api.injectViolation(ruleId, 1);
      await fetchQuarantineRecords();
      await fetchInitialData();
    } catch (e) {
      console.error('Quick inject error:', e);
    } finally {
      setInjectingRule(null);
    }
  };

  const handleClearDLQ = async () => {
    try {
      await api.clearQuarantine();
      await fetchQuarantineRecords();
    } catch (e) {
      console.error('Clear quarantine error:', e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Quarantined</span>
            <span className="text-3xl font-bold font-mono text-status-critical">
              {quarantineRecords.length.toLocaleString()}
            </span>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Error Rate</span>
            <span className={`text-3xl font-bold font-mono ${metrics.errorRate > 2 ? 'text-status-critical' : metrics.errorRate > 0 ? 'text-status-warning' : 'text-status-healthy'}`}>
              {metrics.errorRate.toFixed(1)}%
            </span>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Violation</span>
            <span className="text-xl font-bold font-mono text-status-critical mt-1 text-center truncate w-full">
              {topRule}
            </span>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Source</span>
            <span className="text-xl font-bold font-mono mt-1 text-center truncate w-full text-foreground">
              {topSource}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Quick Test Injectors Banner */}
      <div className="p-4 rounded-xl bg-card/60 backdrop-blur-md border border-border shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Test Bad Data Injectors:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7 hover:border-red-500/50 hover:text-red-400"
            disabled={injectingRule !== null}
            onClick={() => handleQuickInject('DQ-001')}
          >
            {injectingRule === 'DQ-001' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PlusCircle className="w-3 h-3 mr-1" />}
            + DQ-001 Missing Field
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7 hover:border-red-500/50 hover:text-red-400"
            disabled={injectingRule !== null}
            onClick={() => handleQuickInject('DQ-003')}
          >
            {injectingRule === 'DQ-003' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PlusCircle className="w-3 h-3 mr-1" />}
            + DQ-003 Invalid Type
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7 hover:border-red-500/50 hover:text-red-400"
            disabled={injectingRule !== null}
            onClick={() => handleQuickInject('DQ-004')}
          >
            {injectingRule === 'DQ-004' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PlusCircle className="w-3 h-3 mr-1" />}
            + DQ-004 Bad Range
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7 hover:border-red-500/50 hover:text-red-400"
            disabled={injectingRule !== null}
            onClick={() => handleQuickInject('DQ-007')}
          >
            {injectingRule === 'DQ-007' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <PlusCircle className="w-3 h-3 mr-1" />}
            + DQ-007 Schema Drift
          </Button>
          {quarantineRecords.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleClearDLQ}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear DLQ
            </Button>
          )}
        </div>
      </div>

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Violations (DLQ Quarantine Storage)</CardTitle>
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
                {filtered.map((record: any) => {
                  const rule = record.ruleId || record.rule_id || 'UNKNOWN';
                  const eventId = record.eventId || record.event_id || 'unknown';
                  const field = record.field || 'unknown';
                  const source = record.source || 'web';
                  const severity = (record.severity || 'critical').toLowerCase();
                  return (
                    <tr key={record.id || eventId} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setSelectedRecord(record)}>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(record.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 font-mono font-medium">{eventId}</td>
                      <td className="px-4 py-3 font-bold text-status-critical">{rule}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{field}</td>
                      <td className="px-4 py-3">{source}</td>
                      <td className="px-4 py-3">
                        <Badge variant={severity === 'critical' ? 'danger' : severity === 'error' ? 'warning' : 'default'}>
                          {severity.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {quarantineRecords.length === 0 
                        ? "DLQ Quarantine is currently empty. Click one of the test injectors above or inject bad data from the demo controller to inspect violations!"
                        : `No violations found matching "${search}"`}
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
