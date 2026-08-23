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
  'SETTLEMENT VAULT',
  'MIDNIGHT.NETWORK',
];

export default function IntroSplash({ onComplete, onEntering }: IntroSplashProps) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [isEnteringSite, setIsEnteringSite] = useState(false);

  // Smooth cinematic counter pacing (~3.0s total duration)
  useEffect(() => {
    const startTime = performance.now();
    const duration = 2800; // 2.8s total smooth count

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Deep parabolic ease-out curve
      const easeProgress = 1 - Math.pow(1 - progress, 2.5);
      const currentVal = Math.floor(easeProgress * 100);
      setCount(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // Trigger slow spatial entrance through the gate in sync with background
        setTimeout(() => {
          setIsEnteringSite(true);
          onEntering?.();
          setTimeout(() => {
            onComplete();
          }, 1600); // 1.6s slow camera flight
        }, 400);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [onComplete, onEntering]);

  // Word cycling with deliberate editorial pacing
  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 460);

    return () => clearInterval(wordInterval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] w-full h-full flex flex-col justify-between p-6 sm:p-12 md:p-16 bg-[#08090d] text-white transition-all duration-[1600ms] ease-[cubic-bezier(0.7,0,0.1,1)] select-none overflow-hidden will-change-transform ${
        isEnteringSite
          ? '-translate-y-full opacity-0 filter blur-sm'
          : 'translate-y-0 opacity-100 filter blur-0'
      }`}
    >
      {/* Background Precision Grid */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Bar: OS Index & Mode */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse" />
          <span className="tracking-widest uppercase text-[11px] font-semibold text-slate-300">
            MIDNIGHT PROTOCOL OS
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-500 text-[11px]">
          <span>CIRCUIT V0.20</span>
          <span>&bull;</span>
          <span>PREPROD NETWORK</span>
        </div>
      </div>

      {/* Center Display: Rapid Word Morph & Floating Emblem Window */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center space-y-7">
        {/* Floating Minimal Cyber Symbol Frame */}
        <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-2xl bg-white/[0.03] border border-white/[0.12] p-5 flex items-center justify-center shadow-[0_0_60px_rgba(0,245,160,0.25)] backdrop-blur-xl transition-all duration-700">
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
            className="w-11 h-11 text-white stroke-current"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="2 17 12 22 22 17" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-[#00f5a0] stroke-current" />
            <polyline points="2 12 12 17 22 12" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Dynamic Cycling Word Ticker */}
        <div className="h-14 sm:h-18 flex items-center justify-center overflow-hidden">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-white transition-all duration-300">
            {CYCLING_WORDS[wordIndex]}
          </h2>
        </div>

        <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-sm tracking-wide">
          Initialising cryptographically private settlement environment
        </p>
      </div>

      {/* Bottom Bar: Large Benjamin Creative Monospace Numerical Counter */}
      <div className="w-full flex items-end justify-between z-10 font-mono">
        <div className="space-y-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest">CALIBRATING</div>
          <div className="text-xs text-slate-300">PORT :6300 &bull; DOCKER PROOF ENGINE</div>
        </div>

        {/* Big Stylized Counter */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-6xl sm:text-8xl md:text-9xl font-display font-extrabold tracking-tighter text-white tabular-nums">
            {count.toString().padStart(2, '0')}
          </span>
          <span className="text-2xl sm:text-3xl font-mono text-[#00f5a0] font-bold">%</span>
        </div>
      </div>
    </div>
  );
}
