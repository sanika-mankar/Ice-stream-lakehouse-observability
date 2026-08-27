import { motion } from 'framer-motion';
import { Database, Clock, Layers } from 'lucide-react';

export default function LakehouseSection() {
  return (
    <section className="py-24 bg-white" id="lakehouse">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-emerald-600 font-bold tracking-widest text-sm mb-3 block">LAKEHOUSE ARCHITECTURE</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            Apache Iceberg Storage
          </h2>
          <p className="text-lg text-slate-600">
            Instead of treating your data lake as a messy pile of files, Ice Stream uses Apache Iceberg to provide a reliable table layer with ACID transactions and snapshot isolation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Reliable Tables</h3>
            <p className="text-slate-600 leading-relaxed">
              Safe concurrent writes from Flink and reads from your BI tools. No more partial data reads or file locking issues.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Schema Evolution</h3>
            <p className="text-slate-600 leading-relaxed">
              Safely add, drop, or rename columns without rewriting massive datasets. Iceberg tracks schema changes natively.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Time Travel</h3>
            <p className="text-slate-600 leading-relaxed">
              Query exactly what the data looked like at any point in the past. Perfect for reproducing ML models or investigating incidents.
            </p>
          </div>
        </div>

        {/* Time Travel Visual */}
        <div className="p-8 md:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="text-2xl font-serif font-bold mb-8 relative z-10 text-center">Time Travel Investigation</h3>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-700 -translate-y-1/2"></div>
            
            <div className="relative z-10 flex justify-between items-center text-center">
              
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-mono text-xs mb-4">10:30</span>
                <div className="w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900"></div>
                <span className="mt-4 text-sm font-semibold text-white">Snapshot 101</span>
                <span className="text-xs text-slate-400 mt-1">Healthy</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-mono text-xs mb-4">10:35</span>
                <div className="w-6 h-6 rounded-full bg-slate-500 ring-4 ring-slate-900"></div>
                <span className="mt-4 text-sm font-semibold text-white">Snapshot 102</span>
                <span className="text-xs text-slate-400 mt-1">Schema Change</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-mono text-xs mb-4">10:37</span>
                <div className="w-8 h-8 rounded-full bg-red-500 ring-4 ring-slate-900 flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="mt-4 text-sm font-semibold text-white">Snapshot 103</span>
                <span className="text-xs text-red-400 mt-1 font-bold">Incident Detected</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-mono text-xs mb-4">10:42</span>
                <div className="w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900"></div>
                <span className="mt-4 text-sm font-semibold text-white">Snapshot 104</span>
                <span className="text-xs text-slate-400 mt-1">Recovery</span>
              </div>

            </div>
          </div>
          
          <div className="mt-12 text-center text-slate-400 text-sm max-w-2xl mx-auto relative z-10">
            *This conceptual timeline demonstrates how Iceberg's snapshot isolation allows you to query the state of your tables from before a bad deployment polluted the stream.
          </div>
        </div>

      </div>
    </section>
  );
}
