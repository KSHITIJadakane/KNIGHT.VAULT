import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Shield, Copy, Check, LogOut, Terminal, Activity, ArrowUpRight, MonitorPlay, Zap, DoorOpen } from 'lucide-react';
import { playClickSound } from '../lib/sound';

interface NavbarProps {
  activeContractAddress?: string | null;
  onExitVault?: () => void;
}

export default function Navbar({ activeContractAddress, onExitVault }: NavbarProps) {
  const { isConnected, address, walletType, walletStatus, isConnecting, connect, connectSandbox, disconnect, session } = useWallet();
  const [copied, setCopied] = useState(false);
  const [proofServerOnline, setProofServerOnline] = useState<boolean | null>(null);

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
    <header className="sticky top-0 z-30 pt-2 sm:pt-3 px-2 sm:px-6 max-w-7xl mx-auto w-full animate-window-1">
      <div className="panel-surface rounded-2xl px-2.5 sm:px-5 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2 border border-white/[0.08] shadow-2xl bg-[#0e1117]/85 backdrop-blur-2xl">
        {/* Left: Brand Identity (Clickable to return home/main page) */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onExitVault?.();
          }}
          className="flex items-center gap-2 sm:gap-3 flex-shrink-0 hover:opacity-90 transition-opacity text-left cursor-pointer group min-w-0"
          title={activeContractAddress ? "Exit Vault & Return to Main Page" : "KNIGHT.VAULT Protocol"}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#00f5a0]/20 via-white/10 to-white/[0.02] border border-[#00f5a0]/30 flex items-center justify-center text-white font-mono font-bold text-xs sm:text-sm shadow-sm group-hover:border-[#00f5a0]/60 transition-colors flex-shrink-0">
            K
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-display font-extrabold text-white tracking-tight text-xs sm:text-base">
              KNIGHT<span className="text-[#00f5a0]">.</span>VAULT
            </span>
            <span className="hidden md:inline text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 font-mono border border-white/10 uppercase tracking-widest">
              v0.20
            </span>
          </div>
        </button>

        {/* Center/Right Status & Wallet controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Exit Vault Action (when inside an active vault) */}
          {activeContractAddress && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onExitVault?.();
              }}
              title="Leave Vault and return to Main Page"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-white/[0.04] hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 text-[11px] sm:text-xs font-mono transition-all font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="hidden sm:inline">Exit Vault</span>
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

          {/* Interactive Presentation Deck Link */}
          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Interactive Presentation Slides"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-mono text-slate-200 transition-all"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-[#00f5a0]" />
            <span className="font-medium">Deck</span>
          </a>

          {/* Wallet Connection & Exit Door */}
          {isConnected && address ? (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-white/[0.04] border border-white/[0.09] rounded-lg sm:rounded-xl p-0.5 sm:p-1 text-xs max-w-full">
              <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="font-mono text-slate-200 text-[10px] sm:text-[11px] truncate max-w-[68px] sm:max-w-none">
                  {address.slice(0, 4)}...{address.slice(-3)}
                </span>
                <span className="hidden sm:inline text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                  {walletType === 'sandbox' ? 'Demo' : 'Lace'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                title="Copy Address"
                className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={handleExitDoor}
                title={activeContractAddress ? "Exit Vault & Disconnect to Main Page" : "Disconnect"}
                className="p-1 sm:p-1.5 rounded-md sm:rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => connect('preprod')}
                disabled={isConnecting}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-black bg-white hover:bg-slate-100 active:bg-slate-200 shadow-md transition-all disabled:opacity-50 font-mono tracking-tight"
              >
                {isConnecting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-black rounded-full animate-spin" />
                    <span className="text-[10px] sm:text-[11px]">Connecting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={connectSandbox}
                disabled={isConnecting}
                title="Launch Instant Demo Mode"
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all font-mono"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
