import React from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = 'var(--color-status-active)' }: SparklineProps) {
  const chartData = data.map((val, i) => ({ index: i, value: val }));
  
  return (
    <div className="h-[40px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
