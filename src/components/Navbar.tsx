import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Shield, Copy, Check, LogOut, Terminal, Activity, ArrowUpRight, MonitorPlay, Zap } from 'lucide-react';

export default function Navbar() {
  const { isConnected, address, walletType, walletStatus, isConnecting, connect, connectSandbox, disconnect, session } = useWallet();
  const [copied, setCopied] = useState(false);
  const [proofServerOnline, setProofServerOnline] = useState<boolean | null>(null);

  // Only check proof server health when running locally (it's a local Docker service)
  const isLocalDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'));

  useEffect(() => {
    if (!isLocalDev) {
      setProofServerOnline(false);
      return;
    }
    const checkProofServer = async () => {
      try {
        await fetch('http://localhost:6300', { mode: 'no-cors' });
        setProofServerOnline(true);
      } catch (e) {
        setProofServerOnline(false);
      }
    };
    checkProofServer();
    const interval = setInterval(checkProofServer, 8000);
    return () => clearInterval(interval);
  }, [isLocalDev]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="sticky top-0 z-30 pt-3 px-3 sm:px-6 max-w-7xl mx-auto w-full animate-window-1">
      <div className="panel-surface rounded-2xl px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-2 border border-white/[0.08] shadow-2xl bg-[#0e1117]/80 backdrop-blur-2xl">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00f5a0]/20 via-white/10 to-white/[0.02] border border-[#00f5a0]/30 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm">
            K
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-white tracking-tight text-sm sm:text-base">
              KNIGHT<span className="text-[#00f5a0]">.</span>VAULT
            </span>
            <span className="hidden sm:inline text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 font-mono border border-white/10 uppercase tracking-widest">
              v0.20
            </span>
          </div>
        </div>

        {/* Center/Right Status & Wallet controls */}
        <div className="flex items-center gap-2 flex-shrink min-w-0">
          {/* Proof Server Status Pill */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-slate-300"
            title={isLocalDev ? "Local Docker Proof Server (port 6300)" : "ZK Proving requires local Docker on port 6300"}
          >
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Engine:</span>
            {!isLocalDev ? (
              <span className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Local Docker Only
              </span>
            ) : proofServerOnline === true ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                6300 Active
              </span>
            ) : proofServerOnline === false ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Probing
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">Connecting...</span>
            )}
          </div>

          {/* Network Selector Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0]" />
            <span className="uppercase tracking-wider">{session?.config?.networkId ?? 'Preprod'}</span>
          </div>

          {/* Presentation Deck Link */}
          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Interactive Presentation Slides"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-mono text-slate-200 transition-all"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-[#00f5a0]" />
            <span className="font-medium">Deck</span>
          </a>

          {/* Wallet Connection */}
          {isConnected && address ? (
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.09] rounded-xl p-1 text-xs max-w-full">
              <div className="flex items-center gap-1.5 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="font-mono text-slate-200 text-[11px] truncate max-w-[85px] sm:max-w-none">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <span className="hidden sm:inline text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10">
                  {walletType === '1am' ? '1AM' : walletType === 'sandbox' ? 'Demo' : 'Lace'}
                </span>
              </div>

              <button
                onClick={handleCopy}
                title="Copy Address"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={disconnect}
                title="Disconnect"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => connect('preprod')}
                disabled={isConnecting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-black bg-white hover:bg-slate-100 active:bg-slate-200 shadow-md transition-all disabled:opacity-50 font-mono tracking-tight"
              >
                {isConnecting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-black rounded-full animate-spin" />
                    <span className="text-[11px]">Connecting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </>
                )}
              </button>

              <button
                onClick={connectSandbox}
                disabled={isConnecting}
                title="Launch Instant Demo Mode"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all font-mono"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
