import React, { useState } from 'react';
import ScrollReveal from './ScrollReveal';
import { 
  ShieldCheck, 
  Cpu, 
  Coins, 
  Layers, 
  ArrowRight, 
  Check, 
  Copy, 
  Terminal, 
  Sparkles,
  Zap,
  EyeOff
} from 'lucide-react';

export default function ShowcaseSections() {
  const [copiedCode, setCopiedCode] = useState(false);

  const compactCodeSample = `// payment.compact (Midnight Network stdlib v0.20)
contract PaymentVault {
  // Public ledger balances stored on-chain
  ledger balance: Counter;
  ledger totalDeposited: Counter;
  ledger ownerCommitment: Bytes<32>;

  // Public Payer Inflow (Zero-Knowledge Witnessed)
  export circuit receiveUnshielded(amount: Uint<64>): Void {
    balance.increment(amount);
    totalDeposited.increment(amount);
  }

  // Confidential Owner Outflow (ZK Proof of Secret Key)
  export circuit withdraw(
    amount: Uint<64>, 
    recipient: Either<ZswapCoinPublicKey, ContractAddress>
  ): Void {
    witness ownerSecretKey: Bytes<32>;
    assert persistentCommit(ownerSecretKey) == ownerCommitment;
    balance.decrement(amount);
    sendUnshielded(amount, recipient);
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(compactCodeSample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="mt-20 sm:mt-32 space-y-24 sm:space-y-36 max-w-7xl mx-auto w-full pb-24">
      {/* 1. HERO SHOWCASE INTRO — Blur & Character Bloom Animation */}
      <ScrollReveal variant="blur-spread" duration={1200}>
        <div className="max-w-3xl space-y-4 border-l-2 border-[#00f5a0] pl-5 sm:pl-7">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#00f5a0] uppercase tracking-widest font-semibold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>CONFIDENTIAL ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.1]">
            Engineered for absolute privacy and zero-friction settlement.
          </h2>
          <p className="text-sm sm:text-base font-mono text-slate-400 leading-relaxed max-w-2xl">
            Built on Midnight Network, the world's leading data-protection blockchain. Combining Zero-Knowledge SNARKs with unshielded token liquidity and sponsored gas.
          </p>
        </div>
      </ScrollReveal>

      {/* 2. BENTO PILLARS GRID — Multi-Directional Kinetic Convergence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Pillar: Lateral Ingress from Left */}
        <ScrollReveal variant="slide-left" delay={100} duration={1100}>
          <div className="panel-surface panel-surface-hover rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between border border-white/[0.08] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f5a0]/5 rounded-full blur-2xl group-hover:bg-[#00f5a0]/15 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00f5a0]/10 border border-[#00f5a0]/25 flex items-center justify-center text-[#00f5a0] mb-6 shadow-inner">
                <EyeOff className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#00f5a0] font-semibold mb-2">
                WITNESS ISOLATION
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">
                Private State Custody
              </h3>
              <p className="text-xs sm:text-sm font-mono text-slate-400 leading-relaxed">
                Secret keys are never published to the ledger. All authorizations happen locally inside your browser or client runtime via Zero-Knowledge proofs.
              </p>
            </div>
            <div className="pt-6 border-t border-white/[0.06] mt-6 flex items-center gap-2 text-xs font-mono text-slate-300">
              <ShieldCheck className="w-4 h-4 text-[#00f5a0]" />
              <span>Zero-Leakage Guarantee</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Center Pillar: Deep Z-Space Zoom Elevation */}
        <ScrollReveal variant="zoom-depth" delay={220} duration={1150}>
          <div className="panel-surface panel-surface-hover rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between border border-white/[0.08] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#818cf8]/5 rounded-full blur-2xl group-hover:bg-[#818cf8]/15 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/25 flex items-center justify-center text-[#818cf8] mb-6 shadow-inner">
                <Coins className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#818cf8] font-semibold mb-2">
                SPONSORED RELAY
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">
                Dust-Free Transactions
              </h3>
              <p className="text-xs sm:text-sm font-mono text-slate-400 leading-relaxed">
                Customers and mobile payers can check out and deposit instantly without needing gas token balances or complex faucet claims.
              </p>
            </div>
            <div className="pt-6 border-t border-white/[0.06] mt-6 flex items-center gap-2 text-xs font-mono text-slate-300">
              <Zap className="w-4 h-4 text-[#818cf8]" />
              <span>Zero User Gas Required</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Right Pillar: Lateral Ingress from Right */}
        <ScrollReveal variant="slide-right" delay={340} duration={1100}>
          <div className="panel-surface panel-surface-hover rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between border border-white/[0.08] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-6 shadow-inner">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-2">
                PROOF ENGINE
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-3">
                Local Docker ProofStation
              </h3>
              <p className="text-xs sm:text-sm font-mono text-slate-400 leading-relaxed">
                Connects directly to your local Docker proof server on port 6300 to compile and generate Halo2 / Compact proofs in real-time.
              </p>
            </div>
            <div className="pt-6 border-t border-white/[0.06] mt-6 flex items-center gap-2 text-xs font-mono text-slate-300">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>100% Client-Side Proving</span>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* 3. INTERACTIVE 4-STEP ZK PROOF PIPELINE — 3D Perspective Flip & Cascade */}
      <ScrollReveal variant="flip-up" duration={1150}>
        <div className="panel-surface rounded-2xl p-6 sm:p-10 border border-white/[0.08] shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#00f5a0] font-semibold mb-1">
                EXECUTION FLOW
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                How ZK Settlement Works
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              4-Stage Cryptographic Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ScrollReveal variant="slide-left" delay={120} duration={850}>
              <div className="space-y-3 p-5 rounded-xl bg-black/40 border border-white/[0.06] h-full panel-surface-hover">
                <div className="font-mono text-xs text-[#00f5a0] font-bold">01 / WITNESS</div>
                <h4 className="font-display font-bold text-white text-base">Private Witnessing</h4>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  The owner key or payment amount is packaged in the isolated client-side private state container.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="zoom-depth" delay={220} duration={850}>
              <div className="space-y-3 p-5 rounded-xl bg-black/40 border border-white/[0.06] h-full panel-surface-hover">
                <div className="font-mono text-xs text-[#818cf8] font-bold">02 / SYNTHESIS</div>
                <h4 className="font-display font-bold text-white text-base">ZK Proof Engine</h4>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  The ProofStation transforms circuit constraints into a succinct Zero-Knowledge proof transcript.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="zoom-depth" delay={320} duration={850}>
              <div className="space-y-3 p-5 rounded-xl bg-black/40 border border-white/[0.06] h-full panel-surface-hover">
                <div className="font-mono text-xs text-cyan-400 font-bold">03 / SPONSOR</div>
                <h4 className="font-display font-bold text-white text-base">Relay Balancing</h4>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  Dust fee sponsorship attaches required UTXO collateral without charging the sender.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="slide-right" delay={420} duration={850}>
              <div className="space-y-3 p-5 rounded-xl bg-black/40 border border-white/[0.06] h-full panel-surface-hover">
                <div className="font-mono text-xs text-emerald-400 font-bold">04 / COMMIT</div>
                <h4 className="font-display font-bold text-white text-base">Ledger Finality</h4>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  Midnight Partnerchain validators verify proof validity and finalize state update to the indexer.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </ScrollReveal>

      {/* 4. BENCHMARK COMPARISON MATRIX — Glowing Portal Expansion */}
      <ScrollReveal variant="portal-expand" duration={1200}>
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-1">
            <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#00f5a0] font-semibold">
              SECURITY MATRIX
            </div>
            <h3 className="text-xl sm:text-3xl font-display font-bold text-white">
              Public Ledger vs. Midnight ZK Vault
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] shadow-2xl no-scrollbar">
            <table className="w-full text-left font-mono text-[11px] sm:text-xs min-w-[540px]">
              <thead className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08]">
                <tr>
                  <th className="p-3 sm:p-4 uppercase font-semibold">Feature / Guarantee</th>
                  <th className="p-3 sm:p-4 uppercase font-semibold text-rose-300">Traditional Public Vaults</th>
                  <th className="p-3 sm:p-4 uppercase font-semibold text-[#00f5a0]">Midnight ZK Vault</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] bg-[#0c0f16]">
                <tr className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 sm:p-4 text-slate-200 font-medium">Owner Identity Visibility</td>
                  <td className="p-3 sm:p-4 text-slate-400">Publicly linkable to wallet address</td>
                  <td className="p-3 sm:p-4 text-[#00f5a0] font-bold">Shielded via cryptographic witness</td>
                </tr>
                <tr className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 sm:p-4 text-slate-200 font-medium">Payer Cross-Device Friction</td>
                  <td className="p-3 sm:p-4 text-slate-400">Requires gas token in every wallet</td>
                  <td className="p-3 sm:p-4 text-[#00f5a0] font-bold">Zero-gas sponsored checkouts</td>
                </tr>
                <tr className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 sm:p-4 text-slate-200 font-medium">Auditability & Receipts</td>
                  <td className="p-3 sm:p-4 text-slate-400">Requires complex block explorer scraping</td>
                  <td className="p-3 sm:p-4 text-[#00f5a0] font-bold">Cryptographic QR verifiable receipts</td>
                </tr>
                <tr className="hover:bg-white/[0.03] transition-colors">
                  <td className="p-3 sm:p-4 text-slate-200 font-medium">Smart Contract Runtime</td>
                  <td className="p-3 sm:p-4 text-slate-400">EVM bytecode (transparent execution)</td>
                  <td className="p-3 sm:p-4 text-[#00f5a0] font-bold">Compact Circuits (ZK compilation)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* 5. DEVELOPER COMPACT CODE PREVIEW — Terminal Fold-Up Blueprint */}
      <ScrollReveal variant="flip-up" duration={1200}>
        <div className="panel-surface rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
          <div className="bg-black/60 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-[#00f5a0] flex-shrink-0" />
              <span>payment.compact</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-slate-400 hover:text-white px-2.5 sm:px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00f5a0]" />
                  <span className="text-[#00f5a0]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 sm:p-6 overflow-x-auto bg-[#07090e] no-scrollbar">
            <pre className="text-[11px] sm:text-sm font-mono text-slate-300 leading-relaxed selection:bg-[#00f5a0]/30 selection:text-white">
              <code>{compactCodeSample}</code>
            </pre>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
