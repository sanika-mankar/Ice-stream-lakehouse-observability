import React from 'react';

export default function PipelinePage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background flex items-center justify-center p-4">
      <img 
        src="/Pipeline.jpg.png" 
        alt="Pipeline Architecture" 
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
}
