import { AdminShell } from "@/components/admin/admin-shell";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";
import * as storeService from '@/services/store.service';

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ storeId: string }>;
}) {
    const { storeId } = await params;

    // We can re-fetch or rely on parent. But AdminShell needs data.
    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) redirect("/login");

    const store = await storeService.getStoreWithAccount(storeId);
    if (!store) {
        return <div>Store not found</div>;
    }

    const stores = await storeService.listStoresForUser(tenant.userId);

    return (
        <AdminShell storeId={storeId} stores={stores}>
            {children}
        </AdminShell>
    );
}
