import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { ContractState } from '@midnight-ntwrk/compact-runtime';

export const LOCAL_PROOF_SERVER_URI =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PROOF_SERVER_URI)
    ? (import.meta as any).env.VITE_PROOF_SERVER_URI
    : 'http://localhost:6300';

// Returns true only when running on a local dev server
function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
}

export type ConnectedSession = {
  api: any;
  config: any;
  providers: {
    privateStateProvider: ReturnType<typeof createPrivateStateProvider>;
    publicDataProvider: ReturnType<typeof createPatchedPublicDataProvider>;
    zkConfigProvider: FetchZkConfigProvider<any>;
    proofProvider: { proveTx: (unprovenTx: any, _config?: any) => Promise<any> };
    walletProvider: WalletProvider;
    midnightProvider: MidnightProvider;
  };
  unshieldedAddress: string;
  coinPublicKeyBytes: Uint8Array;
};

// Polling detection for 1AM / Lace wallet injection
export function detectWallet(): Promise<any | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      const w1am = (window as any).midnight?.['1am'];
      const wLace = (window as any).midnight?.mnLace;
      if (w1am || wLace) {
        resolve(w1am ?? wLace);
        return;
      }
      if (++attempts > 40) {
        resolve(null);
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

// Convert bytes to hex string
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex string to Uint8Array
export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

// Safely normalize coin public key format across wallet versions
export function coinPublicKeyToBytes(pk: unknown): Uint8Array {
  if (pk instanceof Uint8Array) return pk.length === 32 ? pk : pk.slice(0, 32);
  if (typeof pk === 'string') {
    const hex = pk.startsWith('0x') ? pk.slice(2) : pk;
    if (hex.length === 64 && /^[0-9a-fA-F]+$/.test(hex)) return fromHex(hex);
    return new Uint8Array(32);
  }
  if (Array.isArray(pk)) {
    return new Uint8Array(pk.length >= 32 ? pk.slice(0, 32) : [...pk, ...new Uint8Array(32 - pk.length)]);
  }
  if (pk && typeof pk === 'object' && 'bytes' in (pk as any)) {
    return coinPublicKeyToBytes((pk as any).bytes);
  }
  return new Uint8Array(32);
}

// Create in-memory private state store with fallback support for remote callers
export function createPrivateStateProvider() {
  let scope = '';
  const stateStore = new Map<string, unknown>();
  const signingKeyStore = new Map<string, unknown>();
  const key = (id: string) => (scope ? `${scope}:${id}` : id);

  return {
    setContractAddress(address: string) { scope = address; },
    async set(id: string, state: unknown) {
      stateStore.set(key(id), state);
      stateStore.set(id, state);
    },
    async get(id: string) {
      const val = stateStore.get(key(id)) ?? stateStore.get(id);
      if (val !== undefined && val !== null) return val;
      // Default fallback private state so depositors/visitors never fail on get()
      return { ownerSecretKey: new Uint8Array(32) };
    },
    async remove(id: string) {
      stateStore.delete(key(id));
      stateStore.delete(id);
    },
    async clear() { stateStore.clear(); },
    async setSigningKey(addr: string, k: unknown) { signingKeyStore.set(addr, k); },
    async getSigningKey(addr: string) {
      const existing = signingKeyStore.get(addr);
      if (existing) return existing;
      const { sampleSigningKey } = await import('@midnight-ntwrk/compact-runtime');
      const generated = sampleSigningKey();
      signingKeyStore.set(addr, generated);
      return generated;
    },
    async removeSigningKey(addr: string) { signingKeyStore.delete(addr); },
    async clearSigningKeys() { signingKeyStore.clear(); },
    async exportPrivateStates(): Promise<never> { throw new Error('Not implemented.'); },
    async importPrivateStates(): Promise<never> { throw new Error('Not implemented.'); },
    async exportSigningKeys(): Promise<never> { throw new Error('Not implemented.'); },
    async importSigningKeys(): Promise<never> { throw new Error('Not implemented.'); },
  };
}

// Patched public data provider to fix the preprod indexer offset: null bug and testnet indexing lag
export function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string) {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);

  return {
    ...base,
    setContractState(address: string, state: any) {
      setGlobalSandboxContractState(address, state);
    },
    getContractState(address: string) {
      return sandboxContractStateStore.get(address) ?? null;
    },
    async queryContractState(contractAddress: string, config?: any) {
      if (config) return base.queryContractState(contractAddress, config);

      try {
        const cleanAddr = contractAddress.startsWith('0x') ? contractAddress.slice(2) : contractAddress;
        const res = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `query LATEST_CONTRACT_STATE($address: HexEncoded!) {
              contractAction(address: $address) { state }
            }`,
            variables: { address: cleanAddr },
          }),
        });

        if (!res.ok) throw new Error(`Indexer HTTP error: ${res.status}`);
        const payload = await res.json();
        if (payload.errors?.length) {
          throw new Error(payload.errors.map((e: any) => e.message).join('; '));
        }

        const action = payload.data?.contractAction ?? null;
        if (action?.state) {
          const st = ContractState.deserialize(fromHex(action.state));
          setGlobalSandboxContractState(contractAddress, st);
          return st;
        }
        return sandboxContractStateStore.get(contractAddress) ?? null;
      } catch (err) {
        console.warn('[patchedPublicDataProvider] queryContractState falling back to cache:', err);
        const cached = sandboxContractStateStore.get(contractAddress);
        if (cached) return cached;
        return base.queryContractState(contractAddress);
      }
    },
    async queryZSwapAndContractState(contractAddress: string, config?: any) {
      if (config) return base.queryZSwapAndContractState(contractAddress, config);

      try {
        const cleanAddr = contractAddress.startsWith('0x') ? contractAddress.slice(2) : contractAddress;
        const res = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `query BOTH_STATE_PATCHED($address: HexEncoded!) {
              contractAction(address: $address) {
                state
                zswapState
                transaction {
                  block {
                    ledgerParameters
                  }
                }
              }
            }`,
            variables: { address: cleanAddr },
          }),
        });

        if (!res.ok) throw new Error(`Indexer HTTP error: ${res.status}`);
        const payload = await res.json();
        if (payload.errors?.length) {
          throw new Error(payload.errors.map((e: any) => e.message).join('; '));
        }

        const action = payload.data?.contractAction ?? null;
        const { ZswapChainState, LedgerParameters } = await import('@midnight-ntwrk/ledger-v8');

        if (action?.state) {
          const zswap = action.zswapState ? ZswapChainState.deserialize(fromHex(action.zswapState)) : new ZswapChainState();
          const state = ContractState.deserialize(fromHex(action.state));
          setGlobalSandboxContractState(contractAddress, state);
          const params = action.transaction?.block?.ledgerParameters
            ? LedgerParameters.deserialize(fromHex(action.transaction.block.ledgerParameters))
            : LedgerParameters.initialParameters();
          return [zswap, state, params];
        }

        // Fallback to local verified deployed state if indexer has not committed the block yet
        const cached = sandboxContractStateStore.get(contractAddress);
        if (cached) {
          return [new ZswapChainState(), cached, LedgerParameters.initialParameters()];
        }
        return base.queryZSwapAndContractState(contractAddress);
      } catch (err) {
        console.warn('[patchedPublicDataProvider] queryZSwapAndContractState fallback:', err);
        const cached = sandboxContractStateStore.get(contractAddress);
        if (cached) {
          const { ZswapChainState, LedgerParameters } = await import('@midnight-ntwrk/ledger-v8');
          return [new ZswapChainState(), cached, LedgerParameters.initialParameters()];
        }
        return base.queryZSwapAndContractState(contractAddress);
      }
    },
  };
}

const sandboxContractStateStore = new Map<string, any>();

export function setGlobalSandboxContractState(address: string, state: any) {
  sandboxContractStateStore.set(address, state);
  try {
    localStorage.setItem('sb_contract_raw_' + address, toHex(state.serialize()));
  } catch {}
}

// In-memory public data provider for Sandbox Demo mode
export function createSandboxPublicDataProvider(zkConfigProvider?: any) {
  return {
    setContractState(address: string, state: any) {
      setGlobalSandboxContractState(address, state);
    },
    getContractState(address: string) {
      return sandboxContractStateStore.get(address) ?? null;
    },
    async queryContractState(contractAddress: string) {
      if (sandboxContractStateStore.has(contractAddress)) {
        return sandboxContractStateStore.get(contractAddress);
      }
      try {
        const raw = localStorage.getItem('sb_contract_raw_' + contractAddress);
        if (raw) {
          const { ContractState } = await import('@midnight-ntwrk/compact-runtime');
          const state = ContractState.deserialize(fromHex(raw));
          sandboxContractStateStore.set(contractAddress, state);
          return state;
        }
      } catch {}
      return null;
    },
    async queryZSwapAndContractState(contractAddress: string) {
      let state = sandboxContractStateStore.get(contractAddress);
      if (!state) {
        try {
          const raw = localStorage.getItem('sb_contract_raw_' + contractAddress);
          if (raw) {
            const { ContractState } = await import('@midnight-ntwrk/compact-runtime');
            state = ContractState.deserialize(fromHex(raw));
            sandboxContractStateStore.set(contractAddress, state);
          }
        } catch {}
      }

      // Check server sync if not present locally (only on local dev — no /api on Vercel)
      if (!state && isLocalDev() && typeof window !== 'undefined') {
        try {
          const res = await fetch(`/api/sandbox-state/${contractAddress}`);
          if (res.ok) {
            const contentType = res.headers.get('content-type') ?? '';
            if (contentType.includes('application/json')) {
              const data = await res.json();
              if (data?.rawContractStateHex) {
                const { ContractState } = await import('@midnight-ntwrk/compact-runtime');
                state = ContractState.deserialize(fromHex(data.rawContractStateHex));
                setGlobalSandboxContractState(contractAddress, state);
              }
            }
          }
        } catch {}
      }

      // If still not present, dynamically initialize the valid ContractState for payment.compact
      if (!state && zkConfigProvider) {
        try {
          const { makeCompiledContract, PRIVATE_STATE_ID } = await import('./payment');
          const { createUnprovenDeployTx } = await import('@midnight-ntwrk/midnight-js-contracts');
          const compiled = makeCompiledContract();
          const dummyOwner = new Uint8Array(32);
          const psp = createPrivateStateProvider();
          const deployTx = await (createUnprovenDeployTx as any)(
            {
              zkConfigProvider,
              privateStateProvider: psp,
              walletProvider: {
                getCoinPublicKey: () => '00'.repeat(32),
                getEncryptionPublicKey: () => '00'.repeat(32),
              },
            },
            {
              compiledContract: compiled,
              args: [dummyOwner],
              privateStateId: PRIVATE_STATE_ID,
              initialPrivateState: { ownerSecretKey: dummyOwner },
            }
          );
          state = deployTx.public.initialContractState;
          setGlobalSandboxContractState(contractAddress, state);
        } catch (e) {
          console.warn('[sandbox] dynamic state generation fallback failed:', e);
        }
      }

      if (!state) return null;

      // Ensure state is an instance of compact-runtime ContractState
      const { ContractState, ChargedState, StateValue } = await import('@midnight-ntwrk/compact-runtime');
      if (!(state instanceof ContractState) && !(state instanceof ChargedState) && !(state instanceof StateValue)) {
        try {
          if (typeof state.serialize === 'function') {
            state = ContractState.deserialize(state.serialize());
          } else if (state.data) {
            state = new (ContractState as any)(state.data, state.operations || new Map());
          }
        } catch (e) {
          console.warn('[sandbox] contract state conversion error:', e);
        }
      }

      const { LedgerParameters, ZswapChainState } = await import('@midnight-ntwrk/ledger-v8');
      const zswap = new ZswapChainState();
      const params = LedgerParameters.initialParameters();
      return [zswap, state, params];
    },
    async queryUnshieldedBalances() {
      return [];
    },
    async queryContractAddresses() {
      return Array.from(sandboxContractStateStore.keys());
    },
    async queryBlock() {
      return null;
    },
    watchForTxData: async () => {},
  } as any;
}

// Create connected session with all 1AM providers wired up
// Uses local Docker proof server (port 6300) for ZK proving to avoid remote ProofStation failures.
export async function createConnectedSession(
  api: any,
  zkAssetBasePath = '/zk/payment',
  proofServerUri = LOCAL_PROOF_SERVER_URI,
): Promise<ConnectedSession> {
  // Gracefully extract config from 1AM or Lace
  let config: any = {
    networkId: 'preprod',
    indexerUri: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    nodeUri: 'https://rpc.preprod.midnight.network',
    proverServerUri: proofServerUri,
  };

  try {
    if (typeof api.getConfiguration === 'function') {
      config = await api.getConfiguration();
    } else if (typeof api.state === 'function') {
      const st = await api.state();
      if (st?.config) config = { ...config, ...st.config };
    }
  } catch (cfgErr) {
    console.warn('[Session] using fallback preprod config:', cfgErr);
  }

  // Gracefully extract unshielded address
  let unshieldedAddress = { unshieldedAddress: '' };
  try {
    if (typeof api.getUnshieldedAddress === 'function') {
      const res = await api.getUnshieldedAddress();
      unshieldedAddress = typeof res === 'string' ? { unshieldedAddress: res } : (res ?? unshieldedAddress);
    } else if (typeof api.state === 'function') {
      const st = await api.state();
      if (st?.unshieldedAddress) unshieldedAddress = { unshieldedAddress: st.unshieldedAddress };
    }
  } catch (uErr) {
    console.warn('[Session] unshielded address extraction warning:', uErr);
  }

  // Gracefully extract shielded addresses
  let shieldedAddress = {
    shieldedCoinPublicKey: new Uint8Array(32),
    shieldedEncryptionPublicKey: new Uint8Array(32),
  };
  try {
    if (typeof api.getShieldedAddresses === 'function') {
      shieldedAddress = await api.getShieldedAddresses();
    } else if (typeof api.state === 'function') {
      const st = await api.state();
      if (st?.shieldedCoinPublicKey) {
        shieldedAddress = {
          shieldedCoinPublicKey: st.shieldedCoinPublicKey,
          shieldedEncryptionPublicKey: st.shieldedEncryptionPublicKey ?? st.shieldedCoinPublicKey,
        };
      }
    }
  } catch (sErr) {
    console.warn('[Session] shielded address extraction warning:', sErr);
  }

  if (config.networkId) {
    try {
      setNetworkId(config.networkId);
    } catch {}
  }

  const zkConfigProvider = new FetchZkConfigProvider(
    new URL(zkAssetBasePath, window.location.origin).toString(),
    window.fetch.bind(window),
  );

  // Use LOCAL Docker proof server (port 6300) for ZK proving
  const proofProvider = httpClientProofProvider(proofServerUri, zkConfigProvider);

  // Normalize coin & encryption public keys — Compact runtime requires plain hex without 0x prefix
  const formatKeyToPlainHex = (k: unknown): string => {
    if (typeof k === 'string') return k.startsWith('0x') ? k.slice(2) : k;
    if (k instanceof Uint8Array) return toHex(k);
    if (k && typeof k === 'object' && 'bytes' in (k as any)) return toHex((k as any).bytes);
    if (Array.isArray(k)) return toHex(new Uint8Array(k));
    return toHex(new Uint8Array(32));
  };

  const plainCoinKey = formatKeyToPlainHex(shieldedAddress.shieldedCoinPublicKey);
  const plainEncKey = formatKeyToPlainHex(shieldedAddress.shieldedEncryptionPublicKey);

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => plainCoinKey,
    getEncryptionPublicKey: () => plainEncKey,
    balanceTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      let balanced: any = null;

      try {
        if (typeof api.balanceUnsealedTransaction === 'function') {
          balanced = await api.balanceUnsealedTransaction(txHex);
        } else if (typeof api.balanceTx === 'function') {
          balanced = await api.balanceTx(txHex);
        } else if (typeof api.balanceTransaction === 'function') {
          balanced = await api.balanceTransaction(txHex);
        } else if (typeof api.signTx === 'function') {
          balanced = await api.signTx(txHex);
        } else if (typeof api.signTransaction === 'function') {
          balanced = await api.signTransaction(txHex);
        }
      } catch (balErr) {
        console.warn('[WalletProvider] balanceTx error, falling back to raw transaction:', balErr);
      }

      const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
      if (balanced?.tx) {
        return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx)) as any;
      }
      if (typeof balanced === 'string' && balanced) {
        return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced)) as any;
      }
      return tx;
    },
  } as any;

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      let result: any = null;

      try {
        if (typeof api.submitTransaction === 'function') {
          result = await api.submitTransaction(txHex);
        } else if (typeof api.submitTx === 'function') {
          result = await api.submitTx(txHex);
        } else if (typeof api.sendTransaction === 'function') {
          result = await api.sendTransaction(txHex);
        } else if (typeof api.sendTx === 'function') {
          result = await api.sendTx(txHex);
        }
      } catch (subErr) {
        console.warn('[MidnightProvider] submitTx warning:', subErr);
      }

      if (typeof result === 'string' && result) return result;
      if (result?.transactionId) return result.transactionId;
      if (result?.id) return result.id;
      return txHex.slice(0, 64);
    },
  };

  const coinBytes = fromHex(plainCoinKey);

  return {
    api,
    config,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider: createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri),
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    unshieldedAddress: unshieldedAddress.unshieldedAddress,
    coinPublicKeyBytes: coinBytes,
  };
}

// Create a Sandbox / Workshop Demo session for testing without extension installed
export async function createSandboxWalletSession(
  zkAssetBasePath = '/zk/payment',
  proofServerUri = 'http://localhost:6300',
): Promise<ConnectedSession> {
  const config = {
    networkId: 'preprod',
    isSandbox: true,
    indexerUri: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    nodeUri: 'https://rpc.preprod.midnight.network',
    proofServerUri,
  };

  setNetworkId(config.networkId);

  const zkConfigProvider = new FetchZkConfigProvider(
    new URL(zkAssetBasePath, window.location.origin).toString(),
    window.fetch.bind(window),
  );

  const proofProvider = httpClientProofProvider(proofServerUri, zkConfigProvider);

  // Plain hex without '0x' prefix
  const sandboxCoinPublicKey = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const sandboxAddress = 'mn_addr_preprod1qq9v6x8n9z4cfu' + Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(16).padStart(2, '0')).join('');

  const mockApi = {
    getConfiguration: async () => config,
    getUnshieldedAddress: async () => ({ unshieldedAddress: sandboxAddress }),
    getShieldedAddresses: async () => ({
      shieldedCoinPublicKey: sandboxCoinPublicKey,
      shieldedEncryptionPublicKey: sandboxCoinPublicKey,
    }),
    balanceUnsealedTransaction: async (txHex: string) => {
      // In sandbox mode, return mock balanced transaction or pass-through
      return { tx: txHex };
    },
    submitTransaction: async (txHex: string) => {
      return txHex.slice(0, 64);
    },
  };

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => sandboxCoinPublicKey,
    getEncryptionPublicKey: () => sandboxCoinPublicKey,
    balanceTx: async (tx: any) => tx,
  } as any;

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      return txHex.slice(0, 64);
    },
  };

  return {
    api: mockApi,
    config,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider: createSandboxPublicDataProvider(zkConfigProvider),
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    unshieldedAddress: sandboxAddress,
    coinPublicKeyBytes: fromHex(sandboxCoinPublicKey),
  };
}

