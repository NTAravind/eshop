import prisma from '@/server/db/prisma';
import '@/app/generated/prisma';

/**
 * Find a cart with clear preference semantics:
 * 1. If cartId is provided, use it exclusively
 * 2. Otherwise, if userId is provided, find user's cart
 * 3. Otherwise, if sessionId is provided, find session's cart
 */
export async function findCart(storeId: string, query: { userId?: string; sessionId?: string; cartId?: string }) {
    const { userId, sessionId, cartId } = query;

    if (!userId && !sessionId && !cartId) {
        throw new Error('Must provide userId, sessionId, or cartId');
    }

    // Prefer cartId if provided
    if (cartId) {
        return prisma.cart.findFirst({
            where: { id: cartId, storeId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: {
                                        images: true,
                                    },
                                },
                                images: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
    }

    // Then prefer userId
    if (userId) {
        return prisma.cart.findFirst({
            where: { userId, storeId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    include: {
                                        images: true,
                                    },
                                },
                                images: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
    }

    // Finally use sessionId
    return prisma.cart.findFirst({
        where: { sessionId, storeId },
        include: {
            items: {
                include: {
                    variant: {
                        include: {
                                product: {
                                    include: {
                                        images: true,
                                    },
                                },
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
                                product: {
                                    include: {
                                        images: true,
                                    },
                                },
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
                        product: {
                            include: {
                                images: true,
                            },
                        },
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
                        product: {
                            include: {
                                images: true,
                            },
                        },
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
                        product: {
                            include: {
                                images: true,
                            },
                        },
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

/**
 * Merge session cart into user cart
 * Called when a user logs in and we need to merge their guest cart into their user cart
 */
export async function mergeSessionCartIntoUserCart(
    storeId: string,
    userCart: { id: string },
    sessionCart: { id: string }
) {
    // Get all items from session cart
    const sessionItems = await prisma.cartItem.findMany({
        where: { cartId: sessionCart.id }
    });

    // For each session cart item
    for (const sessionItem of sessionItems) {
        // Check if the same variant exists in user cart
        const existingUserItem = await prisma.cartItem.findUnique({
            where: {
                cartId_variantId: {
                    cartId: userCart.id,
                    variantId: sessionItem.variantId
                }
            }
        });

        if (existingUserItem) {
            // Merge quantities
            await prisma.cartItem.update({
                where: { id: existingUserItem.id },
                data: { quantity: existingUserItem.quantity + sessionItem.quantity }
            });
        } else {
            // Move item to user cart
            await prisma.cartItem.update({
                where: { id: sessionItem.id },
                data: { cartId: userCart.id }
            });
        }
    }

    // Delete the session cart
    await prisma.cart.delete({
        where: { id: sessionCart.id }
    });

    // Return the updated user cart
    return findCart(storeId, { cartId: userCart.id });
}
