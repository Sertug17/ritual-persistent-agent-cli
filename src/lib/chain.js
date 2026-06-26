// Chain and RPC utilities

import crypto from "node:crypto";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseEther,
  formatEther,
  hexToBigInt,
  getAddress,
  isAddress,
  keccak256,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { RITUAL_CHAIN } from "./contracts.js";

// Define Ritual chain for viem
const ritualViemChain = defineChain({
  id: RITUAL_CHAIN.id,
  name: RITUAL_CHAIN.name,
  nativeCurrency: RITUAL_CHAIN.nativeCurrency,
  rpcUrls: {
    default: { http: [RITUAL_CHAIN.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: RITUAL_CHAIN.explorerUrl },
  },
});

/**
 * Create a public client (read-only)
 */
export function createPublic() {
  return createPublicClient({
    chain: ritualViemChain,
    transport: http(),
  });
}

/**
 * Create a wallet client from private key
 * @param {string} privateKey - Hex private key (with or without 0x prefix)
 */
export function createWallet(privateKey) {
  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(key);
  return {
    account,
    walletClient: createWalletClient({
      account,
      chain: ritualViemChain,
      transport: http(),
    }),
    publicClient: createPublic(),
    address: account.address,
  };
}

/**
 * Convert input to bytes32 salt
 */
export function toSalt(input) {
  if (!input) {
    return `0x${crypto.randomBytes(32).toString("hex")}`;
  }
  if (input.startsWith("0x") && input.length === 66) {
    return input;
  }
  // Hash the input string to create deterministic salt
  return keccak256(toHex(input));
}

/**
 * Read contract state
 */
export async function readContract(publicClient, address, abi, functionName, args = []) {
  return publicClient.readContract({
    address: getAddress(address),
    abi,
    functionName,
    args,
  });
}

/**
 * Send a transaction
 */
export async function sendTx(walletClient, { to, data, value = 0n, gas }) {
  const tx = await walletClient.sendTransaction({
    to: getAddress(to),
    data,
    value,
    gas,
  });
  return tx;
}

/**
 * Wait for transaction receipt
 */
export async function waitTx(publicClient, hash) {
  return publicClient.waitForTransactionReceipt({ hash });
}

export { formatEther, parseEther, hexToBigInt, isAddress };
