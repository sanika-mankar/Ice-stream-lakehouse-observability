import { useState } from 'react';
import { Play, AlertOctagon, RefreshCw, XCircle, ChevronDown, CheckCircle2, Radio, RotateCcw, Loader2 } from 'lucide-react';
import { useStore } from '../../lib/store/useStore';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function DemoController() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    injectDemoScenario, 
    circuitBreakerStatus, 
    metrics, 
    isSimulationRunning, 
    toggleSimulation,
    resetSimulation
  } = useStore();
  const [activeScenario, setActiveScenario] = useState<string>('healthy');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const triggerScenario = async (scenario: 'healthy' | 'degradation' | 'incident' | 'recovery') => {
    setActiveScenario(scenario);
    setIsLoading(true);
    setFeedbackMsg(`Running ${scenario}...`);
    try {
      await injectDemoScenario(scenario);
      setFeedbackMsg(
        scenario === 'healthy' ? '50 healthy events processed'
        : scenario === 'degradation' ? 'Sub-threshold bad data injected'
        : scenario === 'incident' ? 'Breach injected: Circuit Breaker OPEN'
        : 'Recovery complete: Circuit CLOSED'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setFeedbackMsg('Resetting pipeline...');
    try {
      await resetSimulation();
      setActiveScenario('healthy');
      setFeedbackMsg('System reset to clean state');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center my-6 relative z-50">
      <div 
        className={cn(
          "bg-card border border-border shadow-2xl overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
          isOpen ? "fixed bottom-6 left-6 w-[360px] rounded-2xl opacity-100 translate-y-0" : "relative w-14 h-14 opacity-85 hover:opacity-100 rounded-full cursor-pointer"
        )}
      >
        {!isOpen ? (
          <div 
            className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-purple-600 to-fuchsia-500 text-white rounded-full hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-500/20"
            onClick={() => setIsOpen(true)}
            title="Open Demo & Simulation Controls"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full animate-pulse",
                  circuitBreakerStatus === 'OPEN' ? 'bg-status-critical' : circuitBreakerStatus === 'HALF_OPEN' ? 'bg-status-warning' : 'bg-status-healthy'
                )} />
                <span className="text-xs font-bold uppercase tracking-wider">Demo & Simulation Hub</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {feedbackMsg && (
                <div className="text-[11px] p-2 rounded bg-muted/50 border border-border text-foreground font-mono flex items-center gap-2 animate-in fade-in">
                  {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />}
                  <span className="truncate">{feedbackMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                  1-Click Test Scenarios
                </div>

                <Button 
                  variant={activeScenario === 'healthy' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-9"
                  disabled={isLoading}
                  onClick={() => triggerScenario('healthy')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-400" />
                  1. Healthy Pipeline (0% Errors)
                </Button>
                
                <Button 
                  variant={activeScenario === 'degradation' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-9 border-status-warning/50 hover:bg-status-warning/10 hover:text-status-warning"
                  disabled={isLoading}
                  onClick={() => triggerScenario('degradation')}
                >
                  <AlertOctagon className="w-3.5 h-3.5 mr-2 text-amber-400" />
                  2. Inject Bad Data (1.5% Sub-Threshold)
                </Button>
                
                <Button 
                  variant={activeScenario === 'incident' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-9 border-status-critical/50 hover:bg-status-critical/10 hover:text-status-critical"
                  disabled={isLoading}
                  onClick={() => triggerScenario('incident')}
                >
                  <XCircle className="w-3.5 h-3.5 mr-2 text-red-400" />
                  3. Trip Circuit Breaker (&gt;2% Breach)
                </Button>
                
                <Button 
                  variant={activeScenario === 'recovery' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-9 border-blue-500/50 hover:bg-blue-500/10 text-blue-400"
                  disabled={isLoading}
                  onClick={() => triggerScenario('recovery')}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  4. Automated Probe Recovery
                </Button>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Streaming & State Controls
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={isSimulationRunning ? "outline" : "secondary"}
                    size="sm" 
                    className="text-xs h-8 flex items-center justify-center gap-1.5"
                    disabled={isLoading}
                    onClick={toggleSimulation}
                  >
                    <Radio className={cn("w-3 h-3", isSimulationRunning && "text-green-400 animate-pulse")} />
                    {isSimulationRunning ? "Stop Stream" : "Live Stream"}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8 flex items-center justify-center gap-1.5 hover:bg-red-500/10 hover:text-red-400 border-border"
                    disabled={isLoading}
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-border grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-muted/40 p-2 rounded flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase font-semibold">CB State</span>
                  <span className={cn(
                    "font-bold font-mono text-xs mt-0.5",
                    circuitBreakerStatus === 'CLOSED' ? 'text-status-healthy' : circuitBreakerStatus === 'HALF_OPEN' ? 'text-status-warning' : 'text-status-critical'
                  )}>
                    {circuitBreakerStatus}
                  </span>
                </div>
                <div className="bg-muted/40 p-2 rounded flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase font-semibold">Error Rate</span>
                  <span className="font-mono text-xs font-bold mt-0.5">
                    {metrics.errorRate.toFixed(1)}%
                  </span>
                </div>
                <div className="bg-muted/40 p-2 rounded flex flex-col">
                  <span className="text-muted-foreground text-[9px] uppercase font-semibold">Processed</span>
                  <span className="font-mono text-xs font-bold mt-0.5 text-blue-400">
                    {metrics.eventsProcessed.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {!isOpen && (
        <span className="mt-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center pointer-events-none select-none">
          Demo<br/>Simulator
        </span>
      )}
    </div>
  );
}
