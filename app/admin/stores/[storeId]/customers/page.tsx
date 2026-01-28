import { format } from "date-fns";
import { CustomersClient } from "./client";
import { CustomerColumn } from "./columns";
import * as customerDal from "@/dal/customer.dal";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
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

    const result = await customerDal.listStoreCustomers(storeId, {
        skip: pageIndex * pageSize,
        take: pageSize
    });

    const formattedCustomers: CustomerColumn[] = result.customers.map((item) => ({
        id: item.id,
        name: item.name || "Unknown",
        email: item.email,
        totalOrders: item.totalOrders,
        totalSpent: item.totalSpent,
        lastOrderAt: item.lastOrderAt ? format(item.lastOrderAt, "MMMM do, yyyy") : "Never",
    }));

    const pageCount = Math.ceil(result.total / pageSize);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CustomersClient
                    data={formattedCustomers}
                    pageCount={pageCount}
                    pageIndex={pageIndex}
                />
            </div>
        </div>
    );
}
