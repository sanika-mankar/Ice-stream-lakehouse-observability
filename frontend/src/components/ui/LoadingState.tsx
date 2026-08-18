import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = "Loading...", className, fullScreen = false }: LoadingStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3 text-muted-foreground",
      fullScreen ? "fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "w-full h-full min-h-[200px]",
      className
    )}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm font-medium tracking-wide animate-pulse">{message}</span>
    </div>
  );
}
