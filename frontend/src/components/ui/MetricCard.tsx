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

export function MetricCard({ title, value, icon: Icon, trend, trendValue, description, statusColor = 'text-muted-foreground' }: MetricCardProps) {
  return (
    <Card className="glass relative overflow-hidden transition-all hover:border-border/80">
      <div className={cn("absolute left-0 top-0 w-1 h-full", statusColor.replace('text-', 'bg-'))} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", statusColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center mt-1 space-x-2">
          {trend && (
            <span className={cn(
              "flex items-center text-xs font-medium",
              trend === 'up' ? "text-status-healthy" : trend === 'down' ? "text-status-critical" : "text-muted-foreground"
            )}>
              {trend === 'up' && <ArrowUpRight className="w-3 h-3 mr-1" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3 mr-1" />}
              {trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
              {trendValue}
            </span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
