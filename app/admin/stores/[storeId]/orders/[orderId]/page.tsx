import { notFound, redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import * as orderService from '@/services/order.service';
import { OrderDetailsClient } from './client';

export default async function OrderDetailsPage({
    params,
}: {
    params: { storeId: string; orderId: string };
}) {
    const { storeId, orderId } = await params;

    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        redirect('/login');
    }

    const order = await orderService.getOrder(tenant.userId, storeId, orderId);

    if (!order) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrderDetailsClient order={order} storeId={storeId} />
            </div>
        </div>
    );
}
