/**
 * Advanced ID obfuscator to hide numeric IDs in URLs.
 * Creates long, secure-looking strings similar to computer bit hashes.
 */

const SECRET_SALT = "OUR_NOVEL_SECURE_VAULT_2024_PRO_MAX";

export function encodeId(id: number | string): string {
  const numId = String(id);
  
  // Create a combined string: salt + id + salt
  // This makes the resulting base64 string look long and complex
  const rawString = `${SECRET_SALT}:${numId}:${SECRET_SALT.split('').reverse().join('')}`;
  
  // Convert to Base64 and make it URL-safe
  try {
    const b64 = btoa(rawString);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return String(id);
  }
}

export function decodeId(encodedId: string): number | null {
  try {
    // Restore Base64 padding and characters
    let b64 = encodedId.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    
    const decoded = atob(b64);
    const parts = decoded.split(':');
    
    // Check if the structure matches our encoding
    if (parts.length === 3 && parts[0] === SECRET_SALT) {
      const id = parseInt(parts[1], 10);
      return isNaN(id) ? null : id;
    }
    
    // Fallback for legacy short IDs if needed
    const legacyParsed = parseInt(encodedId, 36);
    if (!isNaN(legacyParsed)) {
        // This is a bit risky but good for transition
        // return legacyParsed / 987654321;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
