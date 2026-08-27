import type { EdgeProps } from '@xyflow/react';
import { BaseEdge, getBezierPath } from '@xyflow/react';
import { cn } from '../../lib/utils';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeState = data?.state || 'HEALTHY';
  
  const strokeColor = edgeState === 'HEALTHY' ? 'hsl(var(--status-healthy))' 
    : edgeState === 'WARNING' ? 'hsl(var(--status-warning))' 
    : edgeState === 'CRITICAL' ? 'hsl(var(--status-critical))' 
    : edgeState === 'QUARANTINED' ? 'hsl(var(--status-critical))' 
    : edgeState === 'CIRCUIT_BREAKER_OPEN' ? 'transparent' // We'll show dashed or no line
    : 'hsl(var(--border))';

  const isFlowing = edgeState !== 'CIRCUIT_BREAKER_OPEN';
  const animationSpeed = edgeState === 'WARNING' ? '3s' : edgeState === 'CRITICAL' ? '1s' : '2s';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#arrow-${edgeState})`}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: isFlowing ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
          strokeDasharray: isFlowing ? '8 8' : '0',
          animation: isFlowing ? `dashdraw ${animationSpeed} linear infinite` : 'none',
          opacity: edgeState === 'CIRCUIT_BREAKER_OPEN' ? 0.3 : 1,
          filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))',
        }}
        className="react-flow__edge-path transition-all duration-300"
      />
      
      {/* Invisible thicker edge for easier clicking/hovering */}
      <BaseEdge
        path={edgePath}
        style={{ strokeWidth: 24, stroke: 'transparent' }}
        className="react-flow__edge-interaction"
      />
      
      <style>
        {`
          @keyframes dashdraw {
            from {
              stroke-dashoffset: 100;
            }
          }
        `}
      </style>
    </>
  );
}
