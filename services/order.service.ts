import prisma from '@/lib/prisma';
import * as discountDal from '@/dal/discount.dal';
import * as subscriptionDal from '@/dal/subscription.dal';
import * as usageService from '@/services/usage.service';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { OrderStatus } from '@/app/generated/prisma';
import * as discountService from '@/services/discount.service';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '@/lib/errors';

interface OrderLineInput {
  variantId: string;
  quantity: number;
}

 
export async function createOrder(
  storeId: string,
  input: {
    userId?: string;
    lines: OrderLineInput[];
    currency?: string;
  },
  couponCode?: string
) {
  // GET ACCOUNT FROM STORE
  const account = await subscriptionDal.getAccountByStoreId(storeId);
  if (!account) {
    throw new NotFoundError('Store account');
  }

  // ENFORCE ORDER LIMIT (account-wide, monthly)
 

  // Validation
  if (!input.lines || input.lines.length === 0) {
    throw new ValidationError('Order must have at least one line item');
  }

  if (input.lines.length > 100) {
    throw new ValidationError('Maximum 100 line items per order');
  }

  for (const line of input.lines) {
    if (line.quantity <= 0) {
      throw new ValidationError('Quantity must be positive');
    }

    if (!Number.isInteger(line.quantity)) {
      throw new ValidationError('Quantity must be a whole number');
    }

    if (line.quantity > 1000) {
      throw new ValidationError('Maximum quantity per item is 1000');
    }
  }

  const currency = input.currency || 'INR';

  // ==========================================
  // STEP 1: PRE-TRANSACTION PREPARATION
  // Fetch variants and calculate totals OUTSIDE transaction
  // ==========================================
  
  const variantIds = input.lines.map(l => l.variantId);
  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
      product: { storeId, deletedAt: null },
      deletedAt: null,
    },
    include: {
      product: {
        select: {
          id: true,
          categoryId: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
  });

  if (variants.length !== variantIds.length) {
    const foundIds = new Set(variants.map(v => v.id));
    const missingIds = variantIds.filter(id => !foundIds.has(id));
    throw new NotFoundError(`Variants: ${missingIds.join(', ')}`);
  }

  // Validate variants and calculate subtotal
  const processedLines: Array<{
    variantId: string;
    productId: string;
    categoryId: string | null;
    quantity: number;
    price: number;
  }> = [];

  let subtotal = 0;

  for (const line of input.lines) {
    const variant = variants.find(v => v.id === line.variantId);
    if (!variant) {
      throw new NotFoundError(`Variant ${line.variantId}`);
    }

    if (!variant.isActive) {
      throw new ConflictError(`Variant ${variant.sku} is not active`);
    }

    if (!variant.product.isActive) {
      throw new ConflictError(`Product for variant ${variant.sku} is not active`);
    }

    if (variant.product.deletedAt) {
      throw new ConflictError(`Product for variant ${variant.sku} has been deleted`);
    }

    if (variant.stock < line.quantity) {
      throw new ConflictError(
        `Insufficient stock for ${variant.sku}. Available: ${variant.stock}, Requested: ${line.quantity}`
      );
    }

    const lineTotal = variant.price * line.quantity;
    subtotal += lineTotal;

    processedLines.push({
      variantId: line.variantId,
      productId: variant.product.id,
      categoryId: variant.product.categoryId,
      quantity: line.quantity,
      price: variant.price,
    });
  }

  // ==========================================
  // STEP 2: CALCULATE DISCOUNTS (OUTSIDE TRANSACTION)
  // This is the critical optimization - no locks held during calculation
  // ==========================================
  
  const { applicableDiscounts, totalDiscount } = await discountService.calculateDiscounts(
    storeId,
    processedLines,
    subtotal,
    input.userId,
    couponCode
  );

  // Calculate final total (clamped >= 0)
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  // ==========================================
  // STEP 3: ATOMIC TRANSACTION (MINIMAL LOCK TIME)
  // Only stock updates and order creation inside transaction
  // ==========================================
  
  const order = await prisma.$transaction(async (tx) => {
    // Reserve stock atomically with conditional updates
    for (const line of processedLines) {
      const updateResult = await tx.productVariant.updateMany({
        where: {
          id: line.variantId,
          stock: { gte: line.quantity },
          deletedAt: null,
        },
        data: {
          stock: {
            decrement: line.quantity,
          },
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictError(
          `Insufficient stock for variant ${line.variantId} (race condition detected)`
        );
      }
    }

    // Create order with immutable snapshot
    const order = await tx.order.create({
      data: {
        storeId,
        userId: input.userId,
        subtotal,
        discountAmount: totalDiscount,
        total: finalTotal,
        currency,
        status: 'PENDING',
        lines: {
          create: processedLines.map(line => ({
            variantId: line.variantId,
            quantity: line.quantity,
            price: line.price,
          })),
        },
        discounts: applicableDiscounts.length > 0 ? {
          create: applicableDiscounts.map(discount => ({
            discountId: discount.id,
            amount: discount.amount,
          })),
        } : undefined,
      },
      include: {
        lines: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        discounts: {
          include: {
            discount: true,
          },
        },
        payments: true,
      },
    });

    // Record discount usage
    for (const discount of applicableDiscounts) {
      await discountDal.recordDiscountUsage(discount.id, order.id, input.userId);
    }

    return order;
  }, {
    timeout: 10000,
    maxWait: 5000,
  });

  // RECORD ORDER CREATION (after transaction completes)
  await usageService.recordOrderCreation(account.id);

  return order;
}

/**
 * Get order by ID
 */
export async function getOrder(
  userId: string,
  storeId: string,
  orderId: string
) {
  await requireStoreRole(userId, storeId, 'SUPPORT');

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      storeId,
    },
    include: {
      lines: {
        include: {
          variant: {
            include: {
              product: true,
              images: true,
            },
          },
        },
      },
      discounts: {
        include: {
          discount: true,
        },
      },
      payments: true,
    },
  });

  if (!order) {
    throw new NotFoundError('Order');
  }

  return order;
}

/**
 * List orders with filters
 */
export async function listOrders(
  userId: string,
  storeId: string,
  filters?: {
    userId?: string;
    status?: OrderStatus;
    skip?: number;
    take?: number;
  }
) {
  await requireStoreRole(userId, storeId, 'SUPPORT');

  const take = filters?.take ?? 50;
  if (take > 100) {
    throw new ValidationError('Maximum 100 items per page');
  }

  const where = {
    storeId,
    ...(filters?.userId && { userId: filters.userId }),
    ...(filters?.status && { status: filters.status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: filters?.skip ?? 0,
      take,
      include: {
        lines: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        discounts: {
          include: {
            discount: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

/**
 * Update order status with stock restoration
 */
export async function updateOrderStatus(
  userId: string,
  storeId: string,
  orderId: string,
  status: OrderStatus
) {
  await requireStoreRole(userId, storeId, 'MANAGER');

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, storeId },
      include: {
        lines: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Business rules
    if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      throw new ConflictError('Cannot change status of cancelled order');
    }

    if (order.status === 'REFUNDED' && status !== 'REFUNDED') {
      throw new ConflictError('Cannot change status of refunded order');
    }

    if (order.status === 'PAID' && status === 'PENDING') {
      throw new ConflictError('Cannot revert paid order to pending');
    }

    // Restore stock if cancelling or refunding
    if ((status === 'CANCELLED' || status === 'REFUNDED') && 
        (order.status !== 'CANCELLED' && order.status !== 'REFUNDED')) {
      for (const line of order.lines) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: {
            stock: {
              increment: line.quantity,
            },
          },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        lines: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        discounts: {
          include: {
            discount: true,
          },
        },
        payments: true,
      },
    });
  });
}