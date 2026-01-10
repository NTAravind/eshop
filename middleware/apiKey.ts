import { NextRequest, NextResponse } from 'next/server';
import * as apiKeyDal from '@/dal/apiKey.dal';
import { verifyApiKey } from '@/lib/utils/encryption';

export interface ApiKeyContext {
  keyId: string;
  storeId: string;
  scopes: string[];
}

/**
 * Validates API key from Authorization header
 * Format: Bearer sk_live_{keyId}_{secret}
 */
export async function validateApiKey(
  authHeader: string | null
): Promise<ApiKeyContext | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // Parse key format: sk_live_{keyId}_{secret}
  const parts = token.split('_');
  if (parts.length !== 4 || parts[0] !== 'sk' || parts[1] !== 'live') {
    throw new Error('Invalid API key format');
  }

  const keyId = parts[2];
  const secret = parts[3];

  // Fetch API key from database
  const apiKey = await apiKeyDal.getApiKeyByKeyId(keyId);

  if (!apiKey) {
    throw new Error('Invalid API key');
  }

  if (apiKey.revokedAt) {
    throw new Error('API key has been revoked');
  }

  // Verify secret hash
  const fullKey = `sk_live_${keyId}_${secret}`;
  if (!verifyApiKey(fullKey, apiKey.keyHash)) {
    throw new Error('Invalid API key');
  }

  // Update last used timestamp (async, don't await)
  apiKeyDal.incrementUsage(keyId).catch(err => {
    console.error('Failed to update API key usage:', err);
  });

  return {
    keyId: apiKey.keyId,
    storeId: apiKey.storeId,
    scopes: apiKey.scopes,
  };
}

/**
 * Enforces required scopes for API key
 */
export function requireScopes(
  scopes: string[],
  required: string[]
): void {
  if (scopes.includes('*')) {
    return; // Wildcard grants all
  }

  for (const req of required) {
    if (!scopes.includes(req)) {
      throw new Error(`Missing required scope: ${req}`);
    }
  }
}

/**
 * Check if API key has read scope
 */
export function hasReadScope(scopes: string[], resource: string): boolean {
  return scopes.includes('*') || scopes.includes(`${resource}:read`);
}

/**
 * Check if API key has write scope
 */
export function hasWriteScope(scopes: string[], resource: string): boolean {
  return scopes.includes('*') || scopes.includes(`${resource}:write`);
}