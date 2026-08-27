import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CircuitBreakerSection() {
  const [state, setState] = useState<'CLOSED' | 'OPEN' | 'HALF-OPEN'>('CLOSED');

  // Cycle states for demonstration
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        if (prev === 'CLOSED') return 'OPEN';
        if (prev === 'OPEN') return 'HALF-OPEN';
        return 'CLOSED';
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-white" id="reliability">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Interactive State Machine */}
          <div className="order-2 lg:order-1 p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
            
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Pulsing background rings */}
              <div className={`absolute inset-0 rounded-full transition-colors duration-1000 ${
                state === 'CLOSED' ? 'bg-green-100' : state === 'OPEN' ? 'bg-red-100' : 'bg-yellow-100'
              } animate-ping opacity-20`}></div>
              
              <div className={`absolute inset-4 rounded-full transition-colors duration-1000 ${
                state === 'CLOSED' ? 'bg-green-100' : state === 'OPEN' ? 'bg-red-100' : 'bg-yellow-100'
              }`}></div>

              {/* Main Node */}
              <motion.div 
                layout
                className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-colors duration-500 ${
                  state === 'CLOSED' ? 'bg-green-600' : state === 'OPEN' ? 'bg-red-600' : 'bg-yellow-500'
                }`}
              >
                {state === 'CLOSED' && <ShieldCheck className="w-10 h-10 mb-1" />}
                {state === 'OPEN' && <ShieldAlert className="w-10 h-10 mb-1" />}
                {state === 'HALF-OPEN' && <Shield className="w-10 h-10 mb-1" />}
                <span className="font-bold tracking-widest text-sm">{state}</span>
              </motion.div>
            </div>

            <div className="mt-8 text-center h-16">
              {state === 'CLOSED' && <p className="text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-full border border-green-200">Error rate is low. Pipeline is healthy.</p>}
              {state === 'OPEN' && <p className="text-sm font-medium text-red-700 bg-red-50 px-4 py-2 rounded-full border border-red-200">Error rate {'>'} 2%. Downstream protected.</p>}
              {state === 'HALF-OPEN' && <p className="text-sm font-medium text-yellow-700 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-200">Testing recovery with limited events...</p>}
            </div>

          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <span className="text-orange-600 font-bold tracking-widest text-sm mb-3 block">SELF-PROTECTING</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6 leading-tight">
              Circuit Breakers for <br/>Data Engineering.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              If data quality suddenly deteriorates—for example, due to an upstream schema change dropping a required field—Ice Stream acts immediately. 
            </p>
            <p className="text-slate-600 leading-relaxed mb-8">
              Instead of allowing the problem to spread to downstream consumers, Ice Stream opens the circuit breaker, stopping the flow of tainted data and isolating the incident.
            </p>
            
            <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <span className="font-serif font-bold text-orange-700">2%</span>
              </div>
              <div>
                <div className="font-bold text-slate-900">Configured Threshold</div>
                <div className="text-sm text-slate-600">Circuit opens when error rate exceeds 2% in a rolling window.</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
