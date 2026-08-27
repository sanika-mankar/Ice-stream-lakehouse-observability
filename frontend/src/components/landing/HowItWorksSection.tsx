import { motion } from 'framer-motion';
import { Download, Cpu, CheckCircle, SplitSquareVertical, Eye } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "INGEST",
      desc: "Streaming events arrive rapidly from your applications, APIs, or existing databases into Kafka.",
      icon: Download,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      num: "02",
      title: "PROCESS",
      desc: "Apache Flink processes the stream continuously, handling state and windowing with millisecond latency.",
      icon: Cpu,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      num: "03",
      title: "VALIDATE",
      desc: "The Quality Engine inspects every event against your configured rules (e.g., null checks, type matching).",
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      num: "04",
      title: "ROUTE",
      desc: "Good data continues to the Lakehouse. Bad data is instantly diverted to a quarantined Dead Letter Queue.",
      icon: SplitSquareVertical,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      num: "05",
      title: "OBSERVE",
      desc: "Operators monitor pipeline health, active incidents, and quality scores in real time via the console.",
      icon: Eye,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200 relative overflow-hidden" id="how-it-works">
      {/* Decorative dashed line connecting steps */}
      <div className="absolute left-1/2 top-48 bottom-24 w-px border-l-2 border-dashed border-slate-300 hidden lg:block -translate-x-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-blue-600 font-bold tracking-widest text-sm mb-3 block">THE PIPELINE</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            How Ice Stream Works
          </h2>
          <p className="text-slate-600">
            A seamless integration of stream processing and lakehouse architecture to guarantee data quality at the source.
          </p>
        </div>

        <div className="flex flex-col gap-12 lg:gap-0 lg:space-y-16">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
            >
              {/* Spacer for alternating layout */}
              <div className="hidden lg:block lg:w-1/2"></div>
              
              {/* Center Node */}
              <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-100 shadow-md flex items-center justify-center shrink-0 z-10 hidden lg:flex relative">
                <div className={`w-10 h-10 rounded-full ${step.bg} flex items-center justify-center`}>
                  <step.icon className={`w-5 h-5 ${step.color}`} />
                </div>
                {/* Connecting arrow dot */}
                <div className={`absolute w-3 h-3 rounded-full ${step.bg.replace('50', '400')} shadow-sm ${i % 2 === 0 ? '-left-8' : '-right-8'}`}></div>
              </div>

              {/* Content Card */}
              <div className="lg:w-1/2 w-full">
                <div className={`p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${i % 2 === 0 ? 'lg:mr-12' : 'lg:ml-12'}`}>
                  <div className={`absolute top-0 ${i % 2 === 0 ? 'right-0' : 'left-0'} p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                    <step.icon className="w-32 h-32" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-serif font-bold text-slate-200 group-hover:text-slate-300 transition-colors">
                      {step.num}
                    </span>
                    <h3 className={`text-xl font-bold tracking-widest ${step.color}`}>
                      {step.title}
                    </h3>
                  </div>
                  
                  <p className="text-slate-600 leading-relaxed relative z-10">
                    {step.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
