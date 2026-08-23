import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  Shield, 
  Copy, 
  Check, 
  LogOut, 
  Terminal, 
  Activity, 
  ArrowUpRight, 
  MonitorPlay, 
  Zap, 
  DoorOpen,
  Sparkles, 
  Cpu, 
  Wrench, 
  Brain, 
  Calculator, 
  GraduationCap, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { playClickSound } from '../lib/sound';

interface NavbarProps {
  activeContractAddress?: string | null;
  onExitVault?: () => void;
}

export default function Navbar({ activeContractAddress, onExitVault }: NavbarProps) {
  const { isConnected, address, walletType, walletStatus, isConnecting, connect, connectSandbox, disconnect, session } = useWallet();
  const [copied, setCopied] = useState(false);
  const [proofServerOnline, setProofServerOnline] = useState<boolean | null>(null);

  // Hold-to-vibrate developer profile states
  const [isHoldingK, setIsHoldingK] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTriggeredRef = useRef<boolean>(false);

  const startHold = (e: React.TouchEvent | React.MouseEvent) => {
    isTriggeredRef.current = false;
    setIsHoldingK(true);

    holdTimerRef.current = setTimeout(() => {
      isTriggeredRef.current = true;
      setIsHoldingK(false);

      // Trigger phone haptic vibration buzz
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 30, 80]); // energetic haptic pattern
        } catch (err) {}
      }

      playClickSound();
      setShowDeveloperModal(true);
    }, 450); // 450ms hold
  };

  const endHold = (e: React.TouchEvent | React.MouseEvent) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHoldingK(false);
  };

  const handleKClick = (e: React.MouseEvent) => {
    if (isTriggeredRef.current) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    playClickSound();
    onExitVault?.();
  };

  // Detect environment and proof server URI
  const railwayProofServer = import.meta.env.VITE_PROOF_SERVER_URI as string | undefined;
  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'));
  const proofServerUri = railwayProofServer || 'http://localhost:6300';
  const hasProofServer = isLocalDev || !!railwayProofServer;

  useEffect(() => {
    if (!hasProofServer) {
      setProofServerOnline(false);
      return;
    }
    const checkProofServer = async () => {
      try {
        await fetch(proofServerUri, { mode: 'no-cors' });
        setProofServerOnline(true);
      } catch (e) {
        setProofServerOnline(false);
      }
    };
    checkProofServer();
    const interval = setInterval(checkProofServer, 8000);
    return () => clearInterval(interval);
  }, [hasProofServer, proofServerUri]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExitDoor = () => {
    playClickSound();
    onExitVault?.();
    disconnect();
  };

  return (
    <header className="sticky top-0 z-30 pt-2.5 sm:pt-3 px-3 sm:px-6 max-w-7xl mx-auto w-full animate-window-1">
      <div className="panel-surface rounded-2xl px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-2 border border-white/[0.08] shadow-2xl bg-[#0e1117]/90 backdrop-blur-2xl relative">
        {/* Left: Brand Identity with Hold-to-Vibrate on [ K ] Symbol */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 min-w-0">
          {/* Interactive [ K ] Emblem Button with Hold Gesture */}
          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            onTouchCancel={endHold}
            onClick={handleKClick}
            className={`w-8 h-8 rounded-xl bg-gradient-to-br from-[#00f5a0]/25 via-emerald-500/10 to-transparent border border-[#00f5a0]/40 flex items-center justify-center text-white font-mono font-bold text-sm shadow-[0_0_15px_rgba(0,245,160,0.15)] hover:border-[#00f5a0]/70 transition-all flex-shrink-0 cursor-pointer select-none relative group ${
              isHoldingK ? 'animate-haptic-buzz scale-95 ring-2 ring-[#00f5a0] shadow-[0_0_20px_#00f5a0]' : ''
            }`}
            title="Press & hold to reveal Architect Info // Click to Home"
          >
            <span>K</span>
            {isHoldingK && (
              <span className="absolute inset-0 rounded-xl bg-[#00f5a0]/20 animate-ping pointer-events-none" />
            )}
          </button>

          {/* Brand Name Title */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onExitVault?.();
            }}
            className="flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity text-left cursor-pointer group"
            title={activeContractAddress ? "Exit Vault & Return to Main Page" : "KNIGHT.VAULT Protocol"}
          >
            <span className="font-display font-extrabold text-white tracking-tight text-sm sm:text-base">
              KNIGHT<span className="text-[#00f5a0] drop-shadow-[0_0_8px_#00f5a0]">.</span>VAULT
            </span>
            <span className="hidden md:inline text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 font-mono border border-white/10 uppercase tracking-widest">
              v0.20
            </span>
          </button>
        </div>

        {/* Center/Right Status & Wallet controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Exit Vault Action on desktop */}
          {activeContractAddress && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onExitVault?.();
              }}
              title="Leave Vault and return to Main Page"
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono transition-all font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>Exit</span>
            </button>
          )}

          {/* Proof Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                proofServerOnline === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : proofServerOnline === false
                  ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                  : 'bg-slate-400 animate-pulse'
              }`} />
              <span className="text-[11px] text-slate-300">
                {proofServerOnline === true
                  ? (railwayProofServer ? 'Railway Active' : 'Prover :6300')
                  : proofServerOnline === false
                  ? 'Offline'
                  : 'Prover...'}
              </span>
            </div>
          </div>

          {/* Interactive Presentation Deck Link (Space-optimized for Mobile & Desktop) */}
          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Interactive Presentation Slides"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/30 text-[11px] sm:text-xs font-mono text-slate-200 transition-all shadow-sm flex-shrink-0"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-[#00f5a0] flex-shrink-0" />
            <span className="font-medium hidden xs:inline">Deck</span>
          </a>

          {/* Wallet Connection & Exit Door */}
          {isConnected && address ? (
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.09] rounded-xl p-1 text-xs">
              <div className="flex items-center gap-1.5 px-1.5 sm:px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="font-mono text-slate-200 text-[11px] truncate max-w-[70px] xs:max-w-[90px] sm:max-w-none">
                  {address.slice(0, 5)}...{address.slice(-4)}
                </span>
                <span className="hidden sm:inline text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                  {walletType === 'sandbox' ? 'Demo' : 'Lace'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                title="Copy Address"
                className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleExitDoor}
                title={activeContractAddress ? "Exit Vault & Disconnect to Main Page" : "Disconnect"}
                className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => connect('preprod')}
                disabled={isConnecting}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-black bg-white hover:bg-slate-100 active:bg-slate-200 shadow-md transition-all disabled:opacity-50 font-mono tracking-tight flex-shrink-0"
              >
                {isConnecting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-black rounded-full animate-spin" />
                    <span className="text-[10px] sm:text-[11px]">Connecting</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>

              {/* Instant Sandbox Demo Button */}
              <button
                type="button"
                onClick={connectSandbox}
                disabled={isConnecting}
                title="Instant Sandbox Mode (No Extension Needed)"
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-medium text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 active:bg-amber-400/30 border border-amber-400/25 transition-all flex-shrink-0"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span>Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Kshitij Adakane Developer Info Modal (Triggered by Holding [ K ]) */}
      {showDeveloperModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-200"
          onClick={() => setShowDeveloperModal(false)}
        >
          {/* Modal Card Content (Stop propagation so clicks inside don't dismiss) */}
          <div 
            className="relative w-full max-w-sm rounded-2xl bg-[#0e1117] border border-white/[0.22] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,245,160,0.3)] p-5 text-left text-slate-200 z-10 select-text"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Ambient Top Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-1 bg-gradient-to-r from-transparent via-[#00f5a0] to-transparent rounded-full opacity-90 shadow-[0_0_12px_#00f5a0]" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5a0]/25 via-emerald-500/10 to-indigo-500/20 border border-[#00f5a0]/40 flex items-center justify-center text-white font-mono font-bold text-sm shadow-[0_0_12px_rgba(0,245,160,0.2)] flex-shrink-0">
                  KA
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display font-bold text-white text-sm tracking-tight">
                      Kshitij Adakane
                    </h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0] animate-pulse" />
                  </div>
                  <div className="text-[10px] font-mono text-[#00f5a0] font-medium tracking-wide">
                    VIBE CODER & SYSTEMS BUILDER
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeveloperModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
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
              className="flex items-center justify-between w-full py-2.5 px-3 mt-3 rounded-xl bg-white/[0.04] hover:bg-[#00f5a0]/10 border border-white/[0.08] hover:border-[#00f5a0]/40 text-slate-200 hover:text-[#00f5a0] text-xs font-mono font-semibold transition-all group/gh shadow-sm"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-slate-400 group-hover/gh:text-[#00f5a0] transition-colors fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>github.com/KSHITIJadakane</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/gh:text-[#00f5a0] transition-colors" />
            </a>

            {/* Footer Sub-Note */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9.5px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3 text-slate-400" />
                <span>Student Builder</span>
              </span>
              <span className="text-[#00f5a0] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Architect of KNIGHT.VAULT</span>
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
