import React, { useEffect, useState } from 'react';
import { TxStep } from '../lib/payment';
import { Cpu, Coins, CheckCircle2, AlertCircle, X, Loader2, FileCheck2, Sparkles } from 'lucide-react';

type TransactionStatusModalProps = {
  isOpen: boolean;
  step: TxStep;
  message: string;
  errorMessage?: string | null;
  onClose: () => void;
};

export default function TransactionStatusModal({
  isOpen,
  step,
  message,
  errorMessage,
  onClose,
}: TransactionStatusModalProps) {
  const [isClosingAuto, setIsClosingAuto] = useState(false);

  // Auto-dismiss smoothly when all steps turn green (success)
  useEffect(() => {
    if (step === 'success' && isOpen) {
      const timer = setTimeout(() => {
        setIsClosingAuto(true);
        const exitTimer = setTimeout(() => {
          setIsClosingAuto(false);
          onClose();
        }, 950);
        return () => clearTimeout(exitTimer);
      }, 1200); // 1.2s satisfying hold to view all green marks

      return () => clearTimeout(timer);
    }
  }, [step, isOpen, onClose]);

  // Close on Escape key if finished or errored
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (step === 'success' || step === 'error')) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const stepsList = [
    { id: 'preparing', label: 'Transaction Parameter Assembly', icon: FileCheck2 },
    { id: 'proving', label: 'ZK-SNARK Proving Engine (ProofStation)', icon: Cpu },
    { id: 'submitting', label: 'Dust Sponsorship & Broadcast (0 Gas)', icon: Coins },
    { id: 'indexing', label: 'Indexer Settlement & Block Commit', icon: CheckCircle2 },
  ];

  const getStepStatus = (itemIndex: number) => {
    const order = ['idle', 'preparing', 'proving', 'submitting', 'indexing', 'success'];
    const currentIdx = order.indexOf(step);

    if (step === 'error') return 'error';
    if (step === 'success') return 'completed';
    if (currentIdx > itemIndex + 1) return 'completed';
    if (currentIdx === itemIndex + 1) return 'active';
    return 'pending';
  };

  const handleBackdropClick = () => {
    if (step === 'error') {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-[950ms] ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
        isClosingAuto ? 'opacity-0 filter blur-md pointer-events-none' : 'opacity-100 filter blur-0'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-[#0e1117] border border-white/10 w-full max-w-md rounded-2xl p-4 sm:p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all duration-[950ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isClosingAuto ? 'scale-[0.96] translate-y-3 opacity-0' : 'scale-100 translate-y-0 opacity-100'
        }`}
      >
        {/* Close Button on Error */}
        {step === 'error' && (
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shadow-inner flex-shrink-0">
              {step === 'error' ? (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
              ) : step === 'success' ? (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
              ) : (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#00f5a0]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-display font-semibold text-white tracking-tight">
                {step === 'error'
                  ? 'Transaction Failed'
                  : step === 'success'
                  ? 'Transaction Confirmed'
                  : 'Executing ZK Transaction'}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 break-words text-[10px] sm:text-[11px]">
                {step === 'success'
                  ? 'Transaction confirmed & indexed on Midnight Network with zero gas fees.'
                  : message || 'Communicating with local proof engine...'}
              </p>
            </div>
          </div>

          {step === 'error' && errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-200 break-words">
              <div className="font-semibold text-rose-100 mb-1 text-[11px]">Details:</div>
              <p className="text-[10px] sm:text-[11px] leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Step Progress Checklist */}
        <div className="space-y-1.5 sm:space-y-2 my-3 sm:my-4 bg-black/40 rounded-xl p-2.5 sm:p-3.5 border border-white/[0.06]">
          {stepsList.map((item, idx) => {
            const status = getStepStatus(idx);
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 sm:p-2.5 rounded-lg text-xs font-mono transition-all ${
                  status === 'active'
                    ? 'bg-white/[0.05] text-white border border-white/15 shadow-sm'
                    : status === 'completed'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {status === 'active' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f5a0]" />
                    ) : status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium truncate">{item.label}</span>
                </div>

                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold ml-2 flex-shrink-0">
                  {status === 'active' ? 'Running' : status === 'completed' ? 'Done' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Automatic Transition Status Indicator or Error Action */}
        {step === 'success' ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center gap-2 font-mono text-xs animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] tracking-wide">Settlement Complete &bull; Entering Vault...</span>
          </div>
        ) : step === 'error' ? (
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-mono uppercase tracking-wider text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 transition-colors"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}
