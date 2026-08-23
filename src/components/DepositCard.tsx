import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { depositPayment, nightToStars, TxStep } from '../lib/payment';
import { ArrowDownLeft, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { playClickSound } from '../lib/sound';

type DepositCardProps = {
  contractAddress: string;
  initialAmount?: string;
  onTxStart: () => void;
  onStepChange: (step: TxStep, message: string) => void;
  onTxComplete: (type?: 'deposit' | 'withdraw', amountStr?: string) => void;
  onTxError: (errorMsg: string) => void;
};

export default function DepositCard({
  contractAddress,
  initialAmount,
  onTxStart,
  onStepChange,
  onTxComplete,
  onTxError,
}: DepositCardProps) {
  const { session, isConnected } = useWallet();
  const [amountNight, setAmountNight] = useState(initialAmount || '10');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (initialAmount && Number(initialAmount) > 0) {
      setAmountNight(initialAmount);
    }
  }, [initialAmount]);

  const presets = ['5', '10', '50', '100', '500'];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !isConnected) {
      alert('Please connect your 1AM wallet first.');
      return;
    }

    const stars = nightToStars(amountNight);
    if (stars <= 0n) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    setIsProcessing(true);
    onTxStart();

    try {
      await depositPayment(session, contractAddress, stars, onStepChange);
      onTxComplete('deposit', amountNight);
      setAmountNight('10');
    } catch (err: any) {
      console.error('[Deposit] failed:', err);
      onTxError(err?.message || 'Deposit transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const starsPreview = nightToStars(amountNight);

  return (
    <div className="panel-surface rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-white/[0.08] shadow-xl">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white text-base tracking-tight">Deposit Inflow</h3>
            <p className="text-xs text-slate-400 font-mono text-[11px]">Lock unshielded tNIGHT into vault settlement</p>
          </div>
        </div>

        <form onSubmit={handleDeposit} className="space-y-4">
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
              <label htmlFor="deposit-amount" className="text-[10px] uppercase tracking-widest text-slate-400">
                DEPOSIT AMOUNT
              </label>
              <span className="text-slate-500 text-[11px] font-mono">{Number(starsPreview).toLocaleString()} Stars</span>
            </div>
            <div className="relative">
              <input
                id="deposit-amount"
                type="number"
                step="any"
                min="0.000001"
                value={amountNight}
                onChange={(e) => setAmountNight(e.target.value)}
                placeholder="0.00"
                required
                disabled={isProcessing}
                className="w-full input-surface rounded-xl px-4 py-3 text-lg font-mono font-medium text-white pr-20 disabled:opacity-50 tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-semibold">
                tNIGHT
              </span>
            </div>
          </div>

          {/* Quick preset selector */}
          <div className="grid grid-cols-5 gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  playClickSound();
                  setAmountNight(preset);
                }}
                disabled={isProcessing}
                className={`py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  amountNight === preset
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold shadow-sm'
                    : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                +{preset}
              </button>
            ))}
          </div>

          {/* Transaction Fee breakdown */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="uppercase text-[10px] tracking-wider text-slate-500">Circuit</span>
              <span className="text-slate-200">receiveUnshielded</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="uppercase text-[10px] tracking-wider text-slate-500">Gas & Dust</span>
              <span className="text-emerald-400 font-medium">0.000000 (Sponsored)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !isConnected}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-black bg-white hover:bg-slate-100 active:bg-slate-200 shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2 font-mono uppercase tracking-widest"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Processing Deposit...</span>
              </>
            ) : (
              <span>Execute Deposit ({amountNight} tNIGHT)</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
