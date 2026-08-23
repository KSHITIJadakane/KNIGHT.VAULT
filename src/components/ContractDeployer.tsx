import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { deployPayment, TxStep } from '../lib/payment';
import { Plus, Link2, Check, ArrowRight, Zap, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { playClickSound } from '../lib/sound';

type ContractDeployerProps = {
  onContractSelected: (address: string, ownerSecretKeyHex?: string) => void;
  onTxStart: () => void;
  onStepChange: (step: TxStep, message: string) => void;
  onTxComplete: () => void;
  onTxError: (errorMsg: string) => void;
};

export default function ContractDeployer({
  onContractSelected,
  onTxStart,
  onStepChange,
  onTxComplete,
  onTxError,
}: ContractDeployerProps) {
  const { session, isConnected, connect, connectSandbox, walletType } = useWallet();
  const [existingAddress, setExistingAddress] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleDeploy = async () => {
    playClickSound();
    setLastError(null);
    let activeSession = session;
    if (!activeSession || !isConnected) {
      activeSession = await connect('preprod');
      if (!activeSession) return;
    }

    setIsDeploying(true);
    onTxStart();

    try {
      const result = await deployPayment(activeSession, undefined, onStepChange);
      onTxComplete();
      onContractSelected(result.contractAddress, result.ownerSecretKeyHex);
    } catch (err: any) {
      console.error('[Deploy] failed:', err);
      const msg = err?.message || 'Contract deployment failed';
      setLastError(msg);
      onTxError(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleConnectExisting = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const clean = existingAddress.trim();
    if (!clean) {
      alert('Please enter a valid contract address.');
      return;
    }
    onContractSelected(clean);
  };

  // Deployment is allowed when either:
  //   a) Running locally (localhost / 127.0.0.1), OR
  //   b) VITE_PROOF_SERVER_URI is set (Railway proof server deployed)
  const isLocalEnv =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.'));

  const railwayProofServer = import.meta.env.VITE_PROOF_SERVER_URI as string | undefined;
  const proofServerConfigured = isLocalEnv || !!railwayProofServer;
  return (
    <div className="space-y-5 max-w-4xl mx-auto my-4 sm:my-6">
      {/* Show notice only when proof server is NOT configured */}
      {!proofServerConfigured && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-3 text-xs font-mono text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="font-semibold text-amber-100 text-[12px]">🐳 Proof Server Not Configured</div>
            <p className="text-amber-300/90 text-[11px] leading-relaxed">
              Set the <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-100">VITE_PROOF_SERVER_URI</code> environment variable in Vercel to your Railway proof server URL to enable deployments from this site.
            </p>
            <p className="text-amber-400/80 text-[10px]">
              Or paste an existing contract address in the <span className="text-white">&ldquo;Connect to Vault&rdquo;</span> panel below.
            </p>
          </div>
        </div>
      )}

      {/* Show Railway-connected badge when proof server env var is set */}
      {!isLocalEnv && railwayProofServer && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-700/40 flex items-center gap-3 text-xs font-mono text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div>
            <span className="font-semibold text-emerald-300">Railway ZK Proof Server Connected — </span>
            <span className="text-emerald-400/80 text-[10px]">{railwayProofServer}</span>
          </div>
        </div>
      )}

      {lastError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-xs font-mono text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-100">Deployment Notice</div>
            <p className="text-rose-300/90 text-[11px] mt-0.5 whitespace-pre-line">{lastError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Deploy New Settlement Vault */}
        <div className="panel-surface panel-surface-hover rounded-2xl p-4 sm:p-7 flex flex-col justify-between border border-white/[0.08] shadow-2xl">
          <div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-4 sm:mb-5 shadow-inner">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f5a0]" />
            </div>

            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#00f5a0] mb-1 font-semibold">
              INSTANTIATE PROTOCOL
            </div>
            <h3 className="text-base sm:text-xl font-display font-bold text-white mb-1.5 sm:mb-2 tracking-tight">
              Deploy New Vault
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 sm:mb-6 font-mono text-[10px] sm:text-[11px]">
              Instantiate an isolated Compact payment smart contract. Your session derives a private owner witness key for Zero-Knowledge proof authorization.
            </p>

            <div className="space-y-2 sm:space-y-2.5 text-xs font-mono text-slate-300 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check className="w-3.5 h-3.5 text-[#00f5a0] flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px]">Full ZK Circuit Verification</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check className="w-3.5 h-3.5 text-[#00f5a0] flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px]">Zero-Gas Deployment Sponsorship</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check className="w-3.5 h-3.5 text-[#00f5a0] flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px]">Target: Midnight Preprod Network</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !proofServerConfigured}
              title={!proofServerConfigured ? 'Set VITE_PROOF_SERVER_URI on Vercel to enable cloud deployment.' : undefined}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs text-black bg-white hover:bg-slate-100 active:bg-slate-200 shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono uppercase tracking-widest"
            >
              {isDeploying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Proving & Deploying...</span>
                </>
              ) : !proofServerConfigured ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Proof Server Not Configured</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#00f5a0]" />
                  <span>Deploy on Preprod</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Connect to Existing Vault */}
        <div className="panel-surface panel-surface-hover rounded-2xl p-4 sm:p-7 flex flex-col justify-between border border-white/[0.08] shadow-2xl">
          <div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-4 sm:mb-5 shadow-inner">
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>

            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-blue-400 mb-1 font-semibold">
              EXISTING CONTRACT
            </div>
            <h3 className="text-base sm:text-xl font-display font-bold text-white mb-1.5 sm:mb-2 tracking-tight">
              Connect to Vault
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 sm:mb-6 font-mono text-[10px] sm:text-[11px]">
              Access an already deployed payment contract instance. Index real-time ledger balance, deposit as a payer, or unlock owner withdrawals.
            </p>

            <form onSubmit={handleConnectExisting} className="space-y-3.5 sm:space-y-4">
              <div>
                <label
                  htmlFor="contract-address"
                  className="block text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5"
                >
                  CONTRACT ADDRESS (HEX OR BECH32)
                </label>
                <input
                  id="contract-address"
                  type="text"
                  value={existingAddress}
                  onChange={(e) => setExistingAddress(e.target.value)}
                  placeholder="0x... or midnight1..."
                  className="w-full input-surface rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs font-mono text-white placeholder:text-slate-600 tracking-tight"
                />
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-1.5 text-slate-400 text-[10px] sm:text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Cross-Device Shared Vaults Supported</span>
                </div>
                <p className="text-slate-500 text-[9px] sm:text-[10px] leading-relaxed">
                  Scan a QR code from mobile or paste the 64-character contract hash to enter deposit checkout mode.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-widest"
              >
                <span>Connect Instance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
