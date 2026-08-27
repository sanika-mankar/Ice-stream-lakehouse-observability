import { Activity, Zap, ServerCrash, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ObservabilitySection() {
  const metrics = [
    { title: 'Events / sec', value: '14,230', trend: 'stable', color: 'text-blue-500', bg: 'bg-blue-500' },
    { title: 'Quality Score', value: '98.4%', trend: 'up', color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { title: 'Error Rate', value: '0.2%', trend: 'stable', color: 'text-slate-500', bg: 'bg-slate-400' },
    { title: 'DLQ Volume', value: '124', trend: 'down', color: 'text-orange-500', bg: 'bg-orange-400' },
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-blue-600 font-bold tracking-widest text-sm mb-3 block">OBSERVABILITY</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
              Complete visibility into your data streams.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Monitor processing latency, error rates, and pipeline lineage in real time. Ice Stream exposes rich metrics so operators can respond to incidents the moment they occur.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Activity className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-slate-700 font-medium">Real-time throughput metrics</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <ServerCrash className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-slate-700 font-medium">Active incident alerts</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-slate-700 font-medium">Processing latency tracking</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className={`absolute left-0 top-0 w-1 h-full ${metric.bg}`}></div>
                <div className="text-sm font-medium text-slate-500 mb-3">{metric.title}</div>
                <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded font-medium">
                    DEMO DATA
                  </span>
                  {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                </div>
              </motion.div>
            ))}
            
            {/* Visual Chart Placeholder */}
            <div className="col-span-2 mt-2 h-40 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
              <div className="text-xs font-bold text-slate-400 uppercase mb-4">Throughput Trend</div>
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M 0,30 L 0,20 Q 20,25 30,10 T 60,15 T 80,5 L 100,2 L 100,30 Z" fill="url(#blue-gradient)" className="opacity-50" />
                <path d="M 0,20 Q 20,25 30,10 T 60,15 T 80,5 L 100,2" fill="none" stroke="#3b82f6" strokeWidth="2" />
                <defs>
                  <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
