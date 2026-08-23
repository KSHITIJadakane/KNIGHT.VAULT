import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Cpu, Wrench, Brain, Calculator, GraduationCap, X, ExternalLink } from 'lucide-react';

export default function DeveloperProfilePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Interactive Trigger Button / Badge */}
      <button
        onClick={handleClick}
        type="button"
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-[#00f5a0]/40 text-[11px] text-slate-300 transition-all cursor-pointer group shadow-sm focus:outline-none focus:ring-1 focus:ring-[#00f5a0]"
        title="Click or hover to view builder profile"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0] animate-pulse" />
        <span className="text-slate-400 group-hover:text-slate-300 transition-colors">
          Architected & Engineered by
        </span>
        <span className="font-semibold text-white group-hover:text-[#00f5a0] transition-colors border-b border-dashed border-white/30 group-hover:border-[#00f5a0]">
          Kshitij Adakane
        </span>
      </button>

      {/* Floating Popover Bio Card */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[320px] sm:w-[360px] z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.45,0.64,1)] transform-gpu ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto filter blur-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none filter blur-sm'
        }`}
      >
        {/* Glow & Backdrop Glass Container */}
        <div className="relative rounded-2xl bg-[#0d1117]/95 border border-white/[0.14] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(0,245,160,0.15)] backdrop-blur-2xl p-5 text-left text-slate-200">
          {/* Subtle Ambient Top Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#00f5a0] to-transparent rounded-full opacity-70" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5a0]/20 to-indigo-500/20 border border-[#00f5a0]/30 flex items-center justify-center text-white font-mono font-bold text-sm shadow-inner flex-shrink-0">
                KA
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-display font-bold text-white text-sm tracking-tight">
                    Kshitij Adakane
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0]" />
                </div>
                <div className="text-[10px] font-mono text-[#00f5a0] font-medium tracking-wide">
                  VIBE CODER & SYSTEMS BUILDER
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bio Tagline */}
          <p className="text-xs font-mono text-slate-300 leading-relaxed my-3 text-[11.5px]">
            Passionate student & technologist crafting intelligent software at the crossroads of hardware, mathematical rigor, and rapid AI engineering.
          </p>

          {/* Quality Badges Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10.5px]">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300">
              <Wrench className="w-3.5 h-3.5 text-[#00f5a0] flex-shrink-0" />
              <span>Automotive & Cars</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Embedded Systems</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300">
              <Brain className="w-3.5 h-3.5 text-[#818cf8] flex-shrink-0" />
              <span>AI / ML Explorer</span>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300">
              <Calculator className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Applied Mathematics</span>
            </div>
          </div>

          {/* GitHub Direct Link Button */}
          <a
            href="https://github.com/KSHITIJadakane"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full py-2 px-3 mt-3 rounded-xl bg-white/[0.04] hover:bg-[#00f5a0]/10 border border-white/[0.08] hover:border-[#00f5a0]/40 text-slate-200 hover:text-[#00f5a0] text-xs font-mono font-semibold transition-all group/gh shadow-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 group-hover/gh:text-[#00f5a0] transition-colors fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>github.com/KSHITIJadakane</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover/gh:text-[#00f5a0] transition-colors" />
          </a>

          {/* Footer Sub-Note */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9.5px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3 h-3 text-slate-400" />
              <span>Student Builder</span>
            </span>
            <span className="text-[#00f5a0] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Building the Future</span>
            </span>
          </div>

          {/* Pointer Triangle */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0d1117] border-b border-r border-white/[0.14] rotate-45" />
        </div>
      </div>
    </div>
  );
}
