export default function QuarantineSection() {
  const dlqData = [
    { id: 'evt_10492', rule: 'DQ-004', reason: 'Invalid Range', time: '14:31:48', source: 'checkout-service', v: 'v3' },
    { id: 'evt_10493', rule: 'DQ-002', reason: 'Null Required Field', time: '14:31:49', source: 'payment-gateway', v: 'v3' },
    { id: 'evt_10494', rule: 'DQ-004', reason: 'Invalid Range', time: '14:31:49', source: 'checkout-service', v: 'v3' },
    { id: 'evt_10495', rule: 'DQ-006', reason: 'Schema Mismatch', time: '14:31:51', source: 'user-service', v: 'v2' },
    { id: 'evt_10496', rule: 'DQ-004', reason: 'Invalid Range', time: '14:31:52', source: 'checkout-service', v: 'v3' },
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          
          <div className="md:w-1/3">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
              Bad data is isolated, not deleted.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              When an event fails validation, it doesn't just disappear. It is securely routed to a Dead Letter Queue (DLQ).
            </p>
            <p className="text-slate-600 leading-relaxed">
              This provides a complete audit trail of schema violations, allowing engineers to inspect the exact payload, identify the offending producer, and eventually replay the fixed events.
            </p>
          </div>

          <div className="md:w-2/3 w-full">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-white font-semibold text-sm">Quarantine DLQ</span>
                </div>
                <div className="text-slate-400 text-xs font-mono">live monitoring</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Event ID</th>
                      <th className="px-6 py-3">Rule</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Source</th>
                      <th className="px-6 py-3">Schema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dlqData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.id}</td>
                        <td className="px-6 py-4">
                          <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded text-xs font-bold">{row.rule}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{row.reason}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{row.time}</td>
                        <td className="px-6 py-4 text-slate-600">{row.source}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">{row.v}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
