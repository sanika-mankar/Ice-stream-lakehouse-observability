import { 
  getBezierPath, 
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

  const strokeColor = (data?.semanticColor as string) || (style.stroke as string) || '#64748b';

  return (
    <>
      {/* Background interaction path */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />

      {/* Main Connection Path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeDasharray="4 3"
        strokeOpacity={0.85}
        className="transition-colors duration-300"
      />
    </>
  );
}
