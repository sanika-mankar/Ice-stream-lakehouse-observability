import React from 'react';

export default function PipelinePage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background flex items-center justify-center p-4">
      
      <div className="relative w-full h-full flex items-center justify-center group">
        {/* The Image with Screen Blend Mode to remove black background */}
        <img 
          src="/Pipeline(2).png.png" 
          alt="Pipeline Architecture" 
          className="w-full h-full object-contain pointer-events-none select-none relative z-10"
          style={{ 
            mixBlendMode: 'multiply',
            animation: 'pulse-light 4s ease-in-out infinite alternate' 
          }}
        />

        {/* Scanning 'Data Flow' wave that moves left to right */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-40">
          <div 
            className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
            style={{ animation: 'scan 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
          />
          <div 
            className="absolute top-0 bottom-0 w-[20%] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
            style={{ animation: 'scan 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse' }}
          />
        </div>
      </div>

      {/* Internal CSS for the custom animations */}
      <style>{`
        @keyframes scan {
          0% { left: -50%; }
          100% { left: 150%; }
        }
        @keyframes pulse-light {
          0% { filter: brightness(1) contrast(1); }
          50% { filter: brightness(1.05) contrast(1.05) drop-shadow(0 0 10px rgba(0, 100, 255, 0.15)); }
          100% { filter: brightness(1) contrast(1); }
        }
      `}</style>
    </div>
  );
}
