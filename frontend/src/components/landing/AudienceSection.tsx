import { Code2, Network, PieChart, FlaskConical, Stethoscope, Briefcase } from 'lucide-react';

export default function AudienceSection() {
  const audiences = [
    { role: 'Data Engineers', icon: Code2, desc: 'Build and maintain trustworthy pipelines without writing boilerplate validation logic.' },
    { role: 'Platform Engineers', icon: Network, desc: 'Monitor infrastructure and streaming data health from a single unified control plane.' },
    { role: 'Data Analysts', icon: PieChart, desc: 'Work with reliable analytical datasets in Iceberg, free from missing or invalid dimensions.' },
    { role: 'Data Scientists', icon: FlaskConical, desc: 'Reduce the risk of poor-quality training data silently breaking ML model inference.' },
    { role: 'SRE Teams', icon: Stethoscope, desc: 'Observe and respond to pipeline failures before they trigger P1 incidents downstream.' },
    { role: 'Engineering Leaders', icon: Briefcase, desc: 'Understand data reliability, operational risk, and platform health at a glance.' },
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            Who is Ice Stream for?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((aud, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <aud.icon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-bold text-slate-900">{aud.role}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {aud.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
