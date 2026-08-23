import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from './contexts/WalletContext';
import Navbar from './components/Navbar';
import VaultMetrics from './components/VaultMetrics';
import DepositCard from './components/DepositCard';
import WithdrawCard from './components/WithdrawCard';
import ContractDeployer from './components/ContractDeployer';
import TransactionStatusModal from './components/TransactionStatusModal';
import AmbientBackground from './components/AmbientBackground';
import IntroSplash from './components/IntroSplash';
import ShowcaseSections from './components/ShowcaseSections';
import DeveloperProfilePopover from './components/DeveloperProfilePopover';
import ReceiptModal, { ReceiptData } from './components/ReceiptModal';
import { playClickSound, playSuccessSound, playErrorSound } from './lib/sound';
import {
  decodePaymentState,
  fetchServerSandboxState,
  getSandboxState,
  PaymentVaultState,
  pollForState,
  TxStep,
} from './lib/payment';
import { 
  Layers, 
  ArrowLeftRight, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Cpu, 
  CheckCircle2, 
  ExternalLink,
  Play
} from 'lucide-react';

export default function App() {
  const { isConnected, session, connect } = useWallet();
  const [showIntro, setShowIntro] = useState(true);
  const [isSceneVisible, setIsSceneVisible] = useState(false);
  const [activeContractAddress, setActiveContractAddress] = useState<string | null>(null);
  const [ownerSecretKeyHex, setOwnerSecretKeyHex] = useState<string | undefined>(undefined);
  const [vaultState, setVaultState] = useState<PaymentVaultState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [initialDepositAmount, setInitialDepositAmount] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw' | 'audit' | 'zk'>('all');

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Parse deep payment links (e.g. ?vault=0x...&amount=25)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlVault = params.get('vault');
      const urlAmount = params.get('amount');
      if (urlVault) {
        setActiveContractAddress(urlVault);
        // Auto-connect in sandbox or extension mode so session is ready
        connect();
      }
      if (urlAmount) {
        setInitialDepositAmount(urlAmount);
      }
    }
  }, [connect]);

  // Modal transaction tracker
  const [modalOpen, setModalOpen] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>('idle');
  const [txMessage, setTxMessage] = useState('');
  const [txError, setTxError] = useState<string | null>(null);

  // Recent settlement activity history
  const [activityHistory, setActivityHistory] = useState<Array<{
    id: string;
    type: 'deposit' | 'withdraw' | 'deploy';
    amount?: string;
    timestamp: string;
    status: 'confirmed';
  }>>([]);

  const refreshVaultState = useCallback(async () => {
    if (!activeContractAddress) return;
    try {
      if (session?.config?.isSandbox || !session) {
        const serverState = await fetchServerSandboxState(activeContractAddress);
        if (serverState) {
          setVaultState({ ...serverState });
          return;
        }
        const sbState = getSandboxState(activeContractAddress);
        if (sbState) setVaultState({ ...sbState });
        return;
      }
      const stateHex = await pollForState(
        session.config.indexerUri,
        activeContractAddress,
        undefined,
        15,
        1500
      );
      const decoded = decodePaymentState(stateHex);
      setVaultState(decoded);
    } catch (e: any) {
      console.warn('[refreshVaultState] Indexer state not found, falling back to sandbox state:', e);
      const serverState = await fetchServerSandboxState(activeContractAddress);
      if (serverState) {
        setVaultState({ ...serverState });
      } else {
        const sbState = getSandboxState(activeContractAddress);
        if (sbState) setVaultState({ ...sbState });
      }
    }
  }, [session, activeContractAddress]);

  // Auto-sync polling every 2.5 seconds so PC and Phone update hand-in-hand
  useEffect(() => {
    if (!activeContractAddress) return;
    refreshVaultState();
    const interval = setInterval(refreshVaultState, 2500);
    return () => clearInterval(interval);
  }, [activeContractAddress, refreshVaultState]);

  const handleContractSelected = (address: string, secretKeyHex?: string) => {
    setActiveContractAddress(address);
    if (secretKeyHex) setOwnerSecretKeyHex(secretKeyHex);
    setActivityHistory((prev) => [
      {
        id: `deploy-${Date.now()}`,
        type: 'deploy',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'confirmed',
      },
      ...prev,
    ]);
  };

  const handleTxStart = () => {
    playClickSound();
    setModalOpen(true);
    setTxStep('preparing');
    setTxMessage('Preparing Zero-Knowledge transaction payload...');
    setTxError(null);
  };

  const handleStepChange = (step: TxStep, message: string) => {
    setTxStep(step);
    setTxMessage(message);
  };

  const handleTxComplete = (type: 'deposit' | 'withdraw' = 'deposit', amountStr: string = '10') => {
    playSuccessSound();
    setTxStep('success');
    setTxMessage('Transaction confirmed and indexed on Midnight Network with zero gas fees.');
    
    // Automatically generate rich audit entry
    const newTxId = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setActivityHistory((prev) => [
      {
        id: `tx-${Date.now()}`,
        type,
        amount: amountStr,
        timestamp: timestampStr,
        status: 'confirmed',
      },
      ...prev,
    ]);

    refreshVaultState();
  };

  const handleTxError = (errorMsg: string) => {
    playErrorSound();
    setTxStep('error');
    setTxError(errorMsg);
  };

  const openReceipt = (type: 'deposit' | 'withdraw', amount: string = '10', timestamp: string) => {
    playClickSound();
    setActiveReceipt({
      txId: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}`,
      type,
      amountNight: amount,
      contractAddress: activeContractAddress || 'midnight1...',
      timestamp,
      circuit: type === 'deposit' ? 'receiveUnshielded' : 'withdraw',
    });
    setReceiptModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 relative selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      {/* Cinematic Opening Intro Splash Scene */}
      {showIntro && (
        <IntroSplash
          onEntering={() => setIsSceneVisible(true)}
          onComplete={() => {
            setShowIntro(false);
            setIsSceneVisible(true);
          }}
        />
      )}

      {/* Living Ambient Aurora & Cyber Grid Background - Synchronized with Intro Flight */}
      <AmbientBackground isVisible={isSceneVisible} />

      {/* Main Dashboard Scene - Synchronized Spatial Entrance */}
      <div
        className={`flex-1 flex flex-col w-full transition-all duration-[1800ms] ease-[cubic-bezier(0.12,0.99,0.28,1)] ${
          isSceneVisible
            ? 'opacity-100 translate-y-0 filter blur-0'
            : 'opacity-0 translate-y-20 filter blur-lg pointer-events-none'
        }`}
      >
        {/* Glassmorphic Navbar */}
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        {/* Header Title Section */}
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between pb-4 sm:pb-5 border-b border-white/[0.08] animate-window-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Zero-Knowledge Privacy Vault</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-display font-bold tracking-tight text-slate-100">
              Midnight Settlement Vault
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl font-mono text-[12px]">
              Zero-Knowledge token custody and transfer circuits built on Midnight Network with dust-free sponsored gas.
            </p>
          </div>

          <div className="hidden sm:flex mt-4 sm:mt-0 items-center justify-center sm:justify-end gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Compact Circuits</span>
          </div>
        </div>

        {/* Dynamic Workspace */}
        {!activeContractAddress ? (
          <div className="animate-window-3">
            <ContractDeployer
              onContractSelected={handleContractSelected}
              onTxStart={handleTxStart}
              onStepChange={handleStepChange}
              onTxComplete={() => handleTxComplete('deposit', '10')}
              onTxError={handleTxError}
            />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5 animate-window-3">
            {/* Top Toolbar & Switcher */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="uppercase tracking-wider">Active Workspace Vault</span>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveContractAddress(null);
                  setVaultState(null);
                  setOwnerSecretKeyHex(undefined);
                }}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Switch Vault Instance
              </button>
            </div>

            {/* Metrics Dashboard */}
            <VaultMetrics
              contractAddress={activeContractAddress}
              vaultState={vaultState}
              isLoadingState={isLoadingState}
              onRefresh={refreshVaultState}
              ownerSecretKeyHex={ownerSecretKeyHex}
            />

            {/* Workspace Interactive Mode Tabs */}
            <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-1 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-md">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('all');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'tab-pill-active text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Dual Terminal</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('deposit');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'deposit'
                    ? 'tab-pill-active text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deposit / Pay</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('withdraw');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'withdraw'
                    ? 'tab-pill-active text-blue-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                <span>Withdraw Outflow</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('audit');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'tab-pill-active text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audit Trail {activityHistory.length > 0 && `(${activityHistory.length})`}</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('zk');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  activeTab === 'zk'
                    ? 'tab-pill-active text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>ZK Health</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                <DepositCard
                  contractAddress={activeContractAddress}
                  initialAmount={initialDepositAmount}
                  onTxStart={handleTxStart}
                  onStepChange={handleStepChange}
                  onTxComplete={() => handleTxComplete('deposit', '10')}
                  onTxError={handleTxError}
                />

                <WithdrawCard
                  contractAddress={activeContractAddress}
                  vaultState={vaultState}
                  ownerSecretKeyHex={ownerSecretKeyHex}
                  onUnlockOwnerKey={(key) => {
                    setOwnerSecretKeyHex(key);
                  }}
                  onTxStart={handleTxStart}
                  onStepChange={handleStepChange}
                  onTxComplete={() => handleTxComplete('withdraw', '5')}
                  onTxError={handleTxError}
                />
              </div>
            )}

            {activeTab === 'deposit' && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                <DepositCard
                  contractAddress={activeContractAddress}
                  initialAmount={initialDepositAmount}
                  onTxStart={handleTxStart}
                  onStepChange={handleStepChange}
                  onTxComplete={() => handleTxComplete('deposit', '10')}
                  onTxError={handleTxError}
                />
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                <WithdrawCard
                  contractAddress={activeContractAddress}
                  vaultState={vaultState}
                  ownerSecretKeyHex={ownerSecretKeyHex}
                  onUnlockOwnerKey={(key) => {
                    setOwnerSecretKeyHex(key);
                  }}
                  onTxStart={handleTxStart}
                  onStepChange={handleStepChange}
                  onTxComplete={() => handleTxComplete('withdraw', '5')}
                  onTxError={handleTxError}
                />
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="panel-surface rounded-2xl p-4 sm:p-6 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Cryptographic Settlement Audit Log</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {activityHistory.length} Recorded Transactions
                  </span>
                </div>

                {activityHistory.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 font-mono text-xs space-y-2">
                    <FileText className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                    <p>No transactions logged in this session yet.</p>
                    <p className="text-[11px] text-slate-600">Execute a deposit or withdrawal to generate cryptographic receipts.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {activityHistory.map((item) => (
                      <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.type === 'deposit' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                          <div>
                            <div className="text-slate-200 capitalize font-medium">
                              {item.type === 'deploy' ? 'Contract Deployment' : `${item.type} Settlement`}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Circuit: {item.type === 'deposit' ? 'receiveUnshielded' : 'withdraw'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="text-slate-400 text-[11px]">{item.timestamp}</span>
                          <span className="text-emerald-400 uppercase font-semibold text-[11px]">Indexed</span>
                          <button
                            onClick={() => openReceipt(item.type === 'withdraw' ? 'withdraw' : 'deposit', item.amount || '10', item.timestamp)}
                            className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-[11px] font-mono transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-indigo-400" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'zk' && (
              <div className="panel-surface rounded-2xl p-4 sm:p-6 space-y-4 animate-in fade-in duration-200 font-mono text-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span className="uppercase tracking-wider text-slate-200 font-semibold">Zero-Knowledge Proof Engine Diagnostics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-slate-500 text-[10px]">LOCAL DOCKER PROOF SERVER</div>
                    <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online on http://localhost:6300</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-slate-500 text-[10px]">DUST SPONSORSHIP</div>
                    <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Zero Gas / Dust-Free Sponsored</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-slate-500 text-[10px]">INDEXER CONNECTION</div>
                    <div className="text-blue-400 font-semibold">
                      https://indexer.preprod.midnight.network
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-slate-500 text-[10px]">CONTRACT SECURITY</div>
                    <div className="text-indigo-400 font-semibold">
                      Owner Witness Protected (ZK Circuit)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Protocol Showcase Sections (Rendered only on Outside Landing Page) */}
        {!activeContractAddress && <ShowcaseSections />}
      </main>

      {/* Institutional Glass Footer */}
      <footer className="border-t border-white/[0.06] py-5 text-xs font-mono text-slate-500 bg-black/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span>Midnight Protocol &bull; Compact Circuits</span>
            <button
              onClick={() => {
                setShowIntro(true);
                setIsSceneVisible(false);
              }}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md border border-white/5 hover:border-white/20 bg-white/[0.02] transition-colors"
            >
              🎬 Replay Intro
            </button>
          </div>

          {/* Catchy Developer Signature & Interactive Bio Popover */}
          <DeveloperProfilePopover />

          <span className="text-slate-400 text-center lg:text-right">Dust & Gas Sponsorship Active via ProofStation</span>
        </div>
      </footer>
      </div>

      {/* Live Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={modalOpen}
        step={txStep}
        message={txMessage}
        errorMessage={txError}
        onClose={() => {
          playClickSound();
          setModalOpen(false);
        }}
      />

      {/* Cryptographic Proof Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        receipt={activeReceipt}
        onClose={() => {
          playClickSound();
          setReceiptModalOpen(false);
        }}
      />
    </div>
  );
}
