import React, { useState } from 'react';
import { PaymentVaultState, starsToNight } from '../lib/payment';
import { RefreshCw, Copy, Check, Key, Layers, ArrowDownLeft, ArrowUpRight, ShieldCheck, QrCode } from 'lucide-react';
import ShareReceiveModal from './ShareReceiveModal';

type VaultMetricsProps = {
  contractAddress: string;
  vaultState: PaymentVaultState | null;
  isLoadingState: boolean;
  onRefresh: () => void;
  ownerSecretKeyHex?: string;
};

export default function VaultMetrics({
  contractAddress,
  vaultState,
  isLoadingState,
  onRefresh,
  ownerSecretKeyHex,
}: VaultMetricsProps) {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1500);
  };

  const copyKey = () => {
    if (!ownerSecretKeyHex) return;
    navigator.clipboard.writeText(ownerSecretKeyHex);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const balanceNight = vaultState ? starsToNight(vaultState.balance) : '0';
  const depositedNight = vaultState ? starsToNight(vaultState.totalDeposited) : '0';
  const withdrawnNight = vaultState ? starsToNight(vaultState.totalWithdrawn) : '0';

  return (
    <div className="space-y-3">
      {/* Share / Receive Modal */}
      <ShareReceiveModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        contractAddress={contractAddress}
      />

      {/* Top Header Card */}
      <div className="panel-surface rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.09] flex items-center justify-center text-slate-200 flex-shrink-0 shadow-inner">
              <Layers className="w-4 h-4 text-[#00f5a0]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                ACTIVE VAULT INSTANCE
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs sm:text-sm text-slate-100 font-semibold truncate select-all">
                  {contractAddress.slice(0, 12)}...{contractAddress.slice(-10)}
                </span>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0"
                  title="Copy Address"
                >
                  {copiedAddr ? <Check className="w-3.5 h-3.5 text-[#00f5a0]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={() => setShareModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-white/20 text-xs font-mono text-slate-100 transition-all font-medium shadow-sm"
              title="Generate QR Code or Payment Invoice"
            >
              <QrCode className="w-3.5 h-3.5 text-[#00f5a0]" />
              <span>Receive / QR</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoadingState}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-white/20 text-xs font-mono text-slate-300 hover:text-white transition-all disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingState ? 'animate-spin text-[#00f5a0]' : 'text-slate-400'}`} />
              <span>{isLoadingState ? 'Syncing...' : 'Sync Indexer'}</span>
            </button>
          </div>
        </div>

        {/* Metric Layout: Hero Card + Sub-metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          {/* Active Balance - Hero Card */}
          <div className="sm:col-span-1 panel-surface-subtle panel-surface-hover rounded-xl p-4 border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-transparent to-transparent shadow-md flex flex-col justify-between">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>VAULT LIQUIDITY</span>
              <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight tabular-nums">
                {balanceNight}
              </span>
              <span className="text-xs font-mono text-slate-400 font-semibold">tNIGHT</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1 tabular-nums">
              ≈ {vaultState ? Number(vaultState.balance).toLocaleString() : '0'} Stars
            </div>
          </div>

          {/* Cumulative Inflow & Outflow in 2-column sub-grid */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            {/* Cumulative Inflow */}
            <div className="panel-surface-subtle panel-surface-hover rounded-xl p-4 border border-white/[0.06] flex flex-col justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 truncate">
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#00f5a0] flex-shrink-0" />
                <span className="truncate">TOTAL INFLOW</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#00f5a0] tracking-tight tabular-nums">
                  {depositedNight}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400">tNIGHT</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 truncate tabular-nums">
                {vaultState ? Number(vaultState.totalDeposited).toLocaleString() : '0'} Stars
              </div>
            </div>

            {/* Cumulative Outflow (Soothing Soft Indigo) */}
            <div className="panel-surface-subtle panel-surface-hover rounded-xl p-4 border border-white/[0.06] flex flex-col justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 truncate">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#818cf8] flex-shrink-0" />
                <span className="truncate">TOTAL OUTFLOW</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#818cf8] tracking-tight tabular-nums">
                  {withdrawnNight}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400">tNIGHT</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 truncate tabular-nums">
                {vaultState ? Number(vaultState.totalWithdrawn).toLocaleString() : '0'} Stars
              </div>
            </div>
          </div>
        </div>

        {/* Private Owner Key Witness Drawer if present */}
        {ownerSecretKeyHex && (
          <div className="mt-3.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300 min-w-0">
              <Key className="w-4 h-4 text-[#00f5a0] flex-shrink-0" />
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">Session Key:</span>
              <span className="font-mono text-slate-200 truncate text-[11px] select-all">{ownerSecretKeyHex}</span>
            </div>
            <button
              onClick={copyKey}
              className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-mono transition-colors self-end sm:self-auto border border-white/10"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
