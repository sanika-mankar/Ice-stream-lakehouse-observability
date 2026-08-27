import { ArrowRight } from 'lucide-react';

export default function TrustedDataSection() {
  return (
    <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* RAW */}
          <div className="flex-1 text-center lg:text-right">
            <h3 className="text-4xl font-serif font-bold text-slate-400 mb-6">RAW</h3>
            <ul className="text-slate-500 space-y-2 font-mono text-sm">
              <li>messy events</li>
              <li>schema issues</li>
              <li>null values</li>
              <li>duplicates</li>
              <li>invalid values</li>
            </ul>
          </div>

          {/* ICE STREAM */}
          <div className="flex-shrink-0 flex items-center justify-center gap-4">
            <ArrowRight className="w-8 h-8 text-slate-700 hidden lg:block" />
            <div className="w-48 h-48 rounded-full bg-blue-600 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.4)] ring-8 ring-blue-900/50 relative z-10">
              <span className="font-bold text-xl tracking-tight mb-2">ICE STREAM</span>
              <div className="text-[10px] uppercase tracking-widest text-blue-200 text-center font-semibold leading-relaxed">
                detect<br/>validate<br/>quarantine<br/>protect
              </div>
            </div>
            <ArrowRight className="w-8 h-8 text-slate-700 hidden lg:block" />
          </div>

          {/* TRUSTED */}
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-4xl font-serif font-bold text-emerald-400 mb-6">TRUSTED</h3>
            <ul className="text-slate-300 space-y-2 font-mono text-sm">
              <li>clean data</li>
              <li>reliable analytics</li>
              <li>traceable incidents</li>
              <li>recoverable pipeline</li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
