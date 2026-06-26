// ECIES encryption for Ritual agents
// Encrypts LLM API keys and secrets to executor's public key
// Uses secp256k1 ECDH + AES-256-GCM

import * as secp from "@noble/secp256k1";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";
import { bytesToHex, hexToBytes } from "viem";

const AES_GCM_TAG_BYTES = 16;
const NONCE_BYTES = 12;

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Node.js fallback (synchronous)
    // eslint-disable-next-line no-undef
    const rb = require("crypto").randomBytes;
    return rb(length);
  }
  return bytes;
}

/**
 * Encrypt a payload using ECIES (secp256k1 ECDH + AES-256-GCM)
 * @param {string} publicKeyHex - Executor's public key (hex)
 * @param {Uint8Array} payload - Data to encrypt
 * @returns {Promise<string>} Hex-encoded encrypted blob
 */
export async function encryptRitualEnv(publicKeyHex, payload) {
  // Normalize public key
  const clean = publicKeyHex.replace(/^0x/i, "");
  let receiverPublicKey;

  if (clean.length === 128) {
    // Raw 64-byte (x,y) without prefix
    receiverPublicKey = hexToBytes(`0x04${clean}`);
  } else if (clean.length === 130) {
    // Full 65-byte with 04 prefix
    receiverPublicKey = hexToBytes(`0x${clean}`);
  } else if (clean.length === 66) {
    // Compressed (33 bytes)
    receiverPublicKey = hexToBytes(`0x${clean}`);
  } else {
    throw new Error(
      `Executor public key has unsupported length: ${clean.length} hex chars`
    );
  }

  // Generate ephemeral key pair
  const ephemeralSecret = secp.utils.randomPrivateKey();
  const ephemeralPublicKey = secp.getPublicKey(ephemeralSecret, false);

  // ECDH shared secret
  const sharedPoint = secp.getSharedSecret(
    ephemeralSecret,
    receiverPublicKey,
    false
  );

  // Derive AES key via HKDF
  const master = concatBytes(ephemeralPublicKey, sharedPoint);
  const keyMaterial = hkdf(
    sha256,
    master,
    new Uint8Array(),
    new Uint8Array(),
    32
  );

  const nonce = randomBytes(NONCE_BYTES);

  // Encrypt with AES-256-GCM
  let encrypted;
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    encrypted = new Uint8Array(
      await globalThis.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: nonce,
          tagLength: AES_GCM_TAG_BYTES * 8,
        },
        cryptoKey,
        payload
      )
    );
  } else {
    // Node.js fallback
    const { createCipheriv } = await import("node:crypto");
    const cipher = createCipheriv("aes-256-gcm", keyMaterial, nonce);
    const c1 = cipher.update(payload);
    const c2 = cipher.final();
    encrypted = new Uint8Array(Buffer.concat([c1, c2, cipher.getAuthTag()]));
  }

  const ciphertext = encrypted.slice(0, encrypted.length - AES_GCM_TAG_BYTES);
  const tag = encrypted.slice(encrypted.length - AES_GCM_TAG_BYTES);

  // Format: ephemeralPublicKey (65 bytes) + nonce (12) + tag (16) + ciphertext
  return bytesToHex(concatBytes(ephemeralPublicKey, nonce, tag, ciphertext));
}

/**
 * Build the LLM_PROVIDER env payload
 */
export function buildEnvPayload(provider = "ritual", apiKey = "") {
  const env = { LLM_PROVIDER: provider };
  if (apiKey) {
    env[`${provider.toUpperCase()}_API_KEY`] = apiKey;
  }
  return new TextEncoder().encode(JSON.stringify(env));
}
