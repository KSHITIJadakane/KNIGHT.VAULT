import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ConnectedSession,
  createConnectedSession,
  createSandboxWalletSession,
} from '../lib/midnight';

export type WalletContextType = {
  address: string | null;
  isConnected: boolean;
  walletType: '1am' | 'lace' | 'sandbox' | null;
  isConnecting: boolean;
  walletStatus: 'checking' | 'detected' | 'not-found';
  session: ConnectedSession | null;
  connect: (network?: string) => Promise<ConnectedSession | undefined>;
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

  // Poll for wallet injection on mount
  useEffect(() => {
    const startedAt = Date.now();
    const id = setInterval(() => {
      const midnight = (window as any).midnight;
      const w1am = midnight?.['1am'];
      const wLace = midnight?.mnLace ?? midnight?.lace ?? midnight?.['lace'];
      if (w1am) {
        setWalletType('1am');
        setWalletStatus('detected');
        clearInterval(id);
        return;
      }
      if (wLace) {
        setWalletType('lace');
        setWalletStatus('detected');
        clearInterval(id);
        return;
      }
      if (Date.now() - startedAt >= 4000) {
        setWalletStatus('not-found');
        clearInterval(id);
      }
    }, 300);
    return () => clearInterval(id);
  }, []);

  const connect = useCallback(async (network = 'preprod', explicitWallet?: '1am' | 'lace') => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const proofServerUri = `http://${host}:6300`;

      // Helper to find wallet in window
      const findWallet = () => {
        const midnight = (window as any).midnight;
        const cardano = (window as any).cardano;

        if (explicitWallet === '1am') {
          return { wallet: midnight?.['1am'], type: '1am' as const };
        }
        if (explicitWallet === 'lace') {
          const l = midnight?.mnLace ?? midnight?.lace ?? midnight?.['lace'] ?? cardano?.lace;
          return { wallet: l, type: 'lace' as const };
        }

        if (midnight?.['1am']) return { wallet: midnight['1am'], type: '1am' as const };
        const lace = midnight?.mnLace ?? midnight?.lace ?? midnight?.['lace'] ?? cardano?.lace;
        if (lace) return { wallet: lace, type: 'lace' as const };
        return { wallet: null, type: null };
      };

      // Poll briefly for 1.5 seconds if not yet injected
      let found = findWallet();
      if (!found.wallet) {
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 100));
          found = findWallet();
          if (found.wallet) break;
        }
      }

      const { wallet, type } = found;

      if (!wallet) {
        throw new Error(
          'No Midnight wallet extension detected. Please ensure 1AM Wallet or Lace is installed and unlocked, or use Demo Mode.'
        );
      }

      // Connect to the extension
      const api = typeof wallet.enable === 'function'
        ? await wallet.enable()
        : typeof wallet.connect === 'function'
        ? await wallet.connect(network)
        : wallet;

      const sess = await createConnectedSession(api, '/zk/payment', proofServerUri);
      setSession(sess);

      // Extract user unshielded address
      let userAddr = '';
      if (typeof api.getUnshieldedAddress === 'function') {
        const res = await api.getUnshieldedAddress();
        userAddr = res?.unshieldedAddress ?? (typeof res === 'string' ? res : '');
      } else if (typeof api.state === 'function') {
        const state = await api.state();
        userAddr = state?.unshieldedAddress ?? '';
      }

      setAddress(userAddr || 'mn_addr_preprod_connected');
      setWalletType(type || '1am');
      setIsConnected(true);
      return sess;
    } catch (err: any) {
      console.error('[WalletConnect] failed:', err);
      alert(err?.message || 'Failed to connect wallet');
    } finally {
      connectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const connectSandbox = useCallback(async () => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const proofServerUri = `http://${host}:6300`;
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

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}
