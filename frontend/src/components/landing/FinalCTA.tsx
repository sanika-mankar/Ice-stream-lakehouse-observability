import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-32 bg-slate-900 text-white text-center relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-6 md:px-8 relative z-10">
        <h2 className="text-4xl md:text-6xl font-serif font-bold mb-8">
          See Your Data Pipeline <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Differently.</span>
        </h2>
        
        <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
          Explore how Ice Stream detects data-quality problems, protects downstream systems, and makes streaming data reliability visible.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/console" 
            className="px-8 py-4 rounded-md bg-white text-slate-900 text-lg font-bold hover:bg-blue-50 hover:text-blue-700 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group"
          >
            Open Console 
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <a 
            href="#architecture"
            className="px-8 py-4 rounded-md bg-transparent text-white border border-slate-700 hover:bg-slate-800 text-lg font-semibold transition-all flex items-center justify-center"
          >
            Explore Architecture
          </a>
        </div>
      </div>
    </section>
  );
}
