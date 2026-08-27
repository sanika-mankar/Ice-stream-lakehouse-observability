import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">ICE STREAM</span>
            </div>
            <p className="text-slate-500 text-sm mb-6 max-w-sm leading-relaxed">
              Real-Time Lakehouse Observability. <br/>
              Built as an advanced real-time data architecture project to demonstrate stream processing, data quality, and lakehouse integration.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#architecture" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Architecture</a></li>
              <li><a href="#reliability" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Reliability</a></li>
              <li><a href="#use-cases" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Use Cases</a></li>
              <li><a href="#faq" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Console</h4>
            <ul className="space-y-3">
              <li><Link to="/console/overview" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Dashboard</Link></li>
              <li><Link to="/console/pipeline" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Pipeline Lineage</Link></li>
              <li><Link to="/console/quality" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Data Quality</Link></li>
              <li><Link to="/console/lakehouse" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">Time Travel</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Ice Stream Project.
          </p>
        </div>
      </div>
    </footer>
  );
}
