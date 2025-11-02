// PKCE (Proof Key for Code Exchange) utilities
// Generates cryptographically secure code verifiers and challenges

/**
 * Generate a cryptographically secure code verifier for PKCE
 * Per RFC 7636: 43-128 characters, using unreserved characters
 */
export function generateCodeVerifier(): string {
  // Generate 128 random bytes, encode as base64url, truncate to 128 chars
  const array = new Uint8Array(96); // 96 bytes = 128 base64 chars
  crypto.getRandomValues(array);
  
  // Convert to base64url (URL-safe base64)
  let verifier = '';
  for (let i = 0; i < array.length; i += 3) {
    const b1 = array[i];
    const b2 = array[i + 1] || 0;
    const b3 = array[i + 2] || 0;
    
    const bitmap = (b1 << 16) | (b2 << 8) | b3;
    
    for (let j = 0; j < 4 && (i * 4 / 3 + j) < 128; j++) {
      const shift = 6 * (3 - j);
      const byte = (bitmap >> shift) & 63;
      
      if (byte < 26) {
        verifier += String.fromCharCode(65 + byte); // A-Z
      } else if (byte < 52) {
        verifier += String.fromCharCode(97 + byte - 26); // a-z
      } else if (byte < 62) {
        verifier += String.fromCharCode(48 + byte - 52); // 0-9
      } else if (byte === 62) {
        verifier += '-';
      } else {
        verifier += '_';
      }
    }
  }
  
  // Ensure length is 43-128 characters
  return verifier.slice(0, 128);
}

/**
 * Generate code challenge from verifier using SHA256 (recommended method)
 * Returns base64url-encoded SHA256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Hash verifier with SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url
  const hashArray = new Uint8Array(hashBuffer);
  let challenge = '';
  for (let i = 0; i < hashArray.length; i += 3) {
    const b1 = hashArray[i];
    const b2 = hashArray[i + 1] || 0;
    const b3 = hashArray[i + 2] || 0;
    
    const bitmap = (b1 << 16) | (b2 << 8) | b3;
    
    for (let j = 0; j < 4; j++) {
      const shift = 6 * (3 - j);
      const byte = (bitmap >> shift) & 63;
      
      if (byte < 26) {
        challenge += String.fromCharCode(65 + byte); // A-Z
      } else if (byte < 52) {
        challenge += String.fromCharCode(97 + byte - 26); // a-z
      } else if (byte < 62) {
        challenge += String.fromCharCode(48 + byte - 52); // 0-9
      } else if (byte === 62) {
        challenge += '-';
      } else {
        challenge += '_';
      }
    }
  }
  
  // Remove padding
  return challenge.replace(/=+$/, '');
}

/**
 * Generate both verifier and challenge for PKCE flow
 */
export async function generatePKCEPair(): Promise<{ verifier: string; challenge: string; method: string }> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  return {
    verifier,
    challenge,
    method: 'S256' // RFC 7636 requires uppercase S256
  };
}

