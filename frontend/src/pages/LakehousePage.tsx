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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Storage Optimization & Compaction */}
        <Card className="glass bg-white/40 backdrop-blur-md border-black/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
              Storage Optimization & Compaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-black/5 rounded-lg bg-white/60">
                  <div className="text-xs text-slate-500 mb-1">Small Files Count</div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">14,203</div>
                  <div className="text-[10px] text-amber-400/70 mt-1">Needs compaction</div>
                </div>
                <div className="p-4 border border-black/5 rounded-lg bg-white/60">
                  <div className="text-xs text-slate-500 mb-1">Avg File Size</div>
                  <div className="text-2xl font-bold text-green-400 font-mono">18.4 MB</div>
                  <div className="text-[10px] text-green-400/70 mt-1">Target: 256 MB</div>
                </div>
              </div>
              <div className="bg-white/60 border border-black/5 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Z-Order Clustering Recommendation</h4>
                <p className="text-xs text-slate-500 mb-3">Based on query patterns, sorting by `merchant_id` and `timestamp` will improve read performance by estimated 45%.</p>
                <button className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded hover:bg-purple-500/30 transition-colors">
                  Trigger Async OPTIMIZE
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Lineage & Cost Analysis */}
        <div className="space-y-6">
          <Card className="glass bg-white/40 backdrop-blur-md border-black/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Upstream Lineage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-2 bg-white/60 border border-black/5 rounded">
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">Kafka</Badge>
                  <span className="text-sm font-mono text-slate-600">events_raw_topic</span>
                </div>
                <div className="w-px h-4 bg-border ml-6"></div>
                <div className="flex items-center gap-3 p-2 bg-white/60 border border-black/5 rounded">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">Flink</Badge>
                  <span className="text-sm font-mono text-slate-600">sessionization_job_v2</span>
                </div>
                <div className="w-px h-4 bg-border ml-6"></div>
                <div className="flex items-center gap-3 p-2 border-l-2 border-primary bg-primary/5 rounded">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-slate-800">Clean Transactions Table</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass bg-white/40 backdrop-blur-md border-black/10">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-slate-600">Monthly Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-800">$1,420.50</span>
                <span className="text-xs text-red-400">+12% vs last month</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>S3 Storage (Standard)</span>
                  <span className="font-mono text-slate-800">$450.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>S3 API (PUT/GET)</span>
                  <span className="font-mono text-slate-800">$120.50</span>
                </div>
                <div className="flex justify-between text-slate-500 border-b border-black/10 pb-2">
                  <span>Compute (Compaction/Vacuum)</span>
                  <span className="font-mono text-slate-800">$850.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
