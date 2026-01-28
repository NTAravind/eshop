'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, ShoppingCart, Users } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { KPICard } from '@/components/superadmin/kpi-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UsageRow {
    id: string;
    accountId: string;
    accountName: string;
    periodStart: Date;
    periodEnd: Date;
    apiRequestCount: number;
    storeCount: number;
    productCount: number;
    orderCount: number;
}

export default function ApiUsagePage() {
    const [data, setData] = useState<UsageRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    skip: ((page - 1) * pageSize).toString(),
                    take: pageSize.toString(),
                });

                if (debouncedSearch) {
                    params.append('search', debouncedSearch);
                }

                const response = await fetch(`/api/superadmin/usage?${params}`);
                const result = await response.json();

                if (response.ok) {
                    setData(result.usage.map((u: any) => ({
                        id: u.id,
                        accountId: u.account.id,
                        accountName: u.account.name,
                        periodStart: new Date(u.periodStart),
                        periodEnd: new Date(u.periodEnd),
                        apiRequestCount: u.apiRequestCount,
                        storeCount: u.storeCount,
                        productCount: u.productCount,
                        orderCount: u.orderCount,
                    })));
                    setTotalCount(result.total);
                } else {
                    toast.error('Failed to load usage data');
                }
            } catch (error) {
                toast.error('Error loading usage data');
                console.error('Fetch usage error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [page, pageSize, debouncedSearch]);

    const columns = useMemo<ColumnDef<UsageRow>[]>(
        () => [
            {
                accessorKey: 'accountName',
                header: 'Account',
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.accountName}</div>
                ),
            },
            {
                accessorKey: 'periodEnd',
                header: 'Period Ending',
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {format(row.original.periodEnd, 'MMM dd, yyyy')}
                    </div>
                ),
            },
            {
                accessorKey: 'apiRequestCount',
                header: 'API Requests',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        {row.original.apiRequestCount.toLocaleString()}
                    </div>
                ),
            },
            {
                accessorKey: 'storeCount',
                header: 'Stores',
                cell: ({ row }) => row.original.storeCount.toLocaleString(),
            },
            {
                accessorKey: 'productCount',
                header: 'Products',
                cell: ({ row }) => row.original.productCount.toLocaleString(),
            },
            {
                accessorKey: 'orderCount',
                header: 'Orders',
                cell: ({ row }) => row.original.orderCount.toLocaleString(),
            },
        ],
        []
    );

    // Calculate aggregates from visible data for now
    // In a real app, these should come from an analytics endpoint
    const totalRequests = data.reduce((acc, curr) => acc + curr.apiRequestCount, 0);
    const totalOrders = data.reduce((acc, curr) => acc + curr.orderCount, 0);
    const activeStores = data.reduce((acc, curr) => acc + curr.storeCount, 0);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">System Usage</h1>
                <p className="text-muted-foreground">
                    Monitor resource usage across all billing accounts.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <KPICard
                    title="Total API Requests (Page)"
                    value={totalRequests.toLocaleString()}
                    icon={Activity}
                    description="Aggregated API calls for visible accounts"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Total Orders (Page)"
                    value={totalOrders.toLocaleString()}
                    icon={ShoppingCart}
                    description="Aggregated order count for visible accounts"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Active Stores (Page)"
                    value={activeStores.toLocaleString()}
                    icon={Database}
                    description="Total stores for visible accounts"
                    isLoading={isLoading}
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search accounts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <DataTable
                    columns={columns}
                    data={data}
                    isLoading={isLoading}
                    pageCount={Math.ceil(totalCount / pageSize)}
                    pageIndex={page - 1}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
