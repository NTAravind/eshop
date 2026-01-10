import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { validateApiKey } from '@/middleware/apiKey';
import prisma from '@/lib/prisma';

export interface TenantContext {
  storeId: string;
  userId?: string;
  apiKeyId?: string;
  scopes?: string[];
}

/**
 * Resolves tenant (store) from either:
 * 1. API key (Authorization header)
 * 2. User session + X-Store-Id header
 * 
 * This is the single source of truth for multi-tenancy
 */
export async function resolveTenant(): Promise<TenantContext> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  // Priority 1: API Key authentication
  if (authHeader) {
    try {
      const apiKeyContext = await validateApiKey(authHeader);
      
      if (apiKeyContext) {
        return {
          storeId: apiKeyContext.storeId,
          apiKeyId: apiKeyContext.keyId,
          scopes: apiKeyContext.scopes,
        };
      }
    } catch (error: any) {
      throw new Error(`API key validation failed: ${error.message}`);
    }
  }

  // Priority 2: User session
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Authentication required. Provide either API key or valid session.');
  }

  const userId = session.user.id;

  // Get storeId from header
  const storeId = headersList.get('x-store-id');

  if (!storeId) {
    throw new Error('X-Store-Id header is required for session-based requests');
  }

  // Verify user has access to this store
  const staff = await prisma.storeStaff.findUnique({
    where: {
      storeId_userId: {
        storeId,
        userId,
      },
    },
  });

  if (!staff) {
    throw new Error('Access denied. User is not a member of this store.');
  }

  return {
    storeId,
    userId,
  };
}