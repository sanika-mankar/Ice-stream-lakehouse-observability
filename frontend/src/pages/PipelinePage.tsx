import React, { useState, useCallback, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { ReactFlow, ReactFlowProvider, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../lib/store/useStore';
import { CustomNode } from '../components/pipeline/CustomNode';
import { CustomEdge } from '../components/pipeline/CustomEdge';
import { NodeSidePanel } from '../components/pipeline/NodeSidePanel';
import { SimulationPanel } from '../components/pipeline/SimulationPanel';
import type { PipelineNodeData } from '../lib/types';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function Flow() {
  const { nodes, edges, onNodesChange } = useStore();
  const [selectedNode, setSelectedNode] = useState<PipelineNodeData | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as PipelineNodeData);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background">
      <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
        <defs>
          <marker id="arrow-HEALTHY" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--status-healthy))" />
          </marker>
          <marker id="arrow-WARNING" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--status-warning))" />
          </marker>
          <marker id="arrow-CRITICAL" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--status-critical))" />
          </marker>
          <marker id="arrow-QUARANTINED" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--status-critical))" />
          </marker>
        </defs>
      </svg>
      
      {/* Simulation Panel - absolute positioned to always float on the right */}
      <div className="absolute top-4 right-4 w-72 z-50 pointer-events-auto">
        <SimulationPanel />
      </div>
      
      {/* React Flow Container - constrained width on ALL screens so fitView centers on the left */}
      <div className="w-[calc(100%-320px)] h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={1.5}
          defaultEdgeOptions={{ type: 'custom' }}
          className="bg-background/50"
        >
          <Background color="hsl(var(--muted-foreground))" gap={16} size={1} />
          <Controls className="glass shadow-xl border-border fill-foreground" />
        </ReactFlow>

        <NodeSidePanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />
      </div>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
