import { Link } from 'react-router-dom';

export default function IncidentStorySection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        
        <div className="mb-16">
          <span className="text-red-600 font-bold tracking-widest text-sm mb-3 block">MINI CASE STUDY</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            14:31 — Something changed.
          </h2>
          <p className="text-lg text-slate-600">
            A bad deployment upstream just removed the "tax_amount" field from the checkout event payload. Here's exactly how Ice Stream responds.
          </p>
        </div>

        <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-12 mb-16">
          
          <div className="relative">
            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-slate-200 border-4 border-white"></div>
            <div className="font-mono text-sm text-slate-500 mb-1">14:31:42</div>
            <h3 className="text-lg font-bold text-slate-900">Quality degradation detected</h3>
            <p className="text-slate-600 mt-2">The Quality Engine flags hundreds of events missing required fields. The error rate metric spikes on the observability dashboard.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-orange-400 border-4 border-white"></div>
            <div className="font-mono text-sm text-slate-500 mb-1">14:31:48</div>
            <h3 className="text-lg font-bold text-slate-900">Threshold exceeded</h3>
            <p className="text-slate-600 mt-2">The rolling 60-second error rate crosses the 2% safety threshold.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-red-500 border-4 border-white animate-pulse"></div>
            <div className="font-mono text-sm text-slate-500 mb-1">14:31:49</div>
            <h3 className="text-lg font-bold text-slate-900">Circuit breaker opened</h3>
            <p className="text-slate-600 mt-2">Ice Stream automatically halts the flow of data into the Iceberg lakehouse tables to protect downstream BI dashboards.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-slate-800 border-4 border-white"></div>
            <div className="font-mono text-sm text-slate-500 mb-1">14:32:03</div>
            <h3 className="text-lg font-bold text-slate-900">Bad records routed to quarantine</h3>
            <p className="text-slate-600 mt-2">Engineers inspect the DLQ and immediately identify the missing "tax_amount" field. A hotfix is pushed to the upstream service.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white"></div>
            <div className="font-mono text-sm text-slate-500 mb-1">14:35:28</div>
            <h3 className="text-lg font-bold text-slate-900">Pipeline healthy again</h3>
            <p className="text-slate-600 mt-2">The circuit breaker closes. Clean data resumes flowing into Iceberg.</p>
          </div>

        </div>

        <Link 
          to="/console/reliability" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Inspect the Incident Console →
        </Link>

      </div>
    </section>
  );
}
