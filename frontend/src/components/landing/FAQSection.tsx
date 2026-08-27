import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Ice Stream?",
      a: "Ice Stream is a real-time lakehouse observability platform. It monitors streaming data (like Kafka events) for quality issues in real time, quarantines bad data, and protects downstream analytical tables (like Apache Iceberg) from pollution."
    },
    {
      q: "Why not just use batch data-quality checks?",
      a: "Batch checks happen after the data has already landed in your warehouse. By the time a nightly dbt job fails, the bad data may have already broken downstream dashboards or ML models. Ice Stream detects issues before the data lands."
    },
    {
      q: "What does the Circuit Breaker do?",
      a: "If the error rate of a stream exceeds a configured threshold (e.g., 2%), the circuit breaker opens. This automatically pauses ingestion to the lakehouse, routing all events to a quarantine queue until the upstream issue is fixed."
    },
    {
      q: "What happens to invalid data?",
      a: "Invalid events are instantly routed to a Dead Letter Queue (DLQ). They are not deleted. Engineers can inspect the quarantine table to see exactly which rule failed and what the payload looked like."
    },
    {
      q: "How does time travel help incident investigation?",
      a: "Because Ice Stream uses Apache Iceberg, you can query exactly what your tables looked like at a specific snapshot in the past, allowing you to compare the state of your data before and after an incident occurred."
    },
    {
      q: "Is the current demo connected to production infrastructure?",
      a: "No. The current console is an advanced frontend demonstration of the architecture. It simulates a live Flink/Iceberg backend to demonstrate the user experience and interaction patterns of the platform."
    }
  ];

  return (
    <section className="py-24 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <button 
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none hover:bg-slate-100 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-bold text-slate-900 pr-8">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 text-slate-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
