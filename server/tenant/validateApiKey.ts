import crypto from 'crypto';
import prisma from '../prisma';

export interface ValidatedApiKey {
  keyId: string;
  storeId: string;
  scopes: string[];
}

/**
 * Validates API key and returns store context.
 * Key format: sk_live_<keyId>_<secret>
 */
export async function validateApiKey(key: string): Promise<ValidatedApiKey> {
  // Parse key format
  const parts = key.split('_');
  if (parts.length !== 4 || parts[0] !== 'sk' || parts[1] !== 'live') {
    throw new Error('Invalid API key format');
  }

  const keyId = parts[2];
  const secret = parts[3];

  // Lookup key
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyId },
  });

  if (!apiKey) {
    throw new Error('Invalid API key');
  }

  if (apiKey.revokedAt) {
    throw new Error('API key has been revoked');
  }

  // Verify hash
  const hash = crypto
    .createHash('sha256')
    .update(secret)
    .digest('hex');

  if (hash !== apiKey.keyHash) {
    throw new Error('Invalid API key');
  }

  // Update last used (async, don't await)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {}); // Silent fail on usage tracking

  return {
    keyId: apiKey.keyId,
    storeId: apiKey.storeId,
    scopes: apiKey.scopes,
  };
}

export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes('*') || scopes.includes(required);
}