import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-fallback-encryption-key-must-be-changed-in-prod-2026-apartment-visitor';

function getKey(): Buffer {
  // Ensure we have a 32-byte key
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypts a plaintext string to an encrypted format containing IV, Auth Tag, and Ciphertext.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  // Skip if already encrypted in our format to prevent double encryption
  if (isEncrypted(text)) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv_hex:tag_hex:ciphertext_hex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a formatted ciphertext string back to plaintext.
 * Falls back to returning the input if the text is not encrypted or decryption fails.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Not in our encrypted format
      return encryptedText;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Decryption failed (e.g. key mismatch or tamper), return original string as safe fallback
    return encryptedText;
  }
}

/**
 * Helper to check if a string is encrypted in our format.
 */
export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  if (text.startsWith('det:')) return true;
  const parts = text.split(':');
  // Our format always has 3 parts: IV (24 hex chars), Tag (32 hex chars), and ciphertext
  return parts.length === 3 && parts[0].length === 24 && parts[1].length === 32;
}

/**
 * Deterministically encrypts a plaintext string (always returns the same ciphertext for the same input).
 * Used for fields that require unique indexes or query lookups (like phone numbers).
 */
export function encryptDeterministic(text: string): string {
  if (!text) return text;
  if (isEncrypted(text)) return text;

  const algorithm = 'aes-256-cbc';
  const key = getKey();
  // Derive a static 16-byte IV from the key to keep it deterministic
  const iv = crypto.createHash('md5').update(key).digest();
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format: det:ciphertext_hex
  return `det:${encrypted}`;
}

/**
 * Decrypts a deterministically encrypted string back to plaintext.
 */
export function decryptDeterministic(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  if (encryptedText.startsWith('det:')) {
    try {
      const ciphertext = encryptedText.substring(4);
      const algorithm = 'aes-256-cbc';
      const key = getKey();
      const iv = crypto.createHash('md5').update(key).digest();
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return encryptedText;
    }
  }
  
  return decrypt(encryptedText);
}

