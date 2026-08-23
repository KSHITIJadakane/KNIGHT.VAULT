import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  createUnprovenDeployTx,
  createUnprovenCallTx,
  submitTxAsync,
} from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import * as PaymentContractModule from '../../contract/src/managed/payment/contract/index.js';
import {
  ConnectedSession,
  fromHex,
  toHex,
} from './midnight';

export const PRIVATE_STATE_ID = 'midnight-payment-vault-state';
export const ZK_ASSET_PATH = '/zk/payment';

export type TxStep = 'idle' | 'preparing' | 'proving' | 'balancing' | 'submitting' | 'indexing' | 'success' | 'error';

export type PaymentVaultState = {
  balance: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  ownerHex: string;
};

// Compile contract handle with witnesses and ZK assets
export function makeCompiledContract(ownerSecretKey?: Uint8Array) {
  const witnesses = {
    ownerKey: (context: any) => {
      // During constructor: context.privateState is the initialPrivateState
      // During circuit calls: context.privateState is the stored private state
      const ps = context?.privateState ?? {};
      const secret = ps?.ownerSecretKey ?? ownerSecretKey ?? new Uint8Array(32);
      // Witness must return [newPrivateState, witnessReturnValue]
      return [ps, secret instanceof Uint8Array ? secret : new Uint8Array(Object.values(secret))];
    },
  };

  return CompiledContract.make('payment', PaymentContractModule.Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(ZK_ASSET_PATH),
  ) as any;
}

// Low-level deploy with progress tracking
export async function deployPayment(
  session: ConnectedSession,
  ownerKeyBytes?: Uint8Array,
  onStepChange?: (step: TxStep, message: string) => void,
): Promise<{ contractAddress: string; ownerSecretKeyHex: string }> {
  const ownerKey = ownerKeyBytes ?? crypto.getRandomValues(new Uint8Array(32));
  const ownerSecretKeyHex = toHex(ownerKey);

  onStepChange?.('preparing', 'Initializing ZK runtime modules...');

  // CRITICAL: Both WASM modules MUST be fully initialized before any compact-runtime calls.
  // ledger-v8 provides Transaction/ZswapChainState; onchain-runtime-v3 (via compact-runtime)
  // provides ContractState / contractstate_deserialize. Without this await, the WASM
  // functions are undefined and throw "Cannot read properties of undefined".
  await Promise.all([
    import('@midnight-ntwrk/ledger-v8'),
    import('@midnight-ntwrk/compact-runtime'),
  ]);

  onStepChange?.('preparing', 'Preparing deployment transaction and signing key...');

  // Pass ownerKey so the witness closure captures it for the constructor call
  const compiledContract = makeCompiledContract(ownerKey);
  const initialPrivateState = { ownerSecretKey: ownerKey };
  // sampleSigningKey must be called AFTER compact-runtime WASM is ready
  const { sampleSigningKey: ssk } = await import('@midnight-ntwrk/compact-runtime');
  const signingKey = ssk();

  onStepChange?.('proving', 'Generating Zero-Knowledge Proof with ProofStation...');
  let deployTxData: any;
  try {
    deployTxData = await (createUnprovenDeployTx as any)(
      {
        zkConfigProvider: session.providers.zkConfigProvider,
        walletProvider: session.providers.walletProvider,
      },
      {
        compiledContract,
        args: [],
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState,
        signingKey,
      },
    );
  } catch (err: any) {
    // Unwrap Effect.js / compact-runtime error chain for a readable message
    const msg = err?.cause?.message ?? err?.message ?? String(err);
    console.error('[deployPayment] createUnprovenDeployTx failed:', err);
    throw new Error(`Contract constructor failed: ${msg}`);
  }

  const contractAddress = deployTxData.public.contractAddress;

  onStepChange?.('submitting', 'Submitting contract deploy transaction to Midnight...');
  await (submitTxAsync as any)(
    {
      ...session.providers,
      proofProvider: session.providers.proofProvider,
    },
    {
      unprovenTx: deployTxData.private.unprovenTx,
    },
  );

  // Store private state & signing key
  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, initialPrivateState);
  await session.providers.privateStateProvider.setSigningKey(contractAddress, deployTxData.private.signingKey);

  onStepChange?.('indexing', 'Waiting for contract deployment confirmation on indexer...');
  const rawContractHex = toHex(deployTxData.public.initialContractState.serialize());
  (session.providers.publicDataProvider as any).setContractState?.(
    contractAddress,
    deployTxData.public.initialContractState,
  );
  saveSandboxState(contractAddress, {
    balance: 0n,
    totalDeposited: 0n,
    totalWithdrawn: 0n,
    ownerHex: toHex(ownerKey),
  }, rawContractHex);

  if (session.config?.isSandbox) {
    await new Promise((r) => setTimeout(r, 600));
  } else {
    try {
      // Poll indexer up to 15 attempts (30s)
      await pollForState(session.config.indexerUri, contractAddress, undefined, 15, 2000);
    } catch (indexErr) {
      console.warn('[deployPayment] Proceeding with on-chain deployed state while indexer catches up:', indexErr);
    }
  }

  onStepChange?.('success', `Vault deployed successfully at ${contractAddress.slice(0, 10)}...`);
  return { contractAddress, ownerSecretKeyHex };
}

// Store for sandbox demo mode instances with localStorage & server sync
const sandboxStateStore = new Map<string, PaymentVaultState>();

// Returns true only in local dev (Vite dev server has the /api/sandbox-state middleware)
function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
}

export function saveSandboxState(address: string, state: PaymentVaultState, rawContractStateHex?: string) {
  sandboxStateStore.set(address, state);
  const serialized = {
    balance: state.balance.toString(),
    totalDeposited: state.totalDeposited.toString(),
    totalWithdrawn: state.totalWithdrawn.toString(),
    ownerHex: state.ownerHex,
    rawContractStateHex: rawContractStateHex || (typeof localStorage !== 'undefined' ? localStorage.getItem('sb_contract_raw_' + address) || undefined : undefined),
  };
  try {
    localStorage.setItem('sb_vault_' + address, JSON.stringify(serialized));
    if (rawContractStateHex) {
      localStorage.setItem('sb_contract_raw_' + address, rawContractStateHex);
    }
  } catch {}
  // Broadcast to local dev server so PC and mobile sync in real-time (dev only)
  if (isLocalDev()) {
    try {
      fetch('/api/sandbox-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, state: serialized }),
      }).catch(() => {});
    } catch {}
  }
}

export async function fetchServerSandboxState(address: string): Promise<PaymentVaultState | null> {
  // The /api/sandbox-state endpoint only exists in local Vite dev server — skip on deployed site
  if (!isLocalDev()) return null;
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/sandbox-state/${address}`);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) return null;
      const data = await res.json();
      if (data && data.balance !== undefined) {
        const state: PaymentVaultState = {
          balance: BigInt(data.balance),
          totalDeposited: BigInt(data.totalDeposited),
          totalWithdrawn: BigInt(data.totalWithdrawn),
          ownerHex: data.ownerHex || '',
        };
        sandboxStateStore.set(address, state);
        if (data.rawContractStateHex) {
          try {
            localStorage.setItem('sb_contract_raw_' + address, data.rawContractStateHex);
            const { ContractState } = await import('@midnight-ntwrk/compact-runtime');
            const { setGlobalSandboxContractState } = await import('./midnight');
            setGlobalSandboxContractState(address, ContractState.deserialize(fromHex(data.rawContractStateHex)));
          } catch {}
        }
        return state;
      }
    }
  } catch {}
  return null;
}

export function getSandboxState(address: string): PaymentVaultState | null {
  if (sandboxStateStore.has(address)) return sandboxStateStore.get(address)!;
  try {
    const raw = localStorage.getItem('sb_vault_' + address);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state: PaymentVaultState = {
        balance: BigInt(parsed.balance),
        totalDeposited: BigInt(parsed.totalDeposited),
        totalWithdrawn: BigInt(parsed.totalWithdrawn),
        ownerHex: parsed.ownerHex,
      };
      sandboxStateStore.set(address, state);
      return state;
    }
  } catch {}
  return null;
}

// Deposit unshielded tNIGHT into the vault
export async function depositPayment(
  session: ConnectedSession,
  contractAddress: string,
  amountStars: bigint,
  onStepChange?: (step: TxStep, message: string) => void,
): Promise<string> {
  onStepChange?.('preparing', `Preparing deposit of ${starsToNight(amountStars)} tNIGHT...`);
  // Ensure both WASM runtimes are initialized before compact-runtime calls
  await Promise.all([
    import('@midnight-ntwrk/ledger-v8'),
    import('@midnight-ntwrk/compact-runtime'),
  ]);
  const compiledContract = makeCompiledContract();

  // Ensure private state and contract scope are initialized for the session provider
  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  const currentPs = await session.providers.privateStateProvider.get(PRIVATE_STATE_ID);
  if (!currentPs) {
    await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, { ownerSecretKey: new Uint8Array(32) });
  }

  onStepChange?.('proving', 'Building ZK proof for receiveUnshielded circuit...');
  const callTxData = await (createUnprovenCallTx as any)(session.providers, {
    compiledContract,
    contractAddress,
    circuitId: 'deposit',
    args: [amountStars],
    privateStateId: PRIVATE_STATE_ID,
  });

  onStepChange?.('submitting', 'Balancing fees & broadcasting transaction to Midnight...');
  const txId = await (submitTxAsync as any)(
    {
      ...session.providers,
      proofProvider: session.providers.proofProvider,
    },
    {
      unprovenTx: callTxData.private.unprovenTx,
      circuitId: 'deposit',
    },
  );

  onStepChange?.('indexing', 'Awaiting block finalization and indexer update...');
  if (callTxData.public?.nextContractState) {
    try {
      const current = await session.providers.publicDataProvider.queryContractState(contractAddress);
      if (current) {
        const { ChargedState } = await import('@midnight-ntwrk/compact-runtime');
        current.data = new ChargedState(callTxData.public.nextContractState);
        (session.providers.publicDataProvider as any).setContractState?.(contractAddress, current);
      }
    } catch {}
  }
  const prev = getSandboxState(contractAddress) ?? {
    balance: 0n,
    totalDeposited: 0n,
    totalWithdrawn: 0n,
    ownerHex: '',
  };
  saveSandboxState(contractAddress, {
    ...prev,
    balance: prev.balance + amountStars,
    totalDeposited: prev.totalDeposited + amountStars,
  });

  if (!session.config?.isSandbox) {
    try {
      await pollForState(session.config.indexerUri, contractAddress, undefined, 8, 1500);
    } catch (idxErr) {
      console.warn('[depositPayment] Indexer sync in progress:', idxErr);
    }
  } else {
    await new Promise((r) => setTimeout(r, 600));
  }
  return txId;
}

// Withdraw unshielded tNIGHT from the vault (Owner only with witness)
export async function withdrawPayment(
  session: ConnectedSession,
  contractAddress: string,
  amountStars: bigint,
  recipient: string | Uint8Array,
  ownerSecretKeyHex?: string,
  onStepChange?: (step: TxStep, message: string) => void,
): Promise<string> {
  onStepChange?.('preparing', `Authorizing withdrawal of ${starsToNight(amountStars)} tNIGHT...`);
  // Ensure both WASM runtimes are initialized before compact-runtime calls
  await Promise.all([
    import('@midnight-ntwrk/ledger-v8'),
    import('@midnight-ntwrk/compact-runtime'),
  ]);
  const compiledContract = makeCompiledContract(ownerSecretKeyHex ? fromHex(ownerSecretKeyHex) : undefined);

  let recipientBytes: Uint8Array;
  if (typeof recipient === 'string') {
    const clean = recipient.startsWith('0x') ? recipient.slice(2) : recipient;
    if (clean.length === 64) {
      recipientBytes = fromHex(clean);
    } else {
      recipientBytes = new TextEncoder().encode(recipient.padEnd(32, '\0')).slice(0, 32);
    }
  } else {
    recipientBytes = recipient;
  }

  // Set contract address scope and ensure owner key is loaded in private state
  await session.providers.privateStateProvider.setContractAddress(contractAddress);
  if (ownerSecretKeyHex) {
    const ownerBytes = fromHex(ownerSecretKeyHex);
    await session.providers.privateStateProvider.set(PRIVATE_STATE_ID, { ownerSecretKey: ownerBytes });
  }

  onStepChange?.('proving', 'Verifying owner key zero-knowledge proof...');
  const callTxData = await (createUnprovenCallTx as any)(session.providers, {
    compiledContract,
    contractAddress,
    circuitId: 'withdraw',
    args: [amountStars, { bytes: recipientBytes }],
    privateStateId: PRIVATE_STATE_ID,
  });

  onStepChange?.('submitting', 'Broadcasting withdrawal transaction to Midnight...');
  const txId = await (submitTxAsync as any)(
    {
      ...session.providers,
      proofProvider: session.providers.proofProvider,
    },
    {
      unprovenTx: callTxData.private.unprovenTx,
      circuitId: 'withdraw',
    },
  );

  onStepChange?.('indexing', 'Awaiting block finalization and indexer update...');
  if (callTxData.public?.nextContractState) {
    try {
      const current = await session.providers.publicDataProvider.queryContractState(contractAddress);
      if (current) {
        const { ChargedState } = await import('@midnight-ntwrk/compact-runtime');
        current.data = new ChargedState(callTxData.public.nextContractState);
        (session.providers.publicDataProvider as any).setContractState?.(contractAddress, current);
      }
    } catch {}
  }
  const prevW = getSandboxState(contractAddress) ?? {
    balance: 0n,
    totalDeposited: 0n,
    totalWithdrawn: 0n,
    ownerHex: '',
  };
  saveSandboxState(contractAddress, {
    ...prevW,
    balance: prevW.balance >= amountStars ? prevW.balance - amountStars : 0n,
    totalWithdrawn: prevW.totalWithdrawn + amountStars,
  });

  if (!session.config?.isSandbox) {
    try {
      await pollForState(session.config.indexerUri, contractAddress, undefined, 8, 1500);
    } catch (idxErr) {
      console.warn('[withdrawPayment] Indexer sync in progress:', idxErr);
    }
  } else {
    await new Promise((r) => setTimeout(r, 600));
  }
  return txId;
}

// Poll indexer for latest contract state
export async function pollForState(
  queryUrl: string,
  contractAddress: string,
  onAttempt?: (attempt: number) => void,
  maxAttempts = 20,
  intervalMs = 2000,
): Promise<string> {
  const cleanAddr = contractAddress.startsWith('0x') ? contractAddress.slice(2) : contractAddress;
  const hexAddr = '0x' + cleanAddr;

  for (let i = 0; i < maxAttempts; i++) {
    onAttempt?.(i + 1);
    try {
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

      if (res.ok) {
        const payload = await res.json();
        const state = payload.data?.contractAction?.state;
        if (state) return state;
      }
    } catch (e) {
      console.warn('[pollForState] attempt failed:', e);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`State for contract ${contractAddress} not indexed yet`);
}

// Decode raw contract state hex into ledger numbers and owner
export function decodePaymentState(stateHex: string): PaymentVaultState {
  const contractState = ContractState.deserialize(fromHex(stateHex));
  // Important: pass contractState.data (ChargedState) to PaymentContractModule.ledger()
  const ledger = PaymentContractModule.ledger(contractState.data as any);
  return {
    balance: ledger.balance as bigint,
    totalDeposited: ledger.totalDeposited as bigint,
    totalWithdrawn: ledger.totalWithdrawn as bigint,
    ownerHex: toHex(ledger.owner),
  };
}

// Unit conversion helpers: 1 NIGHT = 1,000,000 Stars
export function starsToNight(stars: bigint): string {
  const starsNumber = Number(stars) / 1_000_000;
  return starsNumber.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}

export function nightToStars(nightStr: string): bigint {
  const clean = nightStr.trim();
  if (!clean || isNaN(Number(clean))) return 0n;
  const parsed = parseFloat(clean);
  if (parsed <= 0) return 0n;
  return BigInt(Math.round(parsed * 1_000_000));
}
