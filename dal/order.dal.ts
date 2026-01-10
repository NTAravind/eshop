import   prisma   from '@/lib/prisma';
import { OrderStatus, Prisma } from '@/app/generated/prisma';

export async function createOrder(
  storeId: string,
  data: {
    userId?: string;
    total: number;
    status: OrderStatus;
    lines: Array<{
      variantId: string;
      quantity: number;
      price: number;
    }>;
  }
) {
  return prisma.order.create({
    data: {
      storeId,
      userId: data.userId,
      total: data.total,
      status: data.status,
      lines: {
        create: data.lines,
      },
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
      payments: true,
    },
  });
}

export async function getOrderById(storeId: string, orderId: string) {
  return prisma.order.findFirst({
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
      payments: true,
    },
  });
}

export async function listOrders(
  storeId: string,
  filters?: {
    userId?: string;
    status?: OrderStatus;
    skip?: number;
    take?: number;
  }
) {
  const where: Prisma.OrderWhereInput = {
    storeId,
    ...(filters?.userId && { userId: filters.userId }),
    ...(filters?.status && { status: filters.status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: filters?.skip ?? 0,
      take: filters?.take ?? 50,
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
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

export async function updateOrderStatus(
  storeId: string,
  orderId: string,
  status: OrderStatus
) {
  // Verify order belongs to store
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return prisma.order.update({
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
      payments: true,
    },
  });
}

export async function createOrderLine(
  storeId: string,
  orderId: string,
  data: {
    variantId: string;
    quantity: number;
    price: number;
  }
) {
  // Verify order belongs to store
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify variant belongs to store
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: data.variantId,
      product: {
        storeId,
      },
    },
  });

  if (!variant) {
    throw new Error('Variant not found');
  }

  return prisma.orderLine.create({
    data: {
      orderId,
      variantId: data.variantId,
      quantity: data.quantity,
      price: data.price,
    },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });
}

export async function deleteOrder(storeId: string, orderId: string) {
  // Verify order belongs to store
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return prisma.order.delete({
    where: { id: orderId },
  });
}