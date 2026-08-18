import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../lib/store/useStore';
import { Database, Clock, ArrowRightLeft } from 'lucide-react';
import type { IcebergSnapshot } from '../lib/types';

export default function LakehousePage() {
  const { snapshots, metrics } = useStore();
  const [selectedSnapshot, setSelectedSnapshot] = useState<IcebergSnapshot | null>(snapshots[0] || null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState<IcebergSnapshot | null>(snapshots[1] || null);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lakehouse & Time Travel</h1>
        <p className="text-muted-foreground">Inspect Iceberg table snapshots and travel back in time to compare states.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader className="pb-4 border-b border-border bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Clean Transactions Table
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Total Records</span>
                <span className="text-3xl font-bold font-mono">{metrics.eventsProcessed.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Latest Snapshot</span>
                <span className="text-xl font-bold font-mono">{snapshots[0]?.id || 'N/A'}</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Schema Version</span>
                <span className="font-mono">v2.1.0</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Partitioning</span>
                <span className="font-mono">day(timestamp)</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">Health Status</span>
                <Badge variant="default" className="bg-status-healthy/20 text-status-healthy border-status-healthy/30">OPTIMIZED</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-4 border-b border-border bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-status-warning" />
              Quarantine Transactions Table
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Total Records</span>
                <span className="text-3xl font-bold font-mono text-status-warning">{metrics.dlqRecords.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-wider">Latest Snapshot</span>
                <span className="text-xl font-bold font-mono">88</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Schema Version</span>
                <span className="font-mono">v1.0.0 (Flexible)</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Partitioning</span>
                <span className="font-mono">day(timestamp), rule_id</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-muted-foreground">Health Status</span>
                <Badge variant="default" className="bg-status-warning/20 text-status-warning border-status-warning/30">NEEDS COMPACTION</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass md:col-span-1 h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Snapshot Timeline
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-border">
              {snapshots.map(snap => (
                <button 
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  className={`p-4 text-left transition-colors hover:bg-muted/30 ${selectedSnapshot?.id === snap.id ? 'bg-muted/50 border-l-2 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-lg">#{snap.id}</span>
                    <span className="text-xs text-muted-foreground">{new Date(snap.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex gap-2 items-center mb-1">
                    <Badge variant={snap.operation === 'overwrite' ? 'warning' : 'default'} className="text-[10px] px-1.5 py-0">
                      {snap.operation.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono">{snap.records.toLocaleString()} rows</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{snap.summary}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Time Travel Viewer (Simulation)</CardTitle>
            <button 
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${compareMode ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              {compareMode ? 'Exit Compare Mode' : 'Compare Snapshots'}
            </button>
          </CardHeader>
          <CardContent>
            {selectedSnapshot && !compareMode && (
              <div className="space-y-6">
                <div className="bg-muted/20 border border-border rounded-lg p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-mono mb-1">Snapshot {selectedSnapshot.id}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(selectedSnapshot.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-3xl font-bold font-mono">{selectedSnapshot.records.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground uppercase">Total Records</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Snapshot Manifest</h4>
                  <pre className="bg-muted/30 p-4 rounded-lg border border-border text-sm font-mono overflow-x-auto">
{`{
  "snapshot-id": ${selectedSnapshot.id},
  "parent-snapshot-id": ${parseInt(selectedSnapshot.id) - 1},
  "operation": "${selectedSnapshot.operation}",
  "manifest-list": "s3://lakehouse/clean/metadata/snap-${selectedSnapshot.id}-manifest-list.avro",
  "summary": {
    "added-data-files": "${selectedSnapshot.operation === 'overwrite' ? '0' : '4'}",
    "added-records": "${selectedSnapshot.operation === 'overwrite' ? '0' : '25000'}",
    "added-files-size": "1534002",
    "changed-partition-count": "1",
    "total-records": "${selectedSnapshot.records}",
    "total-files-size": "145028453",
    "total-data-files": "120"
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {compareMode && selectedSnapshot && compareTarget && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/20 border border-border rounded-lg p-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Before Incident (Target)</span>
                    <select 
                      className="w-full bg-background border border-border rounded p-2 mb-4 font-mono text-sm"
                      value={compareTarget.id}
                      onChange={(e) => setCompareTarget(snapshots.find(s => s.id === e.target.value) || snapshots[1])}
                    >
                      {snapshots.map(s => <option key={s.id} value={s.id}>Snapshot {s.id}</option>)}
                    </select>
                    <div className="flex justify-between items-center text-sm">
                      <span>Records:</span>
                      <span className="font-mono font-bold">{compareTarget.records.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 border border-border rounded-lg p-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">After Incident (Selected)</span>
                    <div className="w-full bg-background border border-border rounded p-2 mb-4 font-mono text-sm flex items-center justify-between opacity-70">
                      <span>Snapshot {selectedSnapshot.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Records:</span>
                      <span className="font-mono font-bold">{selectedSnapshot.records.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden mt-4">
                  <div className="p-3 border-b border-border bg-muted/20">
                    <span className="text-sm font-medium">Schema Delta Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-4">
                      <pre className="text-xs font-mono text-muted-foreground">
{`{
  "type": "record",
  "name": "transaction",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"}
  ]
}`}
                      </pre>
                    </div>
                    <div className="p-4">
                      <pre className="text-xs font-mono text-muted-foreground">
{`{
  "type": "record",
  "name": "transaction",
  "fields": [
    {"name": "id", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "currency", "type": "string"},
`}
<span className="text-status-healthy font-bold bg-status-healthy/10 px-1">+   {"{"}"name": "merchant_id", "type": "string", "default": "null"{"}"}</span>
{`
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
