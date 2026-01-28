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
 * Hierarchical access control:
 * - SuperAdmin: Access to any store
 * - Tenant Admin (AccountUser OWNER): Access to stores in their account
 * - Store Staff: Access to stores they're assigned to
 */
export async function resolveTenant(storeIdParam?: string): Promise<TenantContext> {
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

  // Get storeId from param or header
  const storeId = storeIdParam || headersList.get('x-store-id');

  if (!storeId) {
    throw new Error('X-Store-Id header is required for session-based requests');
  }

  // 1. Check if SuperAdmin - allow access to any store
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true }
  });

  if (user?.isSuperAdmin) {
    return { storeId, userId };
  }

  // 2. Tenant Admin check REMOVED to enforce strict Store Staff assignment.
  // Account Owners must be explicitly added as Store Staff to access the store.

  /* 
  const store = await prisma.store.findUnique({ ... });
  if (store?.account.users.length && store.account.users.length > 0) {
    return { storeId, userId };
  } 
  */

  // 3. Check StoreStaff (existing logic for Store Admins)
  let staff = await prisma.storeStaff.findUnique({
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