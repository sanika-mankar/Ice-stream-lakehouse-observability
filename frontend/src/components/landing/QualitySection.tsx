import { motion } from 'framer-motion';

export default function QualitySection() {
  const rules = [
    { id: 'DQ-001', name: 'Required Field Missing', desc: 'customer_id is completely absent from the payload', color: 'bg-red-50 text-red-700 border-red-200' },
    { id: 'DQ-002', name: 'Null Required Field', desc: '{"amount": null}', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { id: 'DQ-003', name: 'Invalid Type', desc: '{"age": "twenty"} instead of integer', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'DQ-004', name: 'Invalid Range', desc: '{"quantity": -12}', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 'DQ-005', name: 'Invalid Enum', desc: '{"status": "UNKNOWN_STATE"}', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    { id: 'DQ-006', name: 'Schema Mismatch', desc: 'Payload structure violates Avro/Protobuf contract', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <span className="text-blue-400 font-bold tracking-widest text-sm mb-3 block">DATA QUALITY ENGINE</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
              Detect every anomaly in real time.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              The Quality Engine evaluates streaming events against a rigorous set of configurable rules. From schema evolution issues to basic type mismatches, Ice Stream tags and isolates bad data before it poisons your data warehouse.
            </p>

            <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
              <div className="font-mono text-xs text-slate-300 mb-4">Example Rule Evaluation</div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <code className="text-green-400 font-mono text-sm">{`{"quantity": 5}`}</code>
                  <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded">PASS</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 ring-1 ring-red-500/50">
                  <code className="text-slate-300 font-mono text-sm">{`{"quantity": -12}`}</code>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">DQ-004</span>
                    <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded">INVALID RANGE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rules.map((rule, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold tracking-wider mb-3 ${rule.color}`}>
                  {rule.id}
                </div>
                <h3 className="font-bold text-white mb-1">{rule.name}</h3>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">{rule.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
