import { resolveTenant } from "@/lib/tenant/resolveTenant";
import * as storeDal from "@/dal/store.dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { SeedStoreButton } from "@/components/admin/SeedStoreButton";

export const dynamic = 'force-dynamic';

export default async function StoreDashboard({
    params,
}: {
    params: Promise<{ storeId: string }>;
}) {
    const { storeId } = await params;

    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        redirect("/login");
    }

    const overview = await storeDal.getStoreOverview(storeId);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Store Overview</h1>
                <SeedStoreButton storeId={storeId} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(overview.revenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total sales
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.orders}</div>
                        <p className="text-xs text-muted-foreground">
                            Total orders
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.products}</div>
                        <p className="text-xs text-muted-foreground">
                            Active products
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overview.lowStock}</div>
                        <p className="text-xs text-muted-foreground">
                            Variants with low inventory
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
