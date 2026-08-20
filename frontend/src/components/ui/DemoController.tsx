import { useState } from 'react';
import { Play, AlertOctagon, RefreshCw, XCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../lib/store/useStore';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function DemoController() {
  const [isOpen, setIsOpen] = useState(false);
  const { injectDemoScenario, circuitBreakerStatus, metrics } = useStore();
  const [activeScenario, setActiveScenario] = useState<string>('healthy');

  const triggerScenario = (scenario: 'healthy' | 'degradation' | 'incident' | 'recovery') => {
    setActiveScenario(scenario);
    injectDemoScenario(scenario);
  };

  return (
    <div className="flex flex-col items-center my-6 relative z-50">
      <div 
        className={cn(
          "bg-card border border-border shadow-2xl overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
          isOpen ? "fixed bottom-6 left-6 w-[340px] rounded-2xl opacity-100 translate-y-0" : "relative w-14 h-14 opacity-80 hover:opacity-100 rounded-full cursor-pointer"
        )}
      >
        {!isOpen ? (
          <div 
            className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={() => setIsOpen(true)}
            title="Open Demo Controls"
          >
            <Play className="w-6 h-6 fill-current ml-1" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Demo Mode Active</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Button 
                  variant={activeScenario === 'healthy' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-8"
                  onClick={() => triggerScenario('healthy')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                  1. Healthy Pipeline
                </Button>
                
                <Button 
                  variant={activeScenario === 'degradation' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-8 border-status-warning/50 hover:bg-status-warning/10 hover:text-status-warning"
                  onClick={() => triggerScenario('degradation')}
                >
                  <AlertOctagon className="w-3.5 h-3.5 mr-2" />
                  2. Inject Bad Data (Degradation)
                </Button>
                
                <Button 
                  variant={activeScenario === 'incident' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-8 border-status-critical/50 hover:bg-status-critical/10 hover:text-status-critical"
                  onClick={() => triggerScenario('incident')}
                >
                  <XCircle className="w-3.5 h-3.5 mr-2" />
                  3. Trigger Circuit Breaker Incident
                </Button>
                
                <Button 
                  variant={activeScenario === 'recovery' ? 'primary' : 'outline'} 
                  className="w-full justify-start text-xs h-8"
                  onClick={() => triggerScenario('recovery')}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  4. Automated Recovery
                </Button>
              </div>

              <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-muted/30 p-2 rounded flex justify-between">
                  <span className="text-muted-foreground">CB State</span>
                  <span className={circuitBreakerStatus === 'CLOSED' ? 'text-status-healthy' : 'text-status-critical'}>
                    {circuitBreakerStatus}
                  </span>
                </div>
                <div className="bg-muted/30 p-2 rounded flex justify-between">
                  <span className="text-muted-foreground">Error Rate</span>
                  <span className="font-mono">{metrics.errorRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {!isOpen && (
        <span className="mt-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center">
          Simulation<br/>Engine
        </span>
      )}
    </div>
  );
}
