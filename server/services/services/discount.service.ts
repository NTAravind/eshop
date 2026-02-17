import * as discountDal from '@/dal/discount.dal';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { DiscountType, DiscountScope } from '@/app/generated/prisma';

interface DiscountInput {
  code?: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  startsAt: Date | string;
  endsAt: Date | string;
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  minOrderValue?: number;
  isStackable?: boolean;
  productIds?: string[];
  categoryIds?: string[];
}

export async function createDiscount(
  userId: string,
  storeId: string,
  input: DiscountInput
) {
  // Permission check - OWNER or MANAGER only
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Discount name is required');
  }

  if (input.code && input.code.trim().length === 0) {
    throw new Error('Discount code cannot be empty');
  }

  if (input.code && input.code.length > 50) {
    throw new Error('Discount code must be 50 characters or less');
  }

  if (input.value <= 0) {
    throw new Error('Discount value must be positive');
  }

  if (input.type === 'PERCENTAGE' && input.value > 10000) {
    throw new Error('Percentage discount cannot exceed 100%');
  }

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);

  if (isNaN(startsAt.getTime())) {
    throw new Error('Invalid start date');
  }

  if (isNaN(endsAt.getTime())) {
    throw new Error('Invalid end date');
  }

  if (endsAt <= startsAt) {
    throw new Error('End date must be after start date');
  }

  if (input.maxUsageCount !== undefined && input.maxUsageCount <= 0) {
    throw new Error('Max usage count must be positive');
  }

  if (input.maxUsagePerUser !== undefined && input.maxUsagePerUser <= 0) {
    throw new Error('Max usage per user must be positive');
  }

  if (input.minOrderValue !== undefined && input.minOrderValue < 0) {
    throw new Error('Min order value cannot be negative');
  }

  // Validate scope-specific requirements
  if (input.scope === 'PRODUCT' && (!input.productIds || input.productIds.length === 0)) {
    throw new Error('Product-specific discounts require at least one product');
  }

  if (input.scope === 'CATEGORY' && (!input.categoryIds || input.categoryIds.length === 0)) {
    throw new Error('Category-specific discounts require at least one category');
  }

  return discountDal.createDiscount(storeId, {
    code: input.code,
    name: input.name,
    description: input.description,
    type: input.type,
    value: input.value,
    scope: input.scope,
    startsAt,
    endsAt,
    maxUsageCount: input.maxUsageCount,
    maxUsagePerUser: input.maxUsagePerUser,
    minOrderValue: input.minOrderValue,
    isStackable: input.isStackable ?? false,
    productIds: input.productIds,
    categoryIds: input.categoryIds,
  });
}

export async function updateDiscount(
  userId: string,
  storeId: string,
  discountId: string,
  input: Partial<DiscountInput> & { isActive?: boolean }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  // Validation
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error('Discount name cannot be empty');
  }

  if (input.code !== undefined && input.code.trim().length === 0) {
    throw new Error('Discount code cannot be empty');
  }

  if (input.value !== undefined && input.value <= 0) {
    throw new Error('Discount value must be positive');
  }

  if (input.type === 'PERCENTAGE' && input.value !== undefined && input.value > 10000) {
    throw new Error('Percentage discount cannot exceed 100%');
  }

  let startsAt: Date | undefined;
  let endsAt: Date | undefined;

  if (input.startsAt) {
    startsAt = new Date(input.startsAt);
    if (isNaN(startsAt.getTime())) {
      throw new Error('Invalid start date');
    }
  }

  if (input.endsAt) {
    endsAt = new Date(input.endsAt);
    if (isNaN(endsAt.getTime())) {
      throw new Error('Invalid end date');
    }
  }

  // If both dates provided, validate
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error('End date must be after start date');
  }

  return discountDal.updateDiscount(storeId, discountId, {
    code: input.code,
    name: input.name,
    description: input.description,
    value: input.value,
    startsAt,
    endsAt,
    maxUsageCount: input.maxUsageCount,
    maxUsagePerUser: input.maxUsagePerUser,
    minOrderValue: input.minOrderValue,
    isStackable: input.isStackable,
    isActive: input.isActive,
    productIds: input.productIds,
    categoryIds: input.categoryIds,
  });
}

export async function deleteDiscount(
  userId: string,
  storeId: string,
  discountId: string
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'MANAGER');

  return discountDal.deleteDiscount(storeId, discountId);
}

export async function getDiscount(
  userId: string,
  storeId: string,
  discountId: string
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'SUPPORT');

  return discountDal.getDiscountById(storeId, discountId);
}

export async function listDiscounts(
  userId: string,
  storeId: string,
  filters?: {
    isActive?: boolean;
    scope?: DiscountScope;
    skip?: number;
    take?: number;
  }
) {
  // Permission check
  await requireStoreRole(userId, storeId, 'SUPPORT');

  const take = filters?.take ?? 50;
  if (take > 100) {
    throw new Error('Maximum 100 items per page');
  }

  return discountDal.listDiscounts(storeId, {
    ...filters,
    take,
  });
}

/**
 * Calculate discount for order items (SERVICE LAYER ONLY)
 * Returns applicable discounts and total discount amount
 */
export interface OrderItem {
  variantId: string;
  productId: string;
  categoryId: string | null;
  quantity: number;
  price: number;
}

export interface ApplicableDiscount {
  id: string;
  code: string | null;
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
  amount: number; // Calculated discount amount
}

export async function calculateDiscounts(
  storeId: string,
  items: OrderItem[],
  subtotal: number,
  userId?: string,
  couponCode?: string
): Promise<{
  applicableDiscounts: ApplicableDiscount[];
  totalDiscount: number;
}> {
  const now = new Date();

  // Get all applicable discounts (time-constrained, active)
  let discounts = await discountDal.getApplicableDiscounts(storeId, now);

  // Filter by coupon code if provided
  if (couponCode) {
    const couponDiscount = discounts.find(
      d => d.code && d.code.toUpperCase() === couponCode.toUpperCase()
    );
    if (!couponDiscount) {
      throw new Error('Invalid or expired coupon code');
    }
    // Only consider this discount if code provided
    discounts = [couponDiscount];
  } else {
    // Filter out discounts that require a code
    discounts = discounts.filter(d => !d.code);
  }

  let applicableDiscounts: ApplicableDiscount[] = [];

  for (const discount of discounts) {
    // Check min order value
    if (discount.minOrderValue && subtotal < discount.minOrderValue) {
      continue;
    }

    // Check total usage limit
    if (discount.maxUsageCount) {
      const totalUsage = await discountDal.getDiscountTotalUsageCount(discount.id);
      if (totalUsage >= discount.maxUsageCount) {
        continue;
      }
    }

    // Check per-user usage limit
    if (discount.maxUsagePerUser && userId) {
      const userUsage = await discountDal.getUserDiscountUsageCount(discount.id, userId);
      if (userUsage >= discount.maxUsagePerUser) {
        continue;
      }
    }

    // Calculate discount amount based on scope
    let discountAmount = 0;

    switch (discount.scope) {
      case 'STORE_WIDE':
        discountAmount = calculateDiscountAmount(discount.type, discount.value, subtotal);
        break;

      case 'CATEGORY':
        const categoryIds = discount.categories.map(c => c.categoryId);
        const categorySubtotal = items
          .filter(item => item.categoryId && categoryIds.includes(item.categoryId))
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
        discountAmount = calculateDiscountAmount(discount.type, discount.value, categorySubtotal);
        break;

      case 'PRODUCT':
        const productIds = discount.products.map(p => p.productId);
        const productSubtotal = items
          .filter(item => productIds.includes(item.productId))
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
        discountAmount = calculateDiscountAmount(discount.type, discount.value, productSubtotal);
        break;
    }

    if (discountAmount > 0) {
      applicableDiscounts.push({
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        scope: discount.scope,
        amount: discountAmount,
      });
    }
  }

  // Apply stacking rules
  let totalDiscount = 0;

  if (applicableDiscounts.length === 0) {
    return { applicableDiscounts: [], totalDiscount: 0 };
  }

  if (applicableDiscounts.length === 1) {
    totalDiscount = applicableDiscounts[0].amount;
  } else {
    // Check if all discounts are stackable
    const allStackable = applicableDiscounts.every(d => {
      const original = discounts.find(od => od.id === d.id);
      return original?.isStackable;
    });

    if (allStackable) {
      // Stack all discounts
      totalDiscount = applicableDiscounts.reduce((sum, d) => sum + d.amount, 0);
    } else {
      // Use best discount only
      const bestDiscount = applicableDiscounts.reduce((best, current) =>
        current.amount > best.amount ? current : best
      );
      applicableDiscounts = [bestDiscount];
      totalDiscount = bestDiscount.amount;
    }
  }

  // Ensure discount doesn't exceed subtotal
  if (totalDiscount > subtotal) {
    totalDiscount = subtotal;
  }

  return { applicableDiscounts, totalDiscount };
}

/**
 * Helper to calculate discount amount
 */
function calculateDiscountAmount(
  type: DiscountType,
  value: number,
  amount: number
): number {
  if (type === 'PERCENTAGE') {
    // value is stored as basis points (e.g., 1000 = 10%)
    return Math.floor((amount * value) / 10000);
  } else {
    // FIXED_AMOUNT - value is in paise
    return Math.min(value, amount);
  }
}