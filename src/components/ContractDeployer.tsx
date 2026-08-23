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
    <div className="space-y-3 sm:space-y-5 max-w-4xl mx-auto my-2.5 sm:my-6">
      {/* Show notice only when proof server is NOT configured */}
      {!proofServerConfigured && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-950/30 border border-amber-700/50 flex items-start gap-2.5 text-xs font-mono text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-100 text-[11px] sm:text-[12px]">🐳 Proof Server Not Configured</div>
            <p className="text-amber-300/90 text-[10px] sm:text-[11px] leading-relaxed">
              Set the <code className="bg-black/30 px-1.5 py-0.5 rounded text-amber-100">VITE_PROOF_SERVER_URI</code> environment variable in Vercel to your Railway proof server URL to enable deployments from this site.
            </p>
            <p className="text-amber-400/80 text-[9px] sm:text-[10px]">
              Or paste an existing contract address in the <span className="text-white">&ldquo;Connect to Vault&rdquo;</span> panel below.
            </p>
          </div>
        </div>
      )}

      {/* Show Railway-connected compact sleek badge when proof server env var is set */}
      {!isLocalEnv && railwayProofServer && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-xs font-mono text-emerald-300 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse flex-shrink-0 shadow-[0_0_6px_#00f5a0]" />
            <span className="font-semibold text-emerald-200 text-[11px] truncate">Railway ZK Proof Engine Active</span>
          </div>
          <span className="hidden sm:inline text-emerald-400/70 text-[10px] truncate max-w-[240px]">
            {railwayProofServer}
          </span>
        </div>
      )}

      {lastError && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs font-mono text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-100 text-[11px] sm:text-xs">Deployment Notice</div>
            <p className="text-rose-300/90 text-[10px] sm:text-[11px] mt-0.5 whitespace-pre-line">{lastError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
        {/* Deploy New Settlement Vault */}
        <div className="panel-surface panel-surface-hover rounded-2xl p-4 sm:p-7 flex flex-col justify-between border border-white/[0.08] shadow-2xl">
          <div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-2.5 sm:mb-5 shadow-inner">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-[#00f5a0]" />
            </div>

            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#00f5a0] mb-0.5 sm:mb-1 font-semibold">
              INSTANTIATE PROTOCOL
            </div>
            <h3 className="text-base sm:text-xl font-display font-bold text-white mb-1 sm:mb-2 tracking-tight">
              Deploy New Vault
            </h3>
            <p className="text-slate-400 leading-relaxed mb-3 sm:mb-6 font-mono text-[10px] sm:text-[11px]">
              Instantiate an isolated Compact payment smart contract. Your session derives a private owner witness key for Zero-Knowledge proof authorization.
            </p>

            <div className="space-y-1.5 sm:space-y-2.5 text-xs font-mono text-slate-300 mb-4 sm:mb-8">
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

          <button
            type="button"
            onClick={handleDeploy}
            disabled={isDeploying || !isConnected}
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl text-xs font-bold text-black bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider font-mono cursor-pointer"
          >
            {isDeploying ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-black rounded-full animate-spin" />
                <span>Deploying Vault...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#00f5a0]" />
                <span>Deploy on Preprod</span>
              </>
            )}
          </button>
        </div>

        {/* Connect to Existing Vault */}
        <div className="panel-surface panel-surface-hover rounded-2xl p-4 sm:p-7 flex flex-col justify-between border border-white/[0.08] shadow-2xl">
          <div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-2.5 sm:mb-5 shadow-inner">
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#38bdf8]" />
            </div>

            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#38bdf8] mb-0.5 sm:mb-1 font-semibold">
              EXISTING CONTRACT
            </div>
            <h3 className="text-base sm:text-xl font-display font-bold text-white mb-1 sm:mb-2 tracking-tight">
              Connect to Vault
            </h3>
            <p className="text-slate-400 leading-relaxed mb-3 sm:mb-6 font-mono text-[10px] sm:text-[11px]">
              Already deployed a vault? Enter your hex contract address to monitor balances, execute deposits, or trigger private withdrawals.
            </p>

            <form onSubmit={handleConnectExisting} className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1.5 font-medium">
                  Contract Address (0x...)
                </label>
                <input
                  type="text"
                  value={existingAddress}
                  onChange={(e) => setExistingAddress(e.target.value)}
                  placeholder="0x0200..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.16] border border-white/10 hover:border-white/20 shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider font-mono cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-[#38bdf8]" />
                <span>Access Vault</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
