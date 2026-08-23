import React from 'react';

type AmbientBackgroundProps = {
  isVisible?: boolean;
};

export default function AmbientBackground({ isVisible = true }: AmbientBackgroundProps) {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Matte Obsidian Canvas */}
      <div className="absolute inset-0 bg-[#07090e]" />

      {/* 1. INITIAL IGNITION SHOCKWAVE (Radiant portal bloom that expands when entering) */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vw] rounded-full blur-[160px] pointer-events-none transition-all duration-[2400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible 
            ? 'opacity-[0.22] scale-100 bg-gradient-to-tr from-[#00f5a0] via-[#06b6d4] to-[#6366f1]' 
            : 'opacity-0 scale-50 bg-[#00f5a0]'
        }`}
        style={{
          transform: isVisible 
            ? 'translate3d(-50%, -50%, 0) scale(1)' 
            : 'translate3d(-50%, -50%, 0) scale(0.4)',
          willChange: 'transform, opacity',
        }}
      />

      {/* 2. TOP-LEFT LIVING CYBER MINT AURORA */}
      <div 
        className={`absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] rounded-full blur-[140px] bg-[#00f5a0] animate-aurora-slow transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'opacity-[0.16] scale-100' : 'opacity-0 scale-75'
        }`} 
        style={{ willChange: 'transform, opacity' }}
      />

      {/* 3. RIGHT-CENTER DEEP MIDNIGHT INDIGO/VIOLET NEBULA */}
      <div 
        className={`absolute top-[22%] -right-[15%] w-[70vw] h-[70vw] rounded-full blur-[160px] bg-[#4f46e5] animate-aurora-reverse transition-all duration-[2400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'opacity-[0.18] scale-100' : 'opacity-0 scale-75'
        }`} 
        style={{ willChange: 'transform, opacity' }}
      />

      {/* 4. BOTTOM-CENTER ELECTRIC CYAN UNDERGLOW */}
      <div 
        className={`absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[150px] bg-[#06b6d4] animate-aurora-slow transition-all duration-[2600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'opacity-[0.13] scale-100' : 'opacity-0 scale-60'
        }`} 
        style={{ willChange: 'transform, opacity' }}
      />

      {/* 5. TOP-RIGHT EMERALD ACCENT BEAM */}
      <div 
        className={`absolute -top-[5%] right-[20%] w-[35vw] h-[35vw] rounded-full blur-[120px] bg-[#10b981] animate-pulse-subtle transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'opacity-[0.12] scale-100' : 'opacity-0 scale-50'
        }`} 
        style={{ willChange: 'transform, opacity' }}
      />

      {/* 6. CYBER HORIZON MATRIX & DOT GRID PATTERN */}
      <div 
        className={`absolute inset-0 transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'opacity-[0.055] scale-100' : 'opacity-0 scale-95'
        } bg-[radial-gradient(#00f5a0_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_15%,#000_65%,transparent_100%)]`}
        style={{ willChange: 'opacity, transform' }}
      />

      {/* 7. FLOATING GLOWING PARTICLES / STARDUST (CSS-Driven) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-[2800ms] ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute top-[18%] left-[22%] w-1.5 h-1.5 rounded-full bg-[#00f5a0] blur-[1px] animate-pulse shadow-[0_0_8px_#00f5a0]" />
        <div className="absolute top-[45%] right-[18%] w-1 h-1 rounded-full bg-[#818cf8] blur-[0.5px] animate-pulse shadow-[0_0_6px_#818cf8] delay-700" />
        <div className="absolute top-[72%] left-[35%] w-1.5 h-1.5 rounded-full bg-[#06b6d4] blur-[1px] animate-pulse shadow-[0_0_8px_#06b6d4] delay-1000" />
        <div className="absolute top-[28%] right-[32%] w-1 h-1 rounded-full bg-[#34d399] blur-[0.5px] animate-pulse shadow-[0_0_6px_#34d399] delay-500" />
        <div className="absolute top-[62%] right-[25%] w-1.5 h-1.5 rounded-full bg-[#a855f7] blur-[1px] animate-pulse shadow-[0_0_8px_#a855f7] delay-1200" />
      </div>

      {/* 8. VIGNETTE PERIPHERAL SHIELD */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,7,11,0.75)_100%)]" />
    </div>
  );
}

