import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { hashApiKey } from '@/lib/utils/encryption';

/**
 * Generate and create API key
 */
export async function createApiKey(
  storeId: string,
  data: {
    name?: string;
    scopes: string[];
  }
) {
  // Generate unique key ID and secret
  const keyId = crypto.randomBytes(16).toString('hex');
  const secret = crypto.randomBytes(32).toString('hex');
  
  // Construct full key
  const fullKey = `sk_live_${keyId}_${secret}`;
  
  // Hash for storage
  const keyHash = hashApiKey(fullKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      storeId,
      keyId,
      keyHash,
      name: data.name,
      scopes: data.scopes,
    },
  });

  // Return full key ONLY on creation (never again)
  return {
    ...apiKey,
    fullKey,
  };
}

/**
 * Revoke API key
 */
export async function revokeApiKey(storeId: string, keyId: string) {
  const apiKey = await prisma.apiKey.findFirst({
    where: { keyId, storeId },
  });

  if (!apiKey) {
    throw new Error('API key not found');
  }

  if (apiKey.revokedAt) {
    throw new Error('API key is already revoked');
  }

  return prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * Get API key by keyId (for validation)
 */
export async function getApiKeyByKeyId(keyId: string) {
  return prisma.apiKey.findUnique({
    where: { keyId },
    select: {
      id: true,
      keyId: true,
      keyHash: true,
      storeId: true,
      scopes: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}

/**
 * List API keys for a store (excludes hashes)
 */
export async function listApiKeys(storeId: string) {
  return prisma.apiKey.findMany({
    where: { storeId },
    select: {
      id: true,
      keyId: true,
      name: true,
      scopes: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update last used timestamp
 */
export async function incrementUsage(keyId: string) {
  return prisma.apiKey.update({
    where: { keyId },
    data: {
      lastUsedAt: new Date(),
    },
  });
}

/**
 * Get API key by ID (for management)
 */
export async function getApiKeyById(storeId: string, apiKeyId: string) {
  return prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      storeId,
    },
    select: {
      id: true,
      keyId: true,
      name: true,
      scopes: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}