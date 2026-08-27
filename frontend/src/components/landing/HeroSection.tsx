import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Database, Eye } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden" id="platform">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-background to-background -z-10" />
      <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { icon: Activity, label: 'REAL-TIME' },
              { icon: ShieldCheck, label: 'DATA QUALITY' },
              { icon: Database, label: 'LAKEHOUSE' },
              { icon: Eye, label: 'OBSERVABILITY' },
            ].map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-white border border-black/5 rounded-full text-xs font-semibold tracking-wider text-slate-600 flex items-center gap-1.5 shadow-sm">
                <tag.icon className="w-3.5 h-3.5 text-blue-600" />
                {tag.label}
              </span>
            ))}
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Keep Bad Data <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
              Out of Your Lakehouse.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
            Ice Stream is a real-time observability platform that detects, isolates, and responds to streaming data-quality problems before they pollute your downstream analytics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/console" 
              className="px-8 py-4 rounded-md bg-slate-900 text-white text-base font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-900/20 flex items-center justify-center gap-2 group"
            >
              Open Console 
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <a 
              href="#how-it-works"
              className="px-8 py-4 rounded-md bg-white text-slate-900 border border-slate-200 text-base font-semibold hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm"
            >
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* Right: Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[500px] w-full flex items-center justify-center"
        >
          {/* Abstract Data Flow Visual */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* The nodes */}
            <div className="relative w-full max-w-md aspect-square">
              
              {/* RAW DATA IN */}
              <div className="absolute top-1/4 -left-8 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 z-20 animate-[float_4s_ease-in-out_infinite]">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Input</div>
                  <div className="text-sm font-semibold text-slate-800">Raw Stream</div>
                </div>
              </div>

              {/* ICE STREAM CORE */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 p-6 rounded-2xl shadow-2xl z-30 ring-8 ring-blue-500/20">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner mb-3 mx-auto">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-lg">Ice Stream</div>
                  <div className="text-blue-200 text-xs font-medium uppercase tracking-wider">Quality Engine</div>
                </div>
              </div>

              {/* TRUSTED DATA OUT */}
              <div className="absolute top-1/4 -right-12 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 z-20 animate-[float_4s_ease-in-out_infinite_1s]">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Output</div>
                  <div className="text-sm font-semibold text-slate-800">Trusted Data</div>
                </div>
              </div>

              {/* QUARANTINE OUT */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 z-20 animate-[float_5s_ease-in-out_infinite_2s]">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <div className="w-5 h-5 text-red-500 font-bold text-center leading-5">!</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Isolated</div>
                  <div className="text-sm font-semibold text-slate-800">Quarantine DLQ</div>
                </div>
              </div>

              {/* Connecting Animated SVG Lines */}
              <svg className="absolute inset-0 w-full h-full -z-10" viewBox="0 0 400 400">
                <path d="M 50,150 C 150,150 150,200 200,200" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                <path d="M 200,200 C 250,200 250,150 350,150" fill="none" stroke="#22c55e" strokeWidth="3" className="opacity-50" />
                <path d="M 200,200 C 200,250 200,300 200,340" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_15s_linear_infinite]" />
                
                {/* Moving Particles */}
                <circle cx="0" cy="0" r="4" fill="#3b82f6">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 50,150 C 150,150 150,200 200,200" />
                </circle>
                <circle cx="0" cy="0" r="4" fill="#22c55e">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 200,200 C 250,200 250,150 350,150" />
                </circle>
                <circle cx="0" cy="0" r="4" fill="#ef4444">
                  <animateMotion dur="2s" repeatCount="indefinite" path="M 200,200 C 200,250 200,300 200,340" />
                </circle>
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
