import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { withdrawPayment, nightToStars, starsToNight, TxStep, PaymentVaultState } from '../lib/payment';
import { fromHex } from '../lib/midnight';
import { ArrowUpRight, Key, ShieldCheck, Lock } from 'lucide-react';
import { playClickSound } from '../lib/sound';

type WithdrawCardProps = {
  contractAddress: string;
  vaultState: PaymentVaultState | null;
  ownerSecretKeyHex?: string;
  onUnlockOwnerKey?: (keyHex: string) => void;
  onTxStart: () => void;
  onStepChange: (step: TxStep, message: string) => void;
  onTxComplete: () => void;
  onTxError: (errorMsg: string) => void;
};

export default function WithdrawCard({
  contractAddress,
  vaultState,
  ownerSecretKeyHex,
  onUnlockOwnerKey,
  onTxStart,
  onStepChange,
  onTxComplete,
  onTxError,
}: WithdrawCardProps) {
  const { session, isConnected, address } = useWallet();
  const [amountNight, setAmountNight] = useState('5');
  const [recipient, setRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [importedKey, setImportedKey] = useState('');

  const vaultBalanceStars = vaultState?.balance ?? 0n;
  const vaultBalanceNight = starsToNight(vaultBalanceStars);

  const handleMax = () => {
    playClickSound();
    setAmountNight(vaultBalanceNight);
  };

  const handleUseMyAddress = () => {
    playClickSound();
    if (address) {
      setRecipient(address);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !isConnected) {
      alert('Please connect your wallet first.');
      return;
    }

    const stars = nightToStars(amountNight);
    if (stars <= 0n) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }

    if (stars > vaultBalanceStars) {
      alert(`Cannot withdraw more than available vault balance (${vaultBalanceNight} tNIGHT).`);
      return;
    }

    const targetRecipient = recipient.trim() || address;
    if (!targetRecipient) {
      alert('Please provide a valid recipient address.');
      return;
    }

    setIsProcessing(true);
    onTxStart();

    try {
      await withdrawPayment(
        session,
        contractAddress,
        stars,
        targetRecipient,
        ownerSecretKeyHex,
        onStepChange
      );
      onTxComplete();
      setAmountNight('5');
    } catch (err: any) {
      console.error('[Withdraw] failed:', err);
      onTxError(err?.message || 'Withdrawal transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!ownerSecretKeyHex) {
    return (
      <div className="panel-surface rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-white/[0.08] shadow-xl">
        <div>
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.06]">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-base tracking-tight">Owner Withdrawal (Locked)</h3>
              <p className="text-xs text-slate-400 font-mono text-[11px]">Restricted to authorized vault owner witness</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-3 text-slate-300">
            <div className="flex items-start gap-2 text-amber-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Only the creator possessing the cryptographic owner key can withdraw funds.</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Customers and external payers can deposit freely. If you are the owner, unlock withdrawals by importing your 64-character owner key.
            </p>

            {showKeyInput ? (
              <div className="space-y-2 pt-2">
                <input
                  type="password"
                  value={importedKey}
                  onChange={(e) => setImportedKey(e.target.value)}
                  placeholder="Paste 64-character owner key..."
                  className="w-full input-surface rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-600"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      if (importedKey.trim().length === 64) {
                        onUnlockOwnerKey?.(importedKey.trim());
                      } else {
                        alert('Please enter a valid 64-character hex owner key.');
                      }
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium"
                  >
                    Unlock Withdrawals
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setShowKeyInput(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] text-slate-400 hover:text-slate-200 text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowKeyInput(true);
                }}
                className="w-full mt-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-mono transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Key className="w-3.5 h-3.5 text-[#00f5a0]" />
                <span>Import Owner Key (Unlock)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-surface rounded-2xl p-5 sm:p-6 flex flex-col justify-between border border-white/[0.08] shadow-xl">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/20 flex items-center justify-center text-[#818cf8] flex-shrink-0 shadow-inner">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white text-base tracking-tight">Withdraw Outflow</h3>
            <p className="text-xs text-slate-400 font-mono text-[11px]">Release custody funds to designated recipient</p>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
              <label htmlFor="withdraw-amount" className="text-[10px] uppercase tracking-widest text-slate-400">
                WITHDRAW AMOUNT
              </label>
              <button
                type="button"
                onClick={handleMax}
                disabled={isProcessing || vaultBalanceStars <= 0n}
                className="text-[#818cf8] hover:text-indigo-300 font-semibold hover:underline text-[11px]"
              >
                Max: {vaultBalanceNight} tNIGHT
              </button>
            </div>
            <div className="relative">
              <input
                id="withdraw-amount"
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

          {/* Recipient Address */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
              <label htmlFor="recipient-address" className="text-[10px] uppercase tracking-widest text-slate-400">
                RECIPIENT ADDRESS
              </label>
              {address && (
                <button
                  type="button"
                  onClick={handleUseMyAddress}
                  className="text-slate-400 hover:text-white underline text-[11px]"
                >
                  My Address
                </button>
              )}
            </div>
            <input
              id="recipient-address"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={address || 'midnight1... or 0x...'}
              disabled={isProcessing}
              className="w-full input-surface rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 disabled:opacity-50"
            />
          </div>

          {/* Authorization & Gas Info */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="uppercase text-[10px] tracking-wider text-slate-500">Authorization</span>
              <span className="text-slate-200">ZK Owner Witness Proof</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span className="uppercase text-[10px] tracking-wider text-slate-500">Gas & Dust</span>
              <span className="text-[#00f5a0] font-medium">0.000000 (Sponsored)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !isConnected || vaultBalanceStars <= 0n}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2 font-mono uppercase tracking-widest"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authorizing & Proving...</span>
              </>
            ) : (
              <span>Execute Withdrawal ({amountNight} tNIGHT)</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
