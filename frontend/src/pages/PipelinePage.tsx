import React from 'react';

export default function PipelinePage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center group">
        <img 
          src="/Pipeline.jpg.png" 
          alt="Pipeline Architecture" 
          className="w-full h-full object-contain pointer-events-none select-none relative z-10" style={{ mixBlendMode: "screen" }}
        />
      </div>
      <style>{`
        @keyframes scan {
          0% { left: -50%; }
          100% { left: 150%; }
        }
      `}</style>
    </div>
  );
}