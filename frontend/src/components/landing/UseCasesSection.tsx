import { ShoppingCart, LineChart, Truck, Database } from 'lucide-react';

export default function UseCasesSection() {
  const useCases = [
    {
      icon: ShoppingCart,
      title: 'E-Commerce',
      desc: 'Protect checkout and inventory streams. Ensure invalid "tax_amount" nulls trigger a circuit breaker rather than destroying downstream financial reporting.',
    },
    {
      icon: LineChart,
      title: 'Fintech',
      desc: 'Monitor transaction event quality. Prevent unknown schema versions from breaking anti-fraud ML model inference in real time.',
    },
    {
      icon: Truck,
      title: 'Logistics',
      desc: 'Validate streaming IoT and operational data. Quarantine invalid GPS coordinates before they pollute routing analytics.',
    },
    {
      icon: Database,
      title: 'Analytics Platforms',
      desc: 'Provide data analysts with a trustworthy Lakehouse layer by guaranteeing that all ingested data conforms to strict quality contracts.',
    }
  ];

  return (
    <section className="py-24 bg-white" id="use-cases">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            Conceptual Use Cases
          </h2>
          <p className="text-lg text-slate-600">
            Ice Stream is designed to protect data platforms across any industry that relies on continuous, high-volume streaming data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((uc, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 flex gap-6 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                <uc.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{uc.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{uc.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
