import { 
  getBezierPath, 
  EdgeLabelRenderer, 
  type EdgeProps 
} from '@xyflow/react';

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const semanticColor = (data?.semanticColor as string) 
    || (style.stroke as string) 
    || '#475569';

  const label = data?.label as string | undefined;
  const isAnimated = data?.animated !== false;

  return (
    <>
      {/* Invisible wider path for smooth hover and interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction"
      />

      {/* Main Visible Colored Edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={semanticColor}
        strokeWidth={2.5}
        strokeDasharray={isAnimated ? '6 4' : undefined}
        markerEnd={markerEnd}
        className={`transition-colors duration-300 ${isAnimated ? 'flow-edge-active' : ''}`}
        style={{
          ...style,
          stroke: semanticColor,
        }}
      />

      {/* Crisp, Colored Text Note Badge on Edge */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan select-none z-10"
          >
            <div 
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm border backdrop-blur-md transition-all hover:scale-105"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderColor: semanticColor,
                color: semanticColor,
                boxShadow: `0 2px 6px ${semanticColor}30`,
              }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: semanticColor }} 
              />
              <span className="tracking-wide font-sans">{label}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      <style>{`
        @keyframes flowDash {
          from {
            stroke-dashoffset: 40;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .flow-edge-active {
          animation: flowDash 2.5s linear infinite;
        }
      `}</style>
    </>
  );
}
