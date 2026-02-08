import { NextResponse } from 'next/server';
import * as orderService from '@/services/order.service';
import { getSessionUser } from '@/lib/auth/getSession';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ storeId: string; orderId: string }> }
) {
    try {
        const { storeId, orderId } = await params;
        const user = await getSessionUser();

        if (!user?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const order = await orderService.completeOrder(user.id, storeId, orderId);

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
