import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import * as storeService from "@/services/store.service";
import { getRbacContext } from "@/lib/rbac";

export default async function AdminPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/auth/signin?callbackUrl=/admin");
    }

    const userId = session.user.id;

    // Check if user is a Super Admin
    const authContext = await getRbacContext({});

    if (authContext?.isSuperAdmin) {
        redirect("/superadmin");
    }

    // Get all stores for this user
    const stores = await storeService.listStoresForUser(userId);

    if (!stores || stores.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">No Stores Found</h1>
                    <p className="text-muted-foreground">
                        You don't have access to any stores yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please contact an administrator to get access.
                    </p>
                </div>
            </div>
        );
    }

    // Redirect to the first store
    redirect(`/admin/stores/${stores[0].id}/overview`);
}
