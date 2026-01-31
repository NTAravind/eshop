import prisma from '@/lib/prisma';
import { CartEventType, Prisma } from '@/app/generated/prisma';

export async function logCartEvent(
    cartId: string,
    type: CartEventType,
    metadata?: any
) {
    return prisma.cartEvent.create({
        data: {
            cartId,
            type,
            metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        }
    });
}

export async function getCartAnalytics(storeId: string, periodStart: Date, periodEnd: Date) {
    // Example: Count abandoned carts (carts created but not converted to orders)
    // This is a simplified analytic. For robust analytics, we'd need to join with Orders or have 'CONVERTED' events.

    const createdEvents = await prisma.cartEvent.count({
        where: {
            cart: { storeId },
            type: 'CREATED',
            createdAt: { gte: periodStart, lte: periodEnd }
        }
    });

    const convertedEvents = await prisma.cartEvent.count({
        where: {
            cart: { storeId },
            type: 'CONVERTED',
            createdAt: { gte: periodStart, lte: periodEnd }
        }
    });

    const abandonedEvents = await prisma.cartEvent.count({
        where: {
            cart: { storeId },
            type: 'ABANDONED',
            createdAt: { gte: periodStart, lte: periodEnd }
        }
    });

    return {
        cartsCreated: createdEvents,
        cartsConverted: convertedEvents,
        cartsAbandoned: abandonedEvents,
        conversionRate: createdEvents > 0 ? (convertedEvents / createdEvents) * 100 : 0
    };
}
