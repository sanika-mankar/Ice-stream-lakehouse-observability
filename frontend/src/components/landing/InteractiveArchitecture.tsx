import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Network, Cpu, ShieldCheck, Box, ServerCrash } from 'lucide-react';

export default function InteractiveArchitecture() {
  const [activeNode, setActiveNode] = useState<string | null>('flink');

  const nodes = [
    { id: 'source', label: 'Data Sources', icon: Database, desc: 'E-commerce events, clicks, logs', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
    { id: 'kafka', label: 'Apache Kafka', icon: Network, desc: 'High-throughput event streaming', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'flink', label: 'Apache Flink', icon: Cpu, desc: 'Stateful stream processing', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'engine', label: 'Quality Engine', icon: ShieldCheck, desc: 'Real-time data-quality validation', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'iceberg', label: 'Apache Iceberg', icon: Box, desc: 'Open lakehouse table format', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'dlq', label: 'Quarantine / DLQ', icon: ServerCrash, desc: 'Isolation for invalid events', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  ];

  return (
    <section className="py-24 bg-white" id="architecture">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            The Architecture
          </h2>
          <p className="text-slate-600">
            Ice Stream sits directly in your streaming data path, protecting your lakehouse from bad data before it lands.
          </p>
        </div>

        <div className="p-8 md:p-12 rounded-3xl bg-slate-50 border border-slate-200 shadow-inner overflow-x-auto">
          <div className="min-w-[800px] relative flex flex-col items-center">
            
            {/* The Main Pipeline Pipeline */}
            <div className="flex items-center justify-between w-full relative z-10">
              
              {/* Connecting Lines */}
              <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -translate-y-1/2 -z-10">
                <div className="h-full bg-blue-500/20 w-full animate-[pulse_2s_ease-in-out_infinite]"></div>
              </div>

              {/* Source -> Kafka -> Flink -> Engine -> Iceberg */}
              {['source', 'kafka', 'flink', 'engine', 'iceberg'].map((nodeId) => {
                const node = nodes.find(n => n.id === nodeId)!;
                const isActive = activeNode === nodeId;
                
                return (
                  <div 
                    key={nodeId}
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setActiveNode(nodeId)}
                  >
                    <div className={`w-32 p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all duration-300 bg-white shadow-sm hover:shadow-md ${isActive ? `${node.border} ring-4 ring-slate-100 scale-110` : 'border-slate-200 scale-100'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${node.bg}`}>
                        <node.icon className={`w-6 h-6 ${node.color}`} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                        {node.label}
                      </span>
                    </div>

                    {/* Tooltip */}
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl text-center z-50 pointer-events-none"
                      >
                        {node.desc}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* DLQ Branching Line */}
            <div className="absolute top-1/2 left-[60%] w-0.5 h-32 bg-slate-200 -z-10">
              <div className="w-full h-full bg-red-500/20 animate-[pulse_3s_ease-in-out_infinite]"></div>
            </div>

            {/* Quarantine DLQ Node */}
            <div className="mt-24 ml-[20%]">
              {(() => {
                const dlq = nodes.find(n => n.id === 'dlq')!;
                const isActive = activeNode === 'dlq';
                return (
                  <div 
                    className="relative group cursor-pointer"
                    onMouseEnter={() => setActiveNode('dlq')}
                  >
                    <div className={`w-32 p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all duration-300 bg-white shadow-sm hover:shadow-md ${isActive ? `${dlq.border} ring-4 ring-red-50 scale-110` : 'border-slate-200 scale-100'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${dlq.bg}`}>
                        <dlq.icon className={`w-6 h-6 ${dlq.color}`} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                        {dlq.label}
                      </span>
                    </div>

                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 p-3 bg-red-900 text-white text-xs rounded-lg shadow-xl text-center z-50 pointer-events-none"
                      >
                        {dlq.desc}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-900 rotate-45"></div>
                      </motion.div>
                    )}
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
