import React from 'react';

export default function PipelinePage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background flex items-center justify-center p-4">
      <div className="relative w-full h-full flex items-center justify-center group">
        <img 
          src="/Pipeline.jpg.png" 
          alt="Pipeline Architecture" 
          className="w-full h-full object-contain pointer-events-none select-none relative z-10" style={{ mixBlendMode: 'screen', animation: 'pulse-neon 4s ease-in-out infinite alternate' }}
        />
      </div>
      <style>{`
        @keyframes scan {
          0% { left: -50%; }
          100% { left: 150%; }
        }
      `  @keyframes pulse-neon {
          0% { filter: brightness(1) contrast(1); }
          50% { filter: brightness(1.2) contrast(1.1) drop-shadow(0 0 10px rgba(0, 240, 255, 0.1)); }
          100% { filter: brightness(1) contrast(1); }
        }
      }</style>
    </div>
  );
}