import { Button } from '../ui/Button';
import { useStore } from '../../lib/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function SimulationPanel() {
  const { 
    injectWarning, 
    injectSchemaFailure, 
    openCircuitBreaker, 
    triggerRecovery,
    isSimulationRunning, 
    toggleSimulation,
    resetSimulation
  } = useStore();

  return (
    <Card className="w-full glass shadow-2xl">
      <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span>DEMO SIMULATION</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulationRunning ? 'bg-status-healthy' : 'bg-muted-foreground'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulationRunning ? 'bg-status-healthy' : 'bg-muted-foreground'}`}></span>
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-2">
        <Button 
          variant={isSimulationRunning ? "outline" : "primary"} 
          size="sm" 
          className="w-full justify-start"
          onClick={toggleSimulation}
        >
          {isSimulationRunning ? "Pause Simulation" : "Start Simulation"}
        </Button>
        <div className="h-px bg-border my-1" />
        <Button variant="outline" size="sm" className="w-full justify-start text-status-warning hover:text-status-warning hover:bg-status-warning/10" onClick={injectWarning}>
          Inject Load Warning
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start text-status-critical hover:text-status-critical hover:bg-status-critical/10" onClick={injectSchemaFailure}>
          Inject Schema Failure (DQ-003)
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start text-status-critical hover:text-status-critical hover:bg-status-critical/10" onClick={openCircuitBreaker}>
          Open Circuit Breaker (&gt;2%)
        </Button>
        <div className="h-px bg-border my-1" />
        <Button variant="outline" size="sm" className="w-full justify-start text-status-active hover:text-status-active hover:bg-status-active/10" onClick={triggerRecovery}>
          Trigger Recovery (Probe)
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive text-xs" onClick={resetSimulation}>
          Reset Pipeline State
        </Button>
      </CardContent>
    </Card>
  );
}
