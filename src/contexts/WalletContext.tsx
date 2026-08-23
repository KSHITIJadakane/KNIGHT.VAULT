import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ConnectedSession,
  createConnectedSession,
  createSandboxWalletSession,
  LOCAL_PROOF_SERVER_URI,
} from '../lib/midnight';

export type WalletContextType = {
  address: string | null;
  isConnected: boolean;
  walletType: '1am' | 'lace' | 'sandbox' | null;
  isConnecting: boolean;
  walletStatus: 'checking' | 'detected' | 'not-found';
  session: ConnectedSession | null;
  connect: (network?: string, explicitWallet?: '1am' | 'lace') => Promise<ConnectedSession | undefined>;
  connectSandbox: () => Promise<ConnectedSession | undefined>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState<'1am' | 'lace' | 'sandbox' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletStatus, setWalletStatus] = useState<'checking' | 'detected' | 'not-found'>('checking');
  const [session, setSession] = useState<ConnectedSession | null>(null);
  const connectingRef = useRef(false);

  // Helper to discover any Midnight-compatible wallet
  const getAvailableWallet = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    
    // 1. Check 1AM Wallet
    if (w.midnight?.['1am']) {
      return { wallet: w.midnight['1am'], type: '1am' as const };
    }
    
    // 2. Check Midnight Lace
    const mnLace = w.midnight?.mnLace ?? w.midnight?.lace ?? w.midnight?.['lace'];
    if (mnLace) {
      return { wallet: mnLace, type: 'lace' as const };
    }

    // 3. Check Multi-Chain Lace
    if (w.cardano?.lace) {
      return { wallet: w.cardano.lace, type: 'lace' as const };
    }

    return null;
  }, []);

  // Poll for wallet injection on mount
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const detected = getAvailableWallet();
      if (detected) {
        setWalletType(detected.type);
        setWalletStatus('detected');
        clearInterval(id);
        return;
      }
      if (Date.now() - startedAt >= 3000) {
        setWalletStatus('not-found');
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
  }, [getAvailableWallet]);

  const connect = useCallback(async (network = 'preprod', explicitWallet?: '1am' | 'lace') => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      // Use VITE_PROOF_SERVER_URI env var (Railway) or fallback to localhost:6300
      const proofServerUri = LOCAL_PROOF_SERVER_URI;

      // Poll up to 2 seconds for wallet injection if not yet ready
      let detected = getAvailableWallet();
      if (!detected) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 100));
          detected = getAvailableWallet();
          if (detected) break;
        }
      }

      if (!detected) {
        // Offer graceful transition to Sandbox Demo if no wallet extension is found
        const proceedWithDemo = confirm(
          'No Midnight Lace browser wallet extension detected.\n\nWould you like to connect in Instant Demo Mode (with ProofServer)?'
        );
        if (proceedWithDemo) {
          const sess = await createSandboxWalletSession('/zk/payment', proofServerUri);
          setSession(sess);
          setAddress(sess.unshieldedAddress);
          setWalletType('sandbox');
          setIsConnected(true);
          return sess;
        }
        return;
      }

      const { wallet, type } = detected;
      console.log(`[WalletConnect] Connecting to ${type} wallet...`);

      // Invoke DApp connector handshake
      let api: any = null;
      if (typeof wallet.enable === 'function') {
        api = await wallet.enable();
      } else if (typeof wallet.connect === 'function') {
        api = await wallet.connect(network);
      } else {
        api = wallet;
      }

      const sess = await createConnectedSession(api, '/zk/payment', proofServerUri);
      setSession(sess);

      // Extract user unshielded address
      let userAddr = '';
      try {
        if (typeof api.getUnshieldedAddress === 'function') {
          const res = await api.getUnshieldedAddress();
          userAddr = res?.unshieldedAddress ?? (typeof res === 'string' ? res : '');
        } else if (typeof api.state === 'function') {
          const state = await api.state();
          userAddr = state?.unshieldedAddress ?? '';
        } else if (typeof api.getUsedAddresses === 'function') {
          const addrs = await api.getUsedAddresses();
          userAddr = addrs?.[0] ?? '';
        }
      } catch (addrErr) {
        console.warn('[WalletConnect] Address extraction warning:', addrErr);
      }

      setAddress(userAddr || 'mn_addr_preprod_connected');
      setWalletType(type);
      setIsConnected(true);
      return sess;
    } catch (err: any) {
      console.error('[WalletConnect] connection error:', err);
      // Suppress noisy internal Lace channel closing alerts
      if (!err?.message?.includes('feature-flags')) {
        alert(err?.message || 'Wallet connection cancelled or rejected.');
      }
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, [getAvailableWallet]);

  const connectSandbox = useCallback(async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      // Use VITE_PROOF_SERVER_URI env var (Railway) or fallback to localhost:6300
      const proofServerUri = LOCAL_PROOF_SERVER_URI;
      const sess = await createSandboxWalletSession('/zk/payment', proofServerUri);
      setSession(sess);
      setAddress(sess.unshieldedAddress);
      setWalletType('sandbox');
      setIsConnected(true);
      return sess;
    } catch (err: any) {
      console.error('[connectSandbox] failed:', err);
      alert(err?.message || 'Failed to initialize sandbox wallet');
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setSession(null);
    setWalletStatus('checking');
    setWalletType(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        walletType,
        isConnecting,
        walletStatus,
        session,
        connect,
        connectSandbox,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
