import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { QuarantineRecord } from '../../lib/types';
import { Button } from '../ui/Button';

interface ViolationInspectorProps {
  record: QuarantineRecord | null;
  onClose: () => void;
}

export function ViolationInspector({ record, onClose }: ViolationInspectorProps) {
  return (
    <div className={cn(
      "fixed right-0 top-14 bottom-0 w-[600px] bg-card border-l border-border shadow-2xl transition-transform duration-300 z-50 flex flex-col",
      record ? "translate-x-0" : "translate-x-full"
    )}>
      {record && (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-xl font-bold font-mono">Inspector: {record.eventId}</h2>
              <span className="text-xs text-muted-foreground">Source: {record.source}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <section>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Transaction ID</span>
                  <span className="font-mono text-sm">{record.transactionId}</span>
                </div>
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block mb-1">Schema Version</span>
                  <span className="font-mono text-sm">{record.schemaVersion}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold mb-3 text-status-critical uppercase tracking-wider">Violation: {record.ruleId}</h3>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/20">
                  <span className="text-sm">Field Validation Failure: <strong className="font-mono">{record.field}</strong></span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-4">
                    <span className="text-xs text-status-healthy font-semibold uppercase mb-2 block">Expected</span>
                    <pre className="text-sm font-mono bg-muted/30 p-2 rounded border border-border text-status-healthy">{record.expected}</pre>
                  </div>
                  <div className="p-4">
                    <span className="text-xs text-status-critical font-semibold uppercase mb-2 block">Actual (Received)</span>
                    <pre className="text-sm font-mono bg-muted/30 p-2 rounded border border-status-critical/30 text-status-critical">{record.actual}</pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
