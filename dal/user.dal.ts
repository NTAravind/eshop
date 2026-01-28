import prisma from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

/**
 * Update user profile (name, phone)
 */
export async function updateUserProfile(
    userId: string,
    data: {
        name?: string;
        phone?: string;
    }
) {
    // Validate phone format if provided
    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
        if (!phoneRegex.test(data.phone)) {
            throw new ValidationError('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
        }
    }

    return prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.phone !== undefined && { phone: data.phone || null }),
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            image: true,
            createdAt: true,
        }
    });
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            image: true,
            createdAt: true,
            billingAddresses: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });
}

/**
 * Create billing address
 */
export async function createBillingAddress(
    userId: string,
    data: {
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }
) {
    // Validation
    if (!data.address1 || data.address1.trim().length === 0) {
        throw new ValidationError('Address line 1 is required');
    }
    if (!data.city || data.city.trim().length === 0) {
        throw new ValidationError('City is required');
    }
    if (!data.state || data.state.trim().length === 0) {
        throw new ValidationError('State is required');
    }
    if (!data.postalCode || data.postalCode.trim().length === 0) {
        throw new ValidationError('Postal code is required');
    }
    if (!data.country || data.country.trim().length === 0) {
        throw new ValidationError('Country is required');
    }

    return prisma.billingAddress.create({
        data: {
            userId,
            address1: data.address1.trim(),
            address2: data.address2?.trim() || null,
            city: data.city.trim(),
            state: data.state.trim(),
            postalCode: data.postalCode.trim(),
            country: data.country.trim(),
        }
    });
}

/**
 * Update billing address
 */
export async function updateBillingAddress(
    userId: string,
    addressId: string,
    data: {
        address1?: string;
        address2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    }
) {
    // Verify ownership
    const existing = await prisma.billingAddress.findFirst({
        where: { id: addressId, userId }
    });

    if (!existing) {
        throw new ValidationError('Billing address not found');
    }

    return prisma.billingAddress.update({
        where: { id: addressId },
        data: {
            ...(data.address1 && { address1: data.address1.trim() }),
            ...(data.address2 !== undefined && { address2: data.address2?.trim() || null }),
            ...(data.city && { city: data.city.trim() }),
            ...(data.state && { state: data.state.trim() }),
            ...(data.postalCode && { postalCode: data.postalCode.trim() }),
            ...(data.country && { country: data.country.trim() }),
        }
    });
}

/**
 * Delete billing address
 */
export async function deleteBillingAddress(
    userId: string,
    addressId: string
) {
    // Verify ownership
    const existing = await prisma.billingAddress.findFirst({
        where: { id: addressId, userId }
    });

    if (!existing) {
        throw new ValidationError('Billing address not found');
    }

    return prisma.billingAddress.delete({
        where: { id: addressId }
    });
}

/**
 * List billing addresses for user
 */
export async function listBillingAddresses(userId: string) {
    return prisma.billingAddress.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
}
