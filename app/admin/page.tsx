'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Store as StoreIcon, ExternalLink, RefreshCw, BarChart3, ShoppingCart, Package } from 'lucide-react';
import { CreateStoreDialog } from '@/components/admin/create-store-dialog';
import { InviteStoreAdminDialog } from '@/components/admin/invite-store-with-role-dialog';
import { EmailConfigDialog } from '@/components/admin/email-config-dialog';
import { AdminShell } from '@/components/admin/admin-shell';
import { Loader2 } from 'lucide-react';
import { Store } from '../generated/prisma';

interface DashboardData {
    account: {
        id: string;
        name: string;
    };
    stores: Array<{
        id: string;
        name: string;
        slug: string;
        orderCount: number;
        productCount: number;
    }>;
    stats: {
        revenue: number;
        orders: number;
        products: number;
        storeCount: number;
    };
    type?: 'TENANT_ADMIN' | 'STORE_STAFF';
}

export default function TenantAdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/tenant/dashboard');
            if (res.status === 401) {
                window.location.href = '/auth/signin?callbackUrl=/admin';
                return;
            }
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to fetch dashboard data');
            }
            const jsonData = await res.json();

            // Handle Store Staff Redirect
            if (jsonData.type === 'STORE_STAFF') {
                if (jsonData.stores.length === 1) {
                    router.push(`/admin/stores/${jsonData.stores[0].id}/overview`);
                    return; // Stop rendering
                }
                // If multiple stores, we let it fall through to render the list
                // But we need to make sure the UI handles account=null
            }

            setData(jsonData);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Dashboard</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchDashboardData}>Try Again</Button>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { account, stores, stats, type } = data as any; // Cast for now logic

    return (
        <AdminShell stores={stores}>
            <div className="space-y-8">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {account ? account.name : 'Store Access'} <span className="text-muted-foreground text-lg ml-2 font-normal">
                                {account ? 'Tenant Overview' : 'Select Store'}
                            </span>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {account
                                ? 'Manage your stores, staff, and view aggregated performance.'
                                : 'Select a store to manage operations.'}
                        </p>
                    </div>
                    {account && (
                        <div className="flex items-center gap-2">
                            <EmailConfigDialog />
                            <InviteStoreAdminDialog
                                stores={stores}
                                trigger={
                                    <Button variant="outline">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Invite Store Admin
                                    </Button>
                                }
                            />
                            <CreateStoreDialog />
                        </div>
                    )}
                </div>

                {/* Stats Grid - Only show for Tenant Admin */}
                {account && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <span className="text-lg font-bold">₹</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Across all stores
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.orders}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.products}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
                                <StoreIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.storeCount}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Stores Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <StoreIcon className="h-5 w-5" />
                            Your Stores
                        </h2>
                        <Button variant="ghost" size="sm" onClick={fetchDashboardData}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                        </Button>
                    </div>

                    {stores.length === 0 ? (
                        <Card className="border-dashed bg-muted/50">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
                                    <StoreIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No stores configured</h3>
                                <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                                    You haven't created any stores yet. Launch your first online store today to start selling.
                                </p>
                                <CreateStoreDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {stores.map((store: DashboardData['stores'][0]) => (
                                <Card key={store.id} className="group hover:shadow-md transition-shadow flex flex-col">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex justify-between items-start">
                                            {store.name}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs truncate bg-muted p-1 rounded w-fit">
                                            {store.slug}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3 pb-3">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex flex-col p-2 bg-muted/30 rounded">
                                                <span className="text-muted-foreground text-xs">Orders</span>
                                                <span className="font-semibold">{store.orderCount}</span>
                                            </div>
                                            <div className="flex flex-col p-2 bg-muted/30 rounded">
                                                <span className="text-muted-foreground text-xs">Products</span>
                                                <span className="font-semibold">{store.productCount}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-3 border-t bg-muted/10">
                                        <div className="w-full flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1" asChild>
                                                <Link href={`/admin/stores/${store.id}/overview`}>
                                                    Dashboard
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                                <a href={`http://${store.slug}.${process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'}`} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
