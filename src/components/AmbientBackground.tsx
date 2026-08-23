import React from 'react';

type AmbientBackgroundProps = {
  isVisible?: boolean;
};

export default function AmbientBackground({ isVisible = true }: AmbientBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-all duration-[1800ms] ease-[cubic-bezier(0.12,0.99,0.28,1)] ${
        isVisible ? 'opacity-100 scale-100 filter blur-0' : 'opacity-0 scale-95 filter blur-xl'
      }`} 
      aria-hidden="true"
    >
      {/* Matte Obsidian Canvas */}
      <div className="absolute inset-0 bg-[#08090d]" />

      {/* Floating Soothing Cyber Mint Glow */}
      <div 
        className="absolute -top-[12%] -left-[8%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-[0.08] bg-[#00f5a0] animate-aurora-slow" 
      />

      {/* Deep Midnight Violet Orb */}
      <div 
        className="absolute top-[30%] -right-[12%] w-[55vw] h-[55vw] rounded-full blur-[150px] opacity-[0.11] bg-[#4338ca] animate-aurora-reverse" 
      />

      {/* Cyan/Teal Underglow */}
      <div 
        className="absolute -bottom-[15%] left-[25%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-[0.07] bg-[#0284c7] animate-aurora-slow" 
      />

      {/* Precision Engineering Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,#000_70%,transparent_100%)]" 
      />

      {/* Subtle Noise Vignette Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
