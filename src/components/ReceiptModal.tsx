import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Check, Copy, Printer, X, Download, Lock, ExternalLink } from 'lucide-react';
import { playClickSound } from '../lib/sound';

export type ReceiptData = {
  txId: string;
  type: 'deposit' | 'withdraw';
  amountNight: string;
  contractAddress: string;
  recipientOrSender?: string;
  timestamp: string;
  blockHeight?: number;
  circuit: string;
};

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
};

export default function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (receipt) {
      const payload = JSON.stringify({
        protocol: 'Midnight-ZK-Settlement',
        txId: receipt.txId,
        contract: receipt.contractAddress,
        type: receipt.type,
        amount: receipt.amountNight,
        circuit: receipt.circuit,
        time: receipt.timestamp,
      });
      QRCode.toDataURL(payload, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#f8fafc',
        },
      }).then(setQrDataUrl);
    }
  }, [receipt]);

  if (!isOpen || !receipt) return null;

  const handleCopy = () => {
    playClickSound();
    const summary = `🧾 Midnight ZK Settlement Receipt\nType: ${receipt.type.toUpperCase()}\nAmount: ${receipt.amountNight} tNIGHT\nTx Hash: ${receipt.txId}\nContract: ${receipt.contractAddress}\nCircuit: ${receipt.circuit}\nTimestamp: ${receipt.timestamp}\nStatus: Confirmed On-Chain (Zero Gas Sponsored)`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="panel-surface rounded-2xl w-full max-w-lg overflow-hidden border border-white/[0.12] shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-100">Cryptographic Settlement Receipt</h3>
              <p className="text-[11px] text-slate-400 font-mono">Zero-Knowledge Validated Proof</p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#090c12]/90 font-mono text-xs">
          {/* Top Amount Banner */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06]">
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {receipt.type === 'deposit' ? 'Inflow Deposit' : 'Outflow Withdrawal'}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-100 my-1">
              {receipt.amountNight} <span className="text-emerald-400 text-base">tNIGHT</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Confirmed & Finalized</span>
            </div>
          </div>

          {/* QR Verification and Details */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            {qrDataUrl && (
              <div className="p-2 bg-white rounded-lg shadow-md flex-shrink-0">
                <img src={qrDataUrl} alt="Receipt QR" className="w-24 h-24 sm:w-28 sm:h-28" />
              </div>
            )}
            <div className="space-y-2 w-full text-[11px]">
              <div>
                <div className="text-slate-500 text-[10px]">TIMESTAMP</div>
                <div className="text-slate-200">{receipt.timestamp}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">CIRCUIT ACTION</div>
                <div className="text-emerald-300 font-medium">{receipt.circuit}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">NETWORK FEE (DUST)</div>
                <div className="text-slate-300">0.000000 (Sponsored by Midnight)</div>
              </div>
            </div>
          </div>

          {/* Cryptographic Hashes */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
              <div className="text-slate-500 text-[10px] mb-0.5">TRANSACTION PROOF HASH</div>
              <div className="text-slate-300 break-all text-[11px] font-mono select-all">
                {receipt.txId}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
              <div className="text-slate-500 text-[10px] mb-0.5">CONTRACT VAULT ADDRESS</div>
              <div className="text-slate-300 break-all text-[11px] font-mono select-all">
                {receipt.contractAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 px-3 rounded-lg bg-[#18202e] hover:bg-[#202b3d] border border-white/[0.08] text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied Receipt' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
