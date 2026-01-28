import { AdminShell } from "@/components/admin/admin-shell";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";
import * as storeService from '@/services/store.service';
import { getRbacContext } from '@/lib/rbac';
import { AuthProvider } from '@/components/auth/auth-provider';


export default async function StoreAdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ storeId: string }>;
}) {
    const { storeId } = await params;

    // 1. Resolve Tenant & Basic Access (throws if unauthorized)
    let tenant;
    try {
        tenant = await resolveTenant(storeId);
    } catch (error) {
        // User doesn't have access to this store
        redirect("/admin");
    }

    if (!tenant.userId) {
        redirect("/login?callbackUrl=/admin/stores/" + storeId);
    }

    // 2. Strict RBAC Scope Validation
    // Ensure the user actually has a role relevant to this store
    const authContext = await getRbacContext({ storeId });

    // We allow Super Admins or direct Store Staff ONLY.
    // Tenant Admins must be added as staff.
    const hasAccess =
        authContext?.isSuperAdmin ||
        authContext?.scopes.some(s =>
            ['store_owner', 'store_manager', 'store_support'].includes(s)
        );

    if (!hasAccess) {
        redirect("/admin");
    }

    // Fetch store details for the header/title
    const store = await storeService.getStoreWithAccount(storeId);
    if (!store) {
        return <div>Store not found</div>;
    }

    const stores = await storeService.listStoresForUser(tenant.userId);

    // Context is already fetched above for validation
    // const authContext = await getRbacContext({ storeId });

    return (
        <AuthProvider value={authContext}>
            <AdminShell storeId={storeId} stores={stores}>
                {children}
            </AdminShell>
        </AuthProvider>
    );
}
