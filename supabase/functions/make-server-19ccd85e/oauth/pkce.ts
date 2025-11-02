// PKCE (Proof Key for Code Exchange) utilities
// Generates cryptographically secure code verifiers and challenges

/**
 * Convert ArrayBuffer to base64url string
 * Per RFC 4648: base64url uses - and _ instead of + and /, no padding
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Use btoa for standard base64, then convert to base64url
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, ''); // Remove padding
}

/**
 * Generate a cryptographically secure code verifier for PKCE
 * Per RFC 7636: 43-128 characters, using unreserved characters
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes (will produce 43 base64url chars)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  // Convert to base64url
  return arrayBufferToBase64Url(array.buffer);
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

  // Convert hash to base64url
  return arrayBufferToBase64Url(hashBuffer);
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

