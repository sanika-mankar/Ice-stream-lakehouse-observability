import React from 'react';

export default function PipelinePage() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden bg-background flex items-center justify-center p-4">
      
      <div className="relative w-full h-full flex items-center justify-center group">
        {/* The Image with Screen Blend Mode to remove black background */}
        <img 
          src="/Pipeline.jpg.png" 
          alt="Pipeline Architecture" 
          className="w-full h-full object-contain pointer-events-none select-none relative z-10"
          style={{ 
            mixBlendMode: 'screen', // Magically drops the black background to reveal the app theme!
            animation: 'pulse-neon 4s ease-in-out infinite alternate' 
          }}
        />

        {/* Scanning 'Data Flow' wave that moves left to right */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden mix-blend-color-dodge opacity-60">
          <div 
            className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
            style={{ animation: 'scan 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
          />
          <div 
            className="absolute top-0 bottom-0 w-[20%] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
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
        @keyframes pulse-neon {
          0% { filter: brightness(1) contrast(1); }
          50% { filter: brightness(1.2) contrast(1.1) drop-shadow(0 0 10px rgba(0, 240, 255, 0.1)); }
          100% { filter: brightness(1) contrast(1); }
        }
      `}</style>
    </div>
  );
}
