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
      <SimulationPanel />
      
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
        minZoom={0.5}
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
  );
}

export default function PipelinePage() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
