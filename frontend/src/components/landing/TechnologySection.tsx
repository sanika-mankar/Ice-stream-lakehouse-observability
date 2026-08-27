export default function TechnologySection() {
  const techs = [
    { name: 'Apache Kafka', role: 'Moves streaming events efficiently at scale' },
    { name: 'Apache Flink', role: 'Processes streams and applies rules in real time' },
    { name: 'Apache Iceberg', role: 'Provides the lakehouse table layer and time travel' },
    { name: 'Python', role: 'Powers event generation and quality logic' },
    { name: 'React', role: 'Powers the operational user interface' },
    { name: 'React Flow', role: 'Visualizes pipeline lineage and architectures' },
  ];

  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
            Technology Stack
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techs.map((tech, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col gap-2 hover:bg-slate-100 transition-colors">
              <h3 className="font-bold text-slate-900 text-lg">{tech.name}</h3>
              <p className="text-sm text-slate-600">{tech.role}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
