import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

/**
 * Validates encryption key on startup
 */
export function validateEncryptionKey(): void {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required for payment security. ' +
      'Generate with: openssl rand -hex 32'
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes). ' +
      'Generate with: openssl rand -hex 32'
    );
  }
}

/**
 * Gets validated encryption key buffer
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypts sensitive data (payment credentials)
 * Format: iv:encryptedData (both hex-encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty text');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts sensitive data
 */
export function decrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot decrypt empty text');
  }

  const parts = text.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key against hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash;
}

// Validate encryption key on module load
if (process.env.NODE_ENV !== 'test') {
  validateEncryptionKey();
}