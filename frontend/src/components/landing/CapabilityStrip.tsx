export default function CapabilityStrip() {
  const capabilities = [
    { title: "REAL-TIME", desc: "Streaming quality detection" },
    { title: "SELF-PROTECTING", desc: "Circuit-breaker based protection" },
    { title: "LAKEHOUSE", desc: "Apache Iceberg storage" },
    { title: "TRACEABLE", desc: "Lineage + incidents + snapshots" },
    { title: "LIVE", desc: "Operational observability" }
  ];

  return (
    <div className="w-full border-y border-black/5 bg-white/50 backdrop-blur-sm overflow-hidden py-6">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-wrap md:flex-nowrap justify-between gap-6 md:gap-12">
          {capabilities.map((cap, i) => (
            <div key={i} className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <span className="text-xs font-bold tracking-widest text-slate-800 uppercase">
                {cap.title}
              </span>
              <span className="text-sm text-slate-500">
                {cap.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
