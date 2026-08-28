import { useState } from 'react';
import { QualityOverview } from '../components/quality/QualityOverview';
import { QualityRules } from '../components/quality/QualityRules';
import { QualityViolations } from '../components/quality/QualityViolations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { ShieldCheck, AlertOctagon, Scale } from 'lucide-react';
import { useStore } from '../lib/store/useStore';

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { quality } = useStore();

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-500 pb-20 font-georgia">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Data Quality Center</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitor real-time payload schemas and inspect rule violations.</p>
        </div>
        
        {/* Global SLA Summary */}
        <div className="flex gap-4 p-3 bg-white/40 backdrop-blur-md border border-black/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex items-center gap-3 px-3">
            <div className="p-2 bg-green-500/20 rounded-lg"><ShieldCheck className="w-5 h-5 text-green-400" /></div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Global Score</div>
              <div className="text-xl font-mono font-bold text-green-400">{quality.qualityScore.toFixed(2)}%</div>
            </div>
          </div>
          <div className="w-px bg-black/ my-1"></div>
          <div className="flex items-center gap-3 px-3">
            <div className="p-2 bg-red-500/20 rounded-lg"><AlertOctagon className="w-5 h-5 text-red-400" /></div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Quarantined</div>
              <div className="text-xl font-mono font-bold text-red-400">{quality.invalidEvents.toLocaleString()}</div>
            </div>
          </div>
          <div className="w-px bg-black/ my-1"></div>
          <div className="flex items-center gap-3 px-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Scale className="w-5 h-5 text-blue-400" /></div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Rules</div>
              <div className="text-xl font-mono font-bold text-blue-400">142</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white/40 backdrop-blur-md border border-black/10 rounded-lg p-1 w-fit mb-6 shadow-lg">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-black/ data-[state=active]:text-slate-800 text-slate-500">Overview</TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:bg-black/ data-[state=active]:text-slate-800 text-slate-500">Quality Rules</TabsTrigger>
            <TabsTrigger value="violations" className="data-[state=active]:bg-black/ data-[state=active]:text-slate-800 text-slate-500">Violations (DLQ)</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="m-0 border-none p-0 outline-none">
          <QualityOverview />
        </TabsContent>
        <TabsContent value="rules" className="m-0 border-none p-0 outline-none">
          <QualityRules />
        </TabsContent>
        <TabsContent value="violations" className="m-0 border-none p-0 outline-none">
          <QualityViolations />
        </TabsContent>
      </Tabs>
    </div>
  );
}
