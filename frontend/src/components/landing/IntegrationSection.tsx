import { ArrowRight } from 'lucide-react';

export default function IntegrationSection() {
  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
            How Companies Integrate It
          </h2>
          <p className="text-slate-400 text-lg">
            Ice Stream sits as an observability and quality layer entirely around the streaming data path.
          </p>
        </div>

        <div className="bg-slate-800 p-8 md:p-12 rounded-3xl border border-slate-700 shadow-2xl overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between">
            
            {/* Existing Systems */}
            <div className="w-48">
              <h3 className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-4 text-center">Existing Systems</h3>
              <div className="flex flex-col gap-3">
                <div className="bg-slate-700 py-3 px-4 rounded-lg text-sm text-center font-medium border border-slate-600">Applications</div>
                <div className="bg-slate-700 py-3 px-4 rounded-lg text-sm text-center font-medium border border-slate-600">Databases</div>
                <div className="bg-slate-700 py-3 px-4 rounded-lg text-sm text-center font-medium border border-slate-600">APIs</div>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-slate-500 mx-4" />

            {/* Ice Stream Core */}
            <div className="w-80 bg-blue-900/20 border-2 border-blue-500/30 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ICE STREAM
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-blue-600 text-white py-3 px-4 rounded-lg text-sm text-center font-bold shadow-lg">Kafka Topics</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-indigo-600 text-white py-3 px-2 rounded-lg text-xs text-center font-bold shadow-lg">Flink</div>
                  <div className="bg-emerald-600 text-white py-3 px-2 rounded-lg text-xs text-center font-bold shadow-lg">Quality Rules</div>
                </div>
                <div className="bg-slate-900 text-slate-300 py-2 px-4 rounded-lg text-xs text-center border border-slate-700 border-dashed">
                  Circuit Breaker & Quarantine
                </div>
              </div>
            </div>

            <ArrowRight className="w-8 h-8 text-slate-500 mx-4" />

            {/* Downstream */}
            <div className="w-48">
              <h3 className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-4 text-center">Downstream</h3>
              <div className="flex flex-col gap-3">
                <div className="bg-slate-700 py-3 px-4 rounded-lg text-sm text-center font-medium border border-slate-600">Iceberg Analytics</div>
                <div className="bg-slate-700 py-3 px-4 rounded-lg text-sm text-center font-medium border border-slate-600">ML Models</div>
                <div className="bg-slate-700 py-3 px-4 rounded-lg text-sm text-center font-medium border border-slate-600">BI Dashboards</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
