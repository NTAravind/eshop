import * as apiKeyDal from '@/dal/apiKey.dal';
import { requireStoreRole, canManageApiKeys } from '@/lib/auth/requireStore';

const VALID_SCOPES = [
  '*',
  'products:read',
  'products:write',
  'orders:read',
  'orders:write',
  'categories:read',
  'categories:write',
];

export async function generateKey(
  userId: string,
  storeId: string,
  input: {
    name?: string;
    scopes: string[];
  }
) {
  // Permission check - only OWNER can create API keys
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can manage API keys');
  }

  // Validation
  if (!input.scopes || input.scopes.length === 0) {
    throw new Error('At least one scope is required');
  }

  for (const scope of input.scopes) {
    if (!VALID_SCOPES.includes(scope)) {
      throw new Error(`Invalid scope: ${scope}`);
    }
  }

  if (input.name && input.name.length > 100) {
    throw new Error('Name must be 100 characters or less');
  }

  return apiKeyDal.createApiKey(storeId, input);
}

export async function revokeKey(
  userId: string,
  storeId: string,
  keyId: string
) {
  // Permission check - only OWNER can revoke API keys
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can manage API keys');
  }

  return apiKeyDal.revokeApiKey(storeId, keyId);
}

export async function listKeys(userId: string, storeId: string) {
  // Permission check - only OWNER can view API keys
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can view API keys');
  }

  return apiKeyDal.listApiKeys(storeId);
}

/**
 * Validates that an API key has required scopes.
 * Used in API routes to enforce scope-based permissions.
 */
export function validateScopes(keyScopes: string[], requiredScopes: string[]): void {
  if (keyScopes.includes('*')) {
    return; // Wildcard grants all scopes
  }

  for (const required of requiredScopes) {
    if (!keyScopes.includes(required)) {
      throw new Error(`Missing required scope: ${required}`);
    }
  }
}

export function hasReadScope(scopes: string[], resource: string): boolean {
  return scopes.includes('*') || scopes.includes(`${resource}:read`);
}

export function hasWriteScope(scopes: string[], resource: string): boolean {
  return scopes.includes('*') || scopes.includes(`${resource}:write`);
}