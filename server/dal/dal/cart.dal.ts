import prisma from '@/lib/prisma';
import { CartEventType, Prisma } from '@/app/generated/prisma';

export async function findCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    const { userId, sessionId, cartId } = query;

    if (!userId && !sessionId && !cartId) {
        throw new Error('Must provide userId, sessionId, or cartId');
    }

    return prisma.cart.findFirst({
        where: {
            storeId,
            ...(cartId ? { id: cartId } : {}),
            ...(userId ? { userId } : {}),
            ...(sessionId ? { sessionId } : {}),
        },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            product: true,
                            images: true,
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });
}

export async function createCart(storeId: string, data: { userId?: string; sessionId?: string }) {
    return prisma.cart.create({
        data: {
            storeId,
            userId: data.userId,
            sessionId: data.sessionId,
        },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                            product: true,
                            images: true,
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });
}

export async function addItemToCart(
    storeId: string,
    cartId: string,
    data: { variantId: string; quantity: number }
) {
    // First verify cart exists and belongs to store
    const cart = await prisma.cart.findFirst({
        where: { id: cartId, storeId }
    });

    if (!cart) throw new Error('Cart not found');

    // Check if item already exists
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            cartId_variantId: {
                cartId,
                variantId: data.variantId
            }
        }
    });

    if (existingItem) {
        return prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + data.quantity },
            include: {
                variant: {
                    include: {
                        product: true,
                        images: true
                    }
                }
            }
        });
    } else {
        return prisma.cartItem.create({
            data: {
                cartId,
                variantId: data.variantId,
                quantity: data.quantity
            },
            include: {
                variant: {
                    include: {
                        product: true,
                        images: true
                    }
                }
            }
        });
    }
}

export async function updateCartItem(
    storeId: string,
    cartId: string,
    variantId: string,
    quantity: number
) {
    const cart = await prisma.cart.findFirst({
        where: { id: cartId, storeId }
    });

    if (!cart) throw new Error('Cart not found');

    return prisma.cartItem.update({
        where: {
            cartId_variantId: {
                cartId,
                variantId
            }
        },
        data: { quantity },
        include: {
            variant: {
                include: {
                    product: true,
                    images: true
                }
            }
        }
    });
}

export async function removeItemFromCart(storeId: string, cartId: string, variantId: string) {
    const cart = await prisma.cart.findFirst({
        where: { id: cartId, storeId }
    });

    if (!cart) throw new Error('Cart not found');

    return prisma.cartItem.delete({
        where: {
            cartId_variantId: {
                cartId,
                variantId
            }
        }
    });
}

export async function clearCart(cartId: string) {
    return prisma.cartItem.deleteMany({
        where: { cartId }
    });
}

export async function deleteCart(storeId: string, cartId: string) {
    return prisma.cart.deleteMany({
        where: {
            id: cartId,
            storeId
        }
    });
}
