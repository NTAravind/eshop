import * as paymentConfigDal from '@/dal/paymentConfig.dal';
import { requireStoreRole, canManageApiKeys } from '@/lib/auth/requireStore';
import { PaymentProvider } from '@/app/generated/prisma';

export async function createPaymentConfig(
  userId: string,
  storeId: string,
  input: {
    provider: PaymentProvider;
    apiKey: string;
    apiSecret?: string;
    webhookSecret?: string;
    isLive: boolean;
  }
) {
  // Only OWNER can manage payment configurations
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can manage payment configurations');
  }

  // Validation
  if (!input.apiKey || input.apiKey.trim().length === 0) {
    throw new Error('API key is required');
  }

  // Validate provider-specific requirements
  switch (input.provider) {
    case 'STRIPE':
      if (!input.apiKey.startsWith('sk_') && !input.apiKey.startsWith('rk_')) {
        throw new Error('Invalid Stripe API key format');
      }
      if (!input.webhookSecret) {
        throw new Error('Webhook secret is required for Stripe');
      }
      break;
    
    case 'RAZORPAY':
      if (!input.apiSecret) {
        throw new Error('API secret is required for Razorpay');
      }
      break;
    
    case 'MANUAL':
      // No specific validation for manual payments
      break;
  }

  return paymentConfigDal.createPaymentConfig(storeId, input);
}

export async function updatePaymentConfig(
  userId: string,
  storeId: string,
  configId: string,
  input: {
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    isLive?: boolean;
    isActive?: boolean;
  }
) {
  // Only OWNER can manage payment configurations
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can manage payment configurations');
  }

  // Validation
  if (input.apiKey !== undefined && input.apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  return paymentConfigDal.updatePaymentConfig(storeId, configId, input);
}

export async function deletePaymentConfig(
  userId: string,
  storeId: string,
  configId: string
) {
  // Only OWNER can manage payment configurations
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can manage payment configurations');
  }

  return paymentConfigDal.deletePaymentConfig(storeId, configId);
}

export async function listPaymentConfigs(
  userId: string,
  storeId: string
) {
  // Only OWNER can view payment configurations
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can view payment configurations');
  }

  return paymentConfigDal.listPaymentConfigs(storeId);
}

export async function getPaymentConfig(
  userId: string,
  storeId: string,
  configId: string
) {
  // Only OWNER can view payment configurations
  const role = await requireStoreRole(userId, storeId, 'OWNER');
  
  if (!canManageApiKeys(role)) {
    throw new Error('Only store owners can view payment configurations');
  }

  return paymentConfigDal.getPaymentConfig(storeId, configId);
}