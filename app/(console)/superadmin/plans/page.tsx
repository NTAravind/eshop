'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
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
import { MoreHorizontal, Trash, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { CreatePlanDialog, UpdatePlanDialog } from '@/components/superadmin/plans-dialogs';
import { deletePlanAction } from '@/app/superadmin/actions/superadmin.actions';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanType } from '@/app/generated/prisma';

interface PlanRow {
    id: string;
    name: string;
    type: PlanType;
    price: number;
    yearlyPrice?: number | null;
    maxStores?: number | null;
    maxProducts?: number | null;
    maxOrdersPerMonth?: number | null;
    maxAPIRequestsPerMonth?: number | null;
    isActive: boolean;
    description?: string | null;
    subscriberCount: number;
    createdAt: Date;
}

export default function PlansPage() {
    const [data, setData] = useState<PlanRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/superadmin/plans');
            const result = await response.json();

            if (response.ok) {
                setData(result.plans.map((p: any) => ({
                    ...p,
                    createdAt: new Date(p.createdAt),
                    subscriberCount: p._count?.subscriptions || 0,
                })));
            } else {
                toast.error('Failed to load plans');
            }
        } catch (error) {
            toast.error('Error loading plans');
            console.error('Fetch plans error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete plan "${name}"?`)) return;

        const result = await deletePlanAction(id);
        if (result.success) {
            toast.success('Plan deleted successfully');
            fetchData();
        } else {
            toast.error(result.error);
        }
    };

    const columns = useMemo<ColumnDef<PlanRow>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Plan Name',
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-xs text-muted-foreground">{row.original.description}</div>
                    </div>
                ),
            },
            {
                accessorKey: 'type',
                header: 'Code',
                cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
            },
            {
                accessorKey: 'price',
                header: 'Price',
                cell: ({ row }) => {
                    const price = row.original.price;
                    const yearly = row.original.yearlyPrice;
                    return (
                        <div className="flex flex-col text-sm">
                            <span>${price}/mo</span>
                            {yearly && <span className="text-xs text-muted-foreground">${yearly}/yr</span>}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'subscriberCount',
                header: 'Subscribers',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {row.original.subscriberCount}
                    </div>
                ),
            },
            {
                accessorKey: 'limits',
                header: 'Limits',
                cell: ({ row }) => (
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div>Stores: {row.original.maxStores || 'Unlimited'}</div>
                        <div>Products: {row.original.maxProducts || 'Unlimited'}</div>
                    </div>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                cell: ({ row }) => (
                    <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
                        {row.original.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <UpdatePlanDialog
                            plan={row.original}
                            onSuccess={fetchData}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(row.original.id, row.original.name)}
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Plan
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        []
    );

    const chartData = data.map(p => ({
        name: p.name,
        users: p.subscriberCount,
        fill: p.isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
    }));

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Plans</h1>
                    <p className="text-muted-foreground">
                        Manage subscription tiers and pricing.
                    </p>
                </div>
                <CreatePlanDialog onSuccess={fetchData} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-1 md:col-span-3">
                    <CardHeader>
                        <CardTitle>Subscriber Distribution</CardTitle>
                        <CardDescription>Active subscriptions by plan type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs font-medium"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
                                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '6px',
                                        }}
                                    />
                                    <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DataTable
                columns={columns}
                data={data}
                isLoading={isLoading}
                pageCount={1}
                pageIndex={0}
            />
        </div>
    );
}
