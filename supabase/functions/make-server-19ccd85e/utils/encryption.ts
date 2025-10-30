// Token encryption utilities using Web Crypto API
// Uses AES-GCM for authenticated encryption

const ENCRYPTION_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

// Derive encryption key from environment variable
// In production, use Supabase Vault or a dedicated key management service
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = Deno.env.get("ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!keyMaterial) {
    throw new Error("ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY must be set for token encryption");
  }
  
  // Import key material (truncate/pad to 256 bits for AES-256)
  const keyData = new TextEncoder().encode(keyMaterial.slice(0, 32).padEnd(32, '0'));
  
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ENCRYPTION_ALGORITHM },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a token value for secure storage
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    key,
    encoded
  );
  
  // Combine IV and ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a token value from storage
 */
export async function decryptToken(ciphertext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // If decryption fails, try to handle legacy unencrypted tokens gracefully
    console.warn("Decryption failed, attempting to return as plaintext (legacy token):", error);
    // For migration period, return as-is if it looks like plaintext
    if (!ciphertext.includes('=') && ciphertext.length < 100) {
      return ciphertext;
    }
    throw new Error(`Token decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt sensitive fields in a token record
 */
export async function encryptTokenRecord(record: any): Promise<any> {
  const encrypted = { ...record };
  
  if (record.accessToken) {
    encrypted.accessToken = await encryptToken(record.accessToken);
  }
  
  if (record.refreshToken) {
    encrypted.refreshToken = await encryptToken(record.refreshToken);
  }
  
  return encrypted;
}

/**
 * Decrypt sensitive fields in a token record
 */
export async function decryptTokenRecord(record: any): Promise<any> {
  if (!record) return null;
  
  const decrypted = { ...record };
  
  if (record.accessToken) {
    try {
      decrypted.accessToken = await decryptToken(record.accessToken);
    } catch (error) {
      // If already plaintext (legacy), keep as-is
      if (typeof record.accessToken === 'string' && !record.accessToken.includes('=')) {
        decrypted.accessToken = record.accessToken;
      } else {
        throw error;
      }
    }
  }
  
  if (record.refreshToken) {
    try {
      decrypted.refreshToken = await decryptToken(record.refreshToken);
    } catch (error) {
      // If already plaintext (legacy), keep as-is
      if (typeof record.refreshToken === 'string' && !record.refreshToken.includes('=')) {
        decrypted.refreshToken = record.refreshToken;
      } else {
        throw error;
      }
    }
  }
  
  return decrypted;
}

