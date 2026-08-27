import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Platform', href: '#platform' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Architecture', href: '#architecture' },
    { name: 'Reliability', href: '#reliability' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300 border-b",
          scrolled 
            ? "bg-white/80 backdrop-blur-md border-black/5 py-3 shadow-sm" 
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900">
                ICE STREAM
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold leading-none">
                Real-Time Lakehouse Observability
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/console" 
              className="px-5 py-2.5 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
            >
              Open Console 
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <button 
            className="md:hidden text-slate-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-white p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="font-bold text-xl text-slate-900">ICE STREAM</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 text-lg font-medium">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-700 hover:text-blue-600"
                >
                  {link.name}
                </a>
              ))}
            </nav>
            <div className="mt-auto pb-8">
              <Link 
                to="/console" 
                className="w-full py-4 rounded-lg bg-slate-900 text-white text-center font-semibold flex justify-center items-center gap-2"
              >
                Open Console →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
