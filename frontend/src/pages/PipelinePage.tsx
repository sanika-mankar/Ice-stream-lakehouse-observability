import { useState, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  BackgroundVariant 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../lib/store/useStore';
import { CustomNode } from '../components/pipeline/CustomNode';
import { CustomEdge } from '../components/pipeline/CustomEdge';
import { NodeSidePanel } from '../components/pipeline/NodeSidePanel';
import type { PipelineNodeData } from '../lib/types';
import { Workflow, Image as ImageIcon } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

export default function PipelinePage() {
  const { nodes, edges, onNodesChange, circuitBreakerStatus, metrics } = useStore();
  const [selectedNode, setSelectedNode] = useState<PipelineNodeData | null>(null);
  const [viewMode, setViewMode] = useState<'dag' | 'sketch'>('dag');

  // Dynamically update node metrics based on live authoritative store metrics
  const liveNodes = useMemo(() => {
    return nodes.map(n => {
      const data = { ...n.data };
      if (n.id === 'circuit') {
        data.status = circuitBreakerStatus === 'OPEN' ? 'CIRCUIT_BREAKER_OPEN' : circuitBreakerStatus === 'HALF_OPEN' ? 'DEGRADED' : 'HEALTHY';
        data.isCircuitOpen = circuitBreakerStatus === 'OPEN';
        data.metrics = {
          ...data.metrics,
          errorRate: metrics.errorRate,
          processed: metrics.eventsProcessed,
          throughput: metrics.throughput
        };
      } else if (n.id === 'kafka' || n.id === 'flink' || n.id === 'source') {
        data.metrics = {
          ...data.metrics,
          throughput: metrics.throughput,
          processed: metrics.eventsProcessed
        };
      } else if (n.id === 'quality') {
        data.metrics = {
          ...data.metrics,
          errorRate: metrics.errorRate,
          processed: metrics.eventsProcessed,
          errors: metrics.invalidEvents
        };
      } else if (n.id === 'clean_sink') {
        data.metrics = {
          ...data.metrics,
          processed: metrics.validEvents
        };
      } else if (n.id === 'dlq_sink') {
        data.metrics = {
          ...data.metrics,
          processed: metrics.invalidEvents
        };
      }
      return { ...n, data };
    });
  }, [nodes, circuitBreakerStatus, metrics]);

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background">
      {/* View Switcher Header */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border p-1.5 rounded-xl shadow-lg">
        <button
          onClick={() => setViewMode('dag')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'dag'
              ? 'bg-primary text-primary-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Workflow className="w-4 h-4" />
          Interactive DAG (React Flow)
        </button>
        <button
          onClick={() => setViewMode('sketch')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'sketch'
              ? 'bg-primary text-primary-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Architecture Blueprint
        </button>
      </div>

      {viewMode === 'dag' ? (
        <div className="w-full h-full relative">
          <ReactFlow
            nodes={liveNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            onNodeClick={(_, node) => setSelectedNode(node.data as PipelineNodeData)}
            onPaneClick={() => setSelectedNode(null)}
            className="bg-[#090d16]"
          >
            <Background color="#2a3346" gap={20} size={1.5} variant={BackgroundVariant.Dots} />
            <Controls className="bg-card border border-border fill-foreground text-foreground" />
          </ReactFlow>

          {/* Node detail side panel on node click */}
          <NodeSidePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center p-8 group">
          <img 
            src="/Pipeline(2).png.png" 
            alt="Pipeline Architecture Blueprint" 
            className="w-full h-full object-contain pointer-events-none select-none relative z-10"
            style={{ 
              mixBlendMode: 'multiply',
              animation: 'pulse-light 4s ease-in-out infinite alternate' 
            }}
          />

          {/* Scanning Data Flow Wave */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-40">
            <div 
              className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
              style={{ animation: 'scan 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
            />
          </div>

          <style>{`
            @keyframes scan {
              0% { left: -50%; }
              100% { left: 150%; }
            }
            @keyframes pulse-light {
              0% { filter: brightness(1) contrast(1); }
              50% { filter: brightness(1.05) contrast(1.05) drop-shadow(0 0 10px rgba(0, 100, 255, 0.15)); }
              100% { filter: brightness(1) contrast(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
