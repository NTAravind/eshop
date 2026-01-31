import { format } from "date-fns";
import { OrdersClient } from "./client";
import { OrderColumn } from "./columns";
import * as orderService from "@/services/order.service";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
    params,
    searchParams
}: {
    params: { storeId: string };
    searchParams: { page?: string };
}) {
    const { storeId } = await params;
    const { page } = await searchParams;

    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        redirect("/login");
    }

    const pageIndex = page ? parseInt(page) - 1 : 0;
    const pageSize = 10;

    const result = await orderService.listOrders(tenant.userId, storeId, {
        skip: pageIndex * pageSize,
        take: pageSize
    });

    const formattedOrders: OrderColumn[] = result.orders.map((item) => ({
        id: item.id,
        storeId,
        customer: item.user?.name || item.user?.email || "Guest",
        total: item.total,
        status: item.status,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    const pageCount = Math.ceil(result.total / pageSize);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrdersClient
                    data={formattedOrders}
                    pageCount={pageCount}
                    pageIndex={pageIndex}
                />
            </div>
        </div>
    );
}
