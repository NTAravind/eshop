import prisma from '@/lib/prisma';
import { PaymentProvider } from '@/app/generated/prisma';
import { encrypt, decrypt } from '@/lib/utils/encryption';

/**
 * Create payment configuration
 */
export async function createPaymentConfig(
  storeId: string,
  data: {
    provider: PaymentProvider;
    apiKey: string;
    apiSecret?: string;
    webhookSecret?: string;
    isLive: boolean;
  }
) {
  return prisma.paymentConfig.create({
    data: {
      storeId,
      provider: data.provider,
      apiKey: encrypt(data.apiKey),
      apiSecret: data.apiSecret ? encrypt(data.apiSecret) : null,
      webhookSecret: data.webhookSecret ? encrypt(data.webhookSecret) : null,
      isLive: data.isLive,
    },
    select: {
      id: true,
      storeId: true,
      provider: true,
      isLive: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Update payment configuration
 */
export async function updatePaymentConfig(
  storeId: string,
  configId: string,
  data: {
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
    isLive?: boolean;
    isActive?: boolean;
  }
) {
  const config = await prisma.paymentConfig.findFirst({
    where: { id: configId, storeId },
  });

  if (!config) {
    throw new Error('Payment config not found');
  }

  return prisma.paymentConfig.update({
    where: { id: configId },
    data: {
      ...(data.apiKey && { apiKey: encrypt(data.apiKey) }),
      ...(data.apiSecret && { apiSecret: encrypt(data.apiSecret) }),
      ...(data.webhookSecret && { webhookSecret: encrypt(data.webhookSecret) }),
      ...(data.isLive !== undefined && { isLive: data.isLive }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      storeId: true,
      provider: true,
      isLive: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Delete payment configuration
 */
export async function deletePaymentConfig(storeId: string, configId: string) {
  const config = await prisma.paymentConfig.findFirst({
    where: { id: configId, storeId },
  });

  if (!config) {
    throw new Error('Payment config not found');
  }

  return prisma.paymentConfig.delete({
    where: { id: configId },
  });
}

/**
 * Get payment configuration (public data only)
 */
export async function getPaymentConfig(storeId: string, configId: string) {
  return prisma.paymentConfig.findFirst({
    where: {
      id: configId,
      storeId,
    },
    select: {
      id: true,
      storeId: true,
      provider: true,
      isLive: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Get decrypted credentials (INTERNAL USE ONLY)
 * NEVER expose via API
 */
export async function getPaymentCredentials(
  storeId: string,
  provider: PaymentProvider
) {
  const config = await prisma.paymentConfig.findFirst({
    where: {
      storeId,
      provider,
      isActive: true,
    },
  });

  if (!config) {
    throw new Error(`No active ${provider} configuration found`);
  }

  return {
    id: config.id,
    provider: config.provider,
    apiKey: decrypt(config.apiKey),
    apiSecret: config.apiSecret ? decrypt(config.apiSecret) : null,
    webhookSecret: config.webhookSecret ? decrypt(config.webhookSecret) : null,
    isLive: config.isLive,
  };
}

/**
 * List payment configurations
 */
export async function listPaymentConfigs(storeId: string) {
  return prisma.paymentConfig.findMany({
    where: { storeId },
    select: {
      id: true,
      provider: true,
      isLive: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get active payment config
 */
export async function getActivePaymentConfig(
  storeId: string,
  provider: PaymentProvider
) {
  return prisma.paymentConfig.findFirst({
    where: {
      storeId,
      provider,
      isActive: true,
    },
    select: {
      id: true,
      provider: true,
      isLive: true,
      isActive: true,
    },
  });
}