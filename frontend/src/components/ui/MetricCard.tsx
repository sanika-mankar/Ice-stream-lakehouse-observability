import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  description?: string;
  statusColor?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, trendValue, description, statusColor = 'text-slate-400' }: MetricCardProps) {
  // Map text colors to border colors so Tailwind doesn't purge them
  const borderColorMap: Record<string, string> = {
    'text-blue-500': 'bg-blue-500',
    'text-purple-500': 'bg-purple-500',
    'text-green-500': 'bg-green-500',
    'text-red-500': 'bg-red-500',
    'text-amber-500': 'bg-amber-500',
    'text-orange-400': 'bg-orange-400',
    'text-orange-500': 'bg-orange-500',
    'text-yellow-400': 'bg-yellow-400',
    'text-yellow-500': 'bg-yellow-500',
    'text-slate-400': 'bg-slate-400',
    'text-slate-500': 'bg-slate-500',
    'text-muted-foreground': 'bg-slate-400',
  };

  const bgColor = borderColorMap[statusColor] || 'bg-slate-400';

  return (
    <Card className="glass relative overflow-hidden transition-all hover:border-black/10">
      <div className={cn("absolute left-0 top-0 w-1 h-full", bgColor)} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <div className={cn("p-1.5 rounded-md bg-white border shadow-sm", bgColor.replace('bg-', 'border-').replace('500', '200'))}>
          <Icon className={cn("h-4 w-4", statusColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-800">{value}</div>
        <div className="flex items-center mt-1 space-x-2">
          {trend && (
            <span className={cn(
              "flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md",
              trend === 'up' ? "bg-green-500/10 text-green-600" : trend === 'down' ? "bg-red-500/10 text-red-600" : "bg-slate-100 text-slate-600"
            )}>
              {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
              {trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
              {trendValue}
            </span>
          )}
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
