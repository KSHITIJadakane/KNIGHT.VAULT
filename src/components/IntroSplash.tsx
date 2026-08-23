import React, { useEffect, useState } from 'react';

type IntroSplashProps = {
  onComplete: () => void;
  onEntering?: () => void;
};

const CYCLING_WORDS = [
  'ZERO-KNOWLEDGE',
  'COMPACT CIRCUITS',
  'PRIVATE STATE',
  'DUST-FREE GAS',
  'KNIGHT.VAULT',
  'MIDNIGHT.NETWORK',
];

export default function IntroSplash({ onComplete, onEntering }: IntroSplashProps) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [isEnteringSite, setIsEnteringSite] = useState(false);
  const [isFullyLit, setIsFullyLit] = useState(false);

  // Grand cinematic counter pacing (~3.6s total duration for slow majestic entrance)
  useEffect(() => {
    const startTime = performance.now();
    const duration = 3600; // 3.6s smooth, deliberate count

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Majestic cubic ease-out deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 2.6);
      const currentVal = Math.floor(easeProgress * 100);
      setCount(currentVal);

      if (progress > 0.6) {
        setIsFullyLit(true);
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Ignite the background auroras to come to life right at 100%!
        onEntering?.();

        // Hold at 100% for 450ms while background illuminates, then smoothly lift curtain
        setTimeout(() => {
          setIsEnteringSite(true);
          setTimeout(() => {
            onComplete();
          }, 1800); // 1.8s slow, majestic upward flight
        }, 450);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [onComplete, onEntering]);

  // Word cycling with deliberate editorial pacing
  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 550);

    return () => clearInterval(wordInterval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-[#07090e] text-white select-none overflow-hidden transition-all duration-[1800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isEnteringSite
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
      style={{
        transform: isEnteringSite ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)',
        willChange: 'transform, opacity',
      }}
    >
      {/* Dynamic Ambient Underglow that lights up progressively with counter */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full blur-[140px] pointer-events-none transition-all duration-1000"
        style={{
          backgroundColor: isFullyLit ? '#00f5a0' : '#4338ca',
          opacity: isFullyLit ? 0.16 : 0.06,
          transform: `translate3d(-50%, -50%, 0) scale(${isFullyLit ? 1.2 : 0.9})`,
        }}
      />

      {/* Background Precision Grid */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Bar: OS Index & Mode */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse shadow-[0_0_8px_#00f5a0]" />
          <span className="tracking-widest uppercase text-[11px] font-semibold text-slate-200">
            KNIGHT.VAULT // PROTOCOL OS
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="text-[#00f5a0]">CIRCUIT V0.20</span>
          <span>&bull;</span>
          <span>PREPROD NETWORK</span>
        </div>
      </div>

      {/* Center Display: Rapid Word Morph & Floating Emblem Window */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-6 sm:space-y-7">
        {/* Floating Minimal Cyber Symbol Frame */}
        <div 
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/[0.04] border border-white/[0.15] p-4 sm:p-5 flex items-center justify-center backdrop-blur-xl transition-all duration-700 shadow-[0_0_50px_rgba(0,245,160,0.2)]"
          style={{
            borderColor: isFullyLit ? 'rgba(0, 245, 160, 0.4)' : 'rgba(255, 255, 255, 0.12)',
            boxShadow: isFullyLit ? '0 0 60px rgba(0, 245, 160, 0.35)' : '0 0 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Cyber Mint Corner Accents */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00f5a0]" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00f5a0]" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00f5a0]" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00f5a0]" />

          {/* Geometric Shard Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 sm:w-11 sm:h-11 text-white stroke-current transition-transform duration-500"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="2 17 12 22 22 17" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[#00f5a0] stroke-current" />
            <polyline points="2 12 12 17 22 12" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dynamic Cycling Word Ticker */}
        <div className="h-12 sm:h-16 flex items-center justify-center overflow-hidden">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-[#00f5a0] bg-clip-text text-transparent transition-all duration-300">
            {CYCLING_WORDS[wordIndex]}
          </h2>
        </div>

        <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-sm tracking-wide leading-relaxed">
          Initialising cryptographically private settlement environment
        </p>
      </div>

      {/* Bottom Bar: Stylized Monospace Numerical Counter */}
      <div className="w-full flex items-end justify-between z-10 font-mono">
        <div className="space-y-1">
          <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest">CALIBRATING</div>
          <div className="text-[11px] sm:text-xs text-slate-300">PORT :6300 &bull; DOCKER PROOF ENGINE</div>
        </div>

        {/* Big Stylized Counter */}
        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <span className="text-5xl sm:text-7xl md:text-8xl font-display font-extrabold tracking-tighter text-white tabular-nums">
            {count.toString().padStart(2, '0')}
          </span>
          <span className="text-xl sm:text-2xl font-mono text-[#00f5a0] font-bold">%</span>
        </div>
      </div>
    </div>
  );
}

