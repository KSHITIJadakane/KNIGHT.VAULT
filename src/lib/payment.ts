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
  LOCAL_PROOF_SERVER_URI,
} from './midnight';
import { ensureWasmReady, isProofServerReachable } from './wasm-init';

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
export async function deployPaymentContract(
  session: ConnectedSession,
  ownerSecretKey?: Uint8Array,
  onStepChange?: (step: TxStep, message: string) => void,
): Promise<{ contractAddress: string; ownerSecretKeyHex: string }> {
  // Generate random 32-byte owner key if not provided
  const ownerKey = ownerSecretKey || crypto.getRandomValues(new Uint8Array(32));
  const ownerSecretKeyHex = toHex(ownerKey);

  // In Sandbox Demo mode (e.g. Mobile Phones or browser test without Docker)
  if (session.config?.isSandbox) {
    onStepChange?.('preparing', 'Configuring Zero-Knowledge vault contract parameters...');
    await new Promise((r) => setTimeout(r, 450));

    onStepChange?.('proving', 'Generating initial deployment ZK proof...');
    await new Promise((r) => setTimeout(r, 650));

    onStepChange?.('submitting', 'Broadcasting zero-gas deployment to Midnight Network...');
    await new Promise((r) => setTimeout(r, 500));

    onStepChange?.('indexing', 'Awaiting block finalization and indexer registration...');
    const contractAddress = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    saveSandboxState(contractAddress, {
      balance: 0n,
      totalDeposited: 0n,
      totalWithdrawn: 0n,
      ownerHex: ownerSecretKeyHex,
    });

    await new Promise((r) => setTimeout(r, 400));
    onStepChange?.('success', `Vault deployed successfully at ${contractAddress.slice(0, 10)}...`);
    return { contractAddress, ownerSecretKeyHex };
  }

  onStepChange?.('preparing', 'Checking ZK runtime and proof server...');

  // Pre-flight: verify the proof server (Railway or localhost) is reachable.
  // Gives a clear, actionable error instead of a cryptic WASM crash.
  const proofServerUri = LOCAL_PROOF_SERVER_URI;
  const proofServerUp = await isProofServerReachable(proofServerUri);
  if (!proofServerUp) {
    const isRailway = !proofServerUri.includes('localhost') && !proofServerUri.includes('127.0.0.1');
    throw new Error(
      isRailway
        ? `Railway ZK Proof Server is unreachable.\nCheck that your Railway service is running at:\n${proofServerUri}`
        : 'Local ZK Proof Server is offline.\n\nRun: docker compose up -d\nThen retry from http://localhost:5173'
    );
  }

  // Ensure BOTH WASM runtimes are fully initialized before any compact-runtime call.
  // compact-runtime → onchain-runtime-v3 → contractstate_deserialize
  await ensureWasmReady();

  onStepChange?.('preparing', 'Preparing deployment transaction and signing key...');

  // Pass ownerKey so the witness closure captures it for the constructor call
  const compiledContract = makeCompiledContract(ownerKey);
  const initialPrivateState = { ownerSecretKey: ownerKey };
  // sampleSigningKey called AFTER WASM is guaranteed ready
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

  try {
    // Poll indexer up to 15 attempts (30s)
    await pollForState(session.config.indexerUri, contractAddress, undefined, 15, 2000);
  } catch (indexErr) {
    console.warn('[deployPayment] Proceeding with on-chain deployed state while indexer catches up:', indexErr);
  }

  onStepChange?.('success', `Vault deployed successfully at ${contractAddress.slice(0, 10)}...`);
  return { contractAddress, ownerSecretKeyHex };
}

export const deployPayment = deployPaymentContract;

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

  // In Sandbox / Demo Mode (e.g. Mobile Phones, QR Scans, Browser Demo):
  // Provide seamless, deterministic zero-gas transaction simulation with all realistic steps
  if (session.config?.isSandbox) {
    await new Promise((r) => setTimeout(r, 450));
    onStepChange?.('proving', 'Building ZK proof for receiveUnshielded circuit...');
    await new Promise((r) => setTimeout(r, 700));

    onStepChange?.('submitting', 'Balancing fees & broadcasting transaction to Midnight...');
    await new Promise((r) => setTimeout(r, 500));

    onStepChange?.('indexing', 'Awaiting block finalization and indexer update...');
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

    await new Promise((r) => setTimeout(r, 450));
    const mockTxId = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
    return mockTxId;
  }

  // Real 1AM / Lace on-chain transaction path
  // Ensure WASM runtimes are initialized before compact-runtime calls
  await ensureWasmReady();
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

  try {
    await pollForState(session.config.indexerUri, contractAddress, undefined, 8, 1500);
  } catch (idxErr) {
    console.warn('[depositPayment] Indexer sync in progress:', idxErr);
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

  // In Sandbox / Demo Mode:
  if (session.config?.isSandbox) {
    const prev = getSandboxState(contractAddress) ?? {
      balance: 0n,
      totalDeposited: 0n,
      totalWithdrawn: 0n,
      ownerHex: '',
    };

    if (prev.balance < amountStars) {
      throw new Error(`Insufficient vault balance. Vault has ${starsToNight(prev.balance)} tNIGHT, requested ${starsToNight(amountStars)} tNIGHT.`);
    }

    await new Promise((r) => setTimeout(r, 450));
    onStepChange?.('proving', 'Verifying secret witness and generating ZK proof...');
    await new Promise((r) => setTimeout(r, 700));

    onStepChange?.('submitting', 'Submitting shielded settlement transaction...');
    await new Promise((r) => setTimeout(r, 500));

    onStepChange?.('indexing', 'Finalizing payout and updating indexer...');
    saveSandboxState(contractAddress, {
      ...prev,
      balance: prev.balance - amountStars,
      totalWithdrawn: prev.totalWithdrawn + amountStars,
    });

    await new Promise((r) => setTimeout(r, 450));
    const mockTxId = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
    return mockTxId;
  }

  // Real 1AM / Lace on-chain transaction path
  // Ensure WASM runtimes are initialized before compact-runtime calls
  await ensureWasmReady();
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

  try {
    await pollForState(session.config.indexerUri, contractAddress, undefined, 8, 1500);
  } catch (idxErr) {
    console.warn('[withdrawPayment] Indexer sync in progress:', idxErr);
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
