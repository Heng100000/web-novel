/**
 * Advanced ID obfuscator to hide numeric IDs in URLs.
 * Creates long, secure-looking strings similar to computer bit hashes.
 */

const SECRET_SALT = "OUR_NOVEL_SECURE_VAULT_2024_PRO_MAX";

export function encodeId(id: number | string): string {
  const numId = String(id);
  const rawString = `${SECRET_SALT}:${numId}:${SECRET_SALT.split('').reverse().join('')}`;
  
  try {
    // Use Buffer for Node.js compatibility (server-side)
    const b64 = Buffer.from(rawString).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return String(id);
  }
}

export function decodeId(encodedId: string): number | null {
  if (!encodedId) return null;
  
  // If it's already a number, just return it
  if (/^\d+$/.test(encodedId)) return parseInt(encodedId, 10);

  try {
    // Restore Base64 padding and characters
    let b64 = encodedId.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    
    if (parts.length === 3 && parts[0] === SECRET_SALT) {
      const id = parseInt(parts[1], 10);
      return isNaN(id) ? null : id;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
