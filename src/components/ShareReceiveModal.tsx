import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Copy, Check, Download, Share2, Sparkles, ArrowLeft } from 'lucide-react';

interface ShareReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
}

export default function ShareReceiveModal({
  isOpen,
  onClose,
  contractAddress,
}: ShareReceiveModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [qrMode, setQrMode] = useState<'link' | 'address'>('link');
  const [useLanIp, setUseLanIp] = useState(true);
  const [lanIp, setLanIp] = useState('192.168.1.5');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate deep payment link
  const paymentLink = (() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    let targetOrigin = origin;
    if (useLanIp && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      targetOrigin = `${window.location.protocol}//${lanIp}:${window.location.port || '5173'}`;
    }
    const params = new URLSearchParams();
    params.set('vault', contractAddress);
    if (amount && Number(amount) > 0) {
      params.set('amount', amount);
    }
    return `${targetOrigin}/?${params.toString()}`;
  })();

  // Determine what data to encode in QR
  const qrData = qrMode === 'link' ? paymentLink : contractAddress;

  // Re-render QR code whenever address, amount, or mode changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !contractAddress) return;

    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: 190,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) console.error('Error generating QR code:', err);
      },
    );
  }, [isOpen, contractAddress, amount, paymentLink, qrData]);

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `vault-qr-${contractAddress.slice(0, 8)}.png`;
    a.href = url;
    a.click();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#12161f] border border-[#262f3f] rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden my-auto"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#12161f]/95 backdrop-blur-md px-5 py-3.5 border-b border-[#212836] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Receive Vault Payments</h3>
              <p className="text-[11px] font-mono text-slate-400">Share QR code or payment link</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] border border-transparent hover:border-[#2d3748] transition-colors text-xs font-mono"
            title="Close (Esc)"
          >
            <span>Close</span>
            <X className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* QR Mode Switcher */}
          <div className="flex p-1 bg-[#181d26] rounded-lg border border-[#262f3f] text-xs font-mono">
            <button
              type="button"
              onClick={() => setQrMode('link')}
              className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                qrMode === 'link'
                  ? 'bg-emerald-600/30 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌐 Web Pay Link (Browser)
            </button>
            <button
              type="button"
              onClick={() => setQrMode('address')}
              className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                qrMode === 'address'
                  ? 'bg-emerald-600/30 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📋 Raw Address (Wallet)
            </button>
          </div>

          {/* Network IP selector when in link mode */}
          {qrMode === 'link' && (
            <div className="p-2.5 rounded-lg bg-[#181d26] border border-[#262f3f] space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Mobile Wi-Fi IP</span>
                <button
                  type="button"
                  onClick={() => setUseLanIp(!useLanIp)}
                  className={`text-[11px] px-2 py-0.5 rounded ${useLanIp ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#202734] text-slate-400'}`}
                >
                  {useLanIp ? '✓ LAN IP Enabled' : 'Use Localhost'}
                </button>
              </div>
              {useLanIp && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Host:</span>
                  <input
                    type="text"
                    value={lanIp}
                    onChange={(e) => setLanIp(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-[#10141b] border border-[#2d3748] text-xs font-mono text-slate-200"
                    placeholder="192.168.1.5"
                  />
                  <span className="text-slate-400 text-[11px]">:5173</span>
                </div>
              )}
            </div>
          )}

          {/* QR Display Card */}
          <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="p-2.5 bg-white rounded-xl shadow-lg">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <div className="text-center">
              <p className="text-[11px] font-mono text-slate-400">
                {qrMode === 'link' ? 'Scans as clickable web link on mobile camera' : 'Scans as raw 64-char address'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={downloadQR}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1a202c] hover:bg-[#252e3e] border border-[#2d3748] text-xs font-mono text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>

          {/* Optional Invoice Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <label htmlFor="qr-amount">Request Specific Amount (Optional)</label>
              {amount && <span className="text-emerald-400">{amount} tNIGHT Invoice</span>}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="qr-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#181d26] border border-[#262f3f] focus:outline-none focus:border-emerald-500 text-sm font-mono text-slate-100 placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex gap-1">
                {['10', '50', '100'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                      amount === preset
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#181d26] border-[#262f3f] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Copy Vault Address */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Vault Contract Address
            </label>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#181d26] border border-[#262f3f]">
              <span className="flex-1 font-mono text-xs text-slate-300 truncate">
                {contractAddress}
              </span>
              <button
                onClick={copyAddress}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202734] hover:bg-[#2c3648] text-xs font-mono text-slate-200 transition-colors flex-shrink-0"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAddr ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Copy Shareable Payment Link */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Shareable Payment Link</span>
              <span className="text-emerald-400 flex items-center gap-1 normal-case text-[10px]">
                <Sparkles className="w-3 h-3" /> Auto-opens deposit card
              </span>
            </label>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#181d26] border border-[#262f3f]">
              <span className="flex-1 font-mono text-xs text-emerald-400 truncate">
                {paymentLink}
              </span>
              <button
                onClick={copyPaymentLink}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors flex-shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Footer with Clear Back Button */}
        <div className="sticky bottom-0 z-10 bg-[#12161f]/95 backdrop-blur-md px-5 py-3 border-t border-[#212836] flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1e2430] hover:bg-[#283142] text-xs font-mono text-slate-200 transition-colors border border-[#2d3648] shadow-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vault Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
