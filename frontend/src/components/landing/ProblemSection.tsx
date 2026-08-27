import { motion } from 'framer-motion';
import { AlertTriangle, AlertOctagon, TrendingDown, Clock, Search } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="py-24 md:py-32 bg-white relative" id="problem">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="max-w-3xl mb-20">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6 leading-tight">
            Bad Data Doesn't Wait for <br /> Your Dashboard.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Data flows into your systems continuously. Traditional batch-oriented workflows detect issues too late. By the time a broken schema or invalid enum reaches your analytics tables, the damage is already done.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* The Problem Visual */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="p-8 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-6 relative"
          >
            <div className="absolute top-0 right-12 -translate-y-1/2 px-4 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
              TRADITIONAL PIPELINE
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">1. Bad Event Arrives</div>
                <div className="text-xs text-slate-500">Missing values, schema mismatch, invalid enum</div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-200 ml-9 -my-4"></div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">2. Dashboard Breaks</div>
                <div className="text-xs text-slate-500">Analytics become unreliable downstream</div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-200 ml-9 -my-4"></div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">3. Engineers Investigate</div>
                <div className="text-xs text-slate-500">Hours spent hunting for the source of the issue</div>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-200 ml-9 -my-4"></div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">4. Business Impact</div>
                <div className="text-xs text-slate-500">Trust in data is lost, decisions delayed</div>
              </div>
            </div>
          </motion.div>

          {/* The Solution Copy */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-slate-900">
              Detect it before it lands.
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Ice Stream moves detection closer to the stream. By inspecting events in real time using Apache Flink and a dedicated Quality Engine, bad data is quarantined instantly.
            </p>
            <ul className="space-y-4">
              {[
                "Detect invalid events in milliseconds",
                "Classify errors using standard quality rules",
                "Quarantine bad data into an isolated DLQ",
                "Protect downstream tables with automated circuit breakers",
                "Recover safely with full observability"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
