// ECIES Encryption — Browser Web Crypto API version
// Encrypts LLM API keys to executor's public key
// Uses secp256k1 ECDH + AES-256-GCM

const AES_GCM_TAG_BYTES = 16;
const NONCE_BYTES = 12;

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex) {
  const clean = hex.replace(/^0x/i, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concatBytes(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Normalize a public key to uncompressed 65-byte format (0x04 + x + y)
 */
function normalizePublicKey(hex) {
  const clean = hex.replace(/^0x/i, "");
  if (clean.length === 128) {
    // Raw 64 bytes (x + y), add 04 prefix
    return concatBytes(new Uint8Array([0x04]), hexToBytes(clean));
  }
  if (clean.length === 130) {
    return hexToBytes(clean);
  }
  throw new Error("Unsupported public key length: " + clean.length);
}

/**
 * Compute secp256k1 ECDH shared secret in browser using Subtle Crypto
 * We use the raw ECDH key agreement API
 */
async function ecdhSharedSecret(privateKeyBytes, publicKeyBytes) {
  // Import ephemeral private key
  const privateKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDH", namedCurve: "P-256" }, // Use P-256 as proxy, then map
    false,
    ["deriveBits"]
  );

  // Import receiver's public key
  // Note: secp256k1 is not natively supported in Web Crypto
  // We use the noble-secp256k1 approach via a polyfill or manual computation
  // Fallback: use simple scalar multiplication concept

  throw new Error(
    "Browser ECDH not implemented — use @noble/secp256k1 via npm import"
  );
}

/**
 * Encrypt payload to executor's public key.
 * Uses ECIES: secp256k1 ECDH (via noble) + HKDF + AES-256-GCM
 *
 * NOTE: This requires @noble/secp256k1 and @noble/hashes.
 * For vanilla HTML without build step, import from CDN:
 *   import { getPublicKey, getSharedSecret, utils } from 'https://cdn.jsdelivr.net/npm/@noble/secp256k1/+esm'
 *   import { hkdf } from 'https://cdn.jsdelivr.net/npm/@noble/hashes/+esm/hkdf.js'
 *   import { sha256 } from 'https://cdn.jsdelivr.net/npm/@noble/hashes/+esm/sha256.js'
 */
export async function encryptRitualEnv(publicKeyHex, payload) {
  const { getPublicKey, getSharedSecret, utils } = await import(
    "https://cdn.jsdelivr.net/npm/@noble/secp256k1@2.2.3/+esm"
  );
  const { hkdf } = await import(
    "https://cdn.jsdelivr.net/npm/@noble/hashes@1.7.1/+esm/hkdf.js"
  );
  const { sha256 } = await import(
    "https://cdn.jsdelivr.net/npm/@noble/hashes@1.7.1/+esm/sha256.js"
  );

  const receiverKey = normalizePublicKey(publicKeyHex);
  const ephemeralSecret = utils.randomPrivateKey();
  const ephemeralPublic = getPublicKey(ephemeralSecret, false);
  const sharedPoint = getSharedSecret(ephemeralSecret, receiverKey, false);

  const master = concatBytes(ephemeralPublic, sharedPoint);
  const keyMaterial = hkdf(sha256, master, undefined, undefined, 32);

  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: AES_GCM_TAG_BYTES * 8 },
      cryptoKey,
      payload
    )
  );

  const ciphertext = encrypted.slice(0, encrypted.length - AES_GCM_TAG_BYTES);
  const tag = encrypted.slice(encrypted.length - AES_GCM_TAG_BYTES);

  return "0x" + bytesToHex(concatBytes(ephemeralPublic, nonce, tag, ciphertext));
}

/**
 * Build default environment payload for LLM provider
 */
export function buildEnvPayload(provider, apiKey = "") {
  const env = { LLM_PROVIDER: provider };
  if (apiKey) {
    env[`${provider.toUpperCase()}_API_KEY`] = apiKey;
  }
  return new TextEncoder().encode(JSON.stringify(env));
}
