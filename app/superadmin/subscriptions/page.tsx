'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { KPICard } from '@/components/superadmin/kpi-card';
import { PlanType, SubscriptionStatus, BillingCycle } from '@/app/generated/prisma';

interface SubscriptionRow {
    id: string;
    accountId: string;
    accountName: string;
    planType: PlanType;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    currentPeriodEnd: Date;
    createdAt: Date;
}

export default function SubscriptionsPage() {
    const [data, setData] = useState<SubscriptionRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
    const [sorting, setSorting] = useState<SortingState>([]);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    skip: ((page - 1) * pageSize).toString(),
                    take: pageSize.toString(),
                });

                if (statusFilter !== 'all') {
                    params.append('status', statusFilter);
                }

                const response = await fetch(`/api/superadmin/subscriptions?${params}`);
                const result = await response.json();

                if (response.ok) {
                    setData(result.subscriptions.map((sub: any) => ({
                        id: sub.id,
                        accountId: sub.accountId,
                        accountName: sub.account.name,
                        planType: sub.plan.type,
                        status: sub.status,
                        billingCycle: sub.billingCycle,
                        currentPeriodEnd: new Date(sub.currentPeriodEnd),
                        createdAt: new Date(sub.createdAt),
                    })));
                    setTotalCount(result.total);
                } else {
                    toast.error('Failed to load subscriptions');
                }
            } catch (error) {
                toast.error('Error loading subscriptions');
                console.error('Fetch subscriptions error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [page, pageSize, statusFilter]);

    const columns = useMemo<ColumnDef<SubscriptionRow>[]>(
        () => [
            {
                accessorKey: 'accountName',
                header: 'Account',
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.accountName}</div>
                ),
            },
            {
                accessorKey: 'planType',
                header: 'Plan',
                cell: ({ row }) => (
                    <Badge variant="outline">{row.original.planType}</Badge>
                ),
            },
            {
                accessorKey: 'billingCycle',
                header: 'Billing',
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground capitalize">
                        {row.original.billingCycle.toLowerCase()}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const status = row.original.status;
                    const colors: Record<SubscriptionStatus, string> = {
                        ACTIVE: 'bg-green-100 text-green-800',
                        CANCELED: 'bg-red-100 text-red-800',
                        PAST_DUE: 'bg-yellow-100 text-yellow-800',
                        TRIALING: 'bg-blue-100 text-blue-800',
                    };
                    return (
                        <Badge className={colors[status]} variant="secondary">
                            {status}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'currentPeriodEnd',
                header: 'Renews/Expires',
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {format(row.original.currentPeriodEnd, 'MMM dd, yyyy')}
                    </div>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.accountId)}>
                                Copy Account ID
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    // Metrics calculation (simplified for now based on current page/total)
    // In a real app, these should come from a dedicated stats endpoint
    const activeSubs = data.filter(s => s.status === 'ACTIVE').length; // approximation
    const trailingSubs = data.filter(s => s.status === 'TRIALING').length;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                <p className="text-muted-foreground">
                    Manage subscription plans and billing cycles.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <KPICard
                    title="Total Subscriptions"
                    value={totalCount}
                    icon={CreditCard}
                    description="All active and inactive subscriptions"
                />
                <KPICard
                    title="Active Plans"
                    value={activeSubs} // Ideally fetch real count
                    icon={CheckCircle}
                    description="Currently active subscriptions (visible page)"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Trialing"
                    value={trailingSubs} // Ideally fetch real count
                    icon={Clock}
                    description="Accounts currently in trial (visible page)"
                    isLoading={isLoading}
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
    );
}
