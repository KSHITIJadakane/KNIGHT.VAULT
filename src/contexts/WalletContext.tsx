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
      const w1am = (window as any).midnight?.['1am'];
      const wLace = (window as any).midnight?.mnLace;
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

  const connect = useCallback(async (network = 'preprod') => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setIsConnecting(true);
    try {
      const wallet = (window as any).midnight?.['1am'] ?? (window as any).midnight?.mnLace;
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const proofServerUri = `http://${host}:6300`;

      if (!wallet) {
        // Automatically switch to sandbox session if no browser extension is installed (e.g. mobile)
        console.log('[WalletConnect] No extension found, connecting in Sandbox Demo mode with proof server:', proofServerUri);
        const sess = await createSandboxWalletSession('/zk/payment', proofServerUri);
        setSession(sess);
        setAddress(sess.unshieldedAddress);
        setWalletType('sandbox');
        setIsConnected(true);
        return sess;
      }
      const api = await wallet.connect(network);
      const sess = await createConnectedSession(api, '/zk/payment', proofServerUri);
      setSession(sess);
      setAddress((await api.getUnshieldedAddress()).unshieldedAddress);
      setWalletType((window as any).midnight?.['1am'] ? '1am' : 'lace');
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
