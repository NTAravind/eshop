'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
} from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { PlanType, SubscriptionStatus } from '@/app/generated/prisma';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { suspendAccountAction, reactivateAccountAction } from '@/app/superadmin/actions/superadmin.actions';

interface BillingAccountRow {
    id: string;
    name: string;
    ownerEmail: string | null;
    subscriptionPlan: PlanType | null;
    subscriptionStatus: SubscriptionStatus | null;
    storeCount: number;
    apiUsageLast30Days: number;
    createdAt: Date;
}

interface AccountsTableProps {
    onAssignSubscription?: (accountId: string) => void;
    onCreateStore?: (accountId: string) => void;
}

export function AccountsTable({ onAssignSubscription, onCreateStore }: AccountsTableProps) {
    const [data, setData] = useState<BillingAccountRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState<PlanType | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: pageSize.toString(),
                });

                if (debouncedSearch) {
                    params.append('search', debouncedSearch);
                }

                if (planFilter !== 'all') {
                    params.append('planType', planFilter);
                }

                if (statusFilter !== 'all') {
                    params.append('status', statusFilter);
                }

                if (sorting.length > 0) {
                    params.append('sortBy', sorting[0].id);
                    params.append('sortOrder', sorting[0].desc ? 'desc' : 'asc');
                }

                const response = await fetch(`/api/superadmin/accounts?${params}`);
                const result = await response.json();

                if (response.ok) {
                    setData(result.accounts.map((acc: any) => ({
                        ...acc,
                        createdAt: new Date(acc.createdAt),
                    })));
                    setTotalCount(result.totalCount);
                } else {
                    toast.error('Failed to load accounts');
                }
            } catch (error) {
                toast.error('Error loading accounts');
                console.error('Fetch accounts error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [page, pageSize, debouncedSearch, planFilter, statusFilter, sorting]);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast.success('Account ID copied');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSuspend = async (accountId: string) => {
        const result = await suspendAccountAction(accountId);
        if (result.success) {
            toast.success('Account suspended');
            // Refresh data
            setPage(p => p); // Trigger re-fetch
        } else {
            toast.error(result.error || 'Failed to suspend account');
        }
    };

    const handleReactivate = async (accountId: string) => {
        const result = await reactivateAccountAction(accountId);
        if (result.success) {
            toast.success('Account reactivated');
            // Refresh data
            setPage(p => p); // Trigger re-fetch
        } else {
            toast.error(result.error || 'Failed to reactivate account');
        }
    };

    const columns = useMemo<ColumnDef<BillingAccountRow>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'Account ID',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                            {row.original.id.slice(0, 8)}...
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyId(row.original.id)}
                        >
                            {copiedId === row.original.id ? (
                                <Check className="h-3 w-3" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                ),
            },
            {
                accessorKey: 'name',
                header: 'Account Name',
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.name}</div>
                ),
            },
            {
                accessorKey: 'ownerEmail',
                header: 'Owner Email',
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {row.original.ownerEmail || 'N/A'}
                    </div>
                ),
            },
            {
                accessorKey: 'subscriptionPlan',
                header: 'Plan',
                cell: ({ row }) => {
                    const plan = row.original.subscriptionPlan;
                    if (!plan) return <Badge variant="outline">None</Badge>;

                    const colors: Record<PlanType, string> = {
                        FREE: 'bg-gray-100 text-gray-800',
                        BASIC: 'bg-blue-100 text-blue-800',
                        PRO: 'bg-purple-100 text-purple-800',
                        ENTERPRISE: 'bg-orange-100 text-orange-800',
                    };

                    return (
                        <Badge className={colors[plan]} variant="secondary">
                            {plan}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'subscriptionStatus',
                header: 'Status',
                cell: ({ row }) => {
                    const status = row.original.subscriptionStatus;
                    if (!status) return <Badge variant="outline">None</Badge>;

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
                accessorKey: 'storeCount',
                header: 'Stores',
                cell: ({ row }) => (
                    <div className="text-center">{row.original.storeCount}</div>
                ),
            },
            {
                accessorKey: 'apiUsageLast30Days',
                header: 'API Usage',
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {row.original.apiUsageLast30Days.toLocaleString()}
                    </div>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground">
                        {format(row.original.createdAt, 'MMM dd, yyyy')}
                    </div>
                ),
            },
            {
                id: 'actions',
                cell: ({ row }) => {
                    const account = row.original;
                    const isActive = account.subscriptionStatus === SubscriptionStatus.ACTIVE;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCopyId(account.id)}>
                                    Copy Account ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onAssignSubscription?.(account.id)}
                                >
                                    Assign Subscription
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onCreateStore?.(account.id)}
                                >
                                    Create Store
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {isActive ? (
                                    <DropdownMenuItem
                                        onClick={() => handleSuspend(account.id)}
                                        className="text-red-600"
                                    >
                                        Suspend Account
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() => handleReactivate(account.id)}
                                        className="text-green-600"
                                    >
                                        Reactivate Account
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [copiedId, onAssignSubscription, onCreateStore]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: Math.ceil(totalCount / pageSize),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Billing Accounts</CardTitle>
                <CardDescription>
                    Manage all billing accounts and subscriptions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by email or account ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={planFilter}
                        onValueChange={(value) => {
                            setPlanFilter(value as PlanType | 'all');
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by plan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Plans</SelectItem>
                            <SelectItem value="FREE">FREE</SelectItem>
                            <SelectItem value="BASIC">BASIC</SelectItem>
                            <SelectItem value="PRO">PRO</SelectItem>
                            <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value as SubscriptionStatus | 'all');
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                            <SelectItem value="CANCELED">CANCELED</SelectItem>
                            <SelectItem value="PAST_DUE">PAST_DUE</SelectItem>
                            <SelectItem value="TRIALING">TRIALING</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {columns.map((_, j) => (
                                            <TableCell key={j}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <p className="text-muted-foreground">No accounts found</p>
                                            <p className="text-sm text-muted-foreground">
                                                Try adjusting your filters or create a new client
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {(page - 1) * pageSize + 1} to{' '}
                        {Math.min(page * pageSize, totalCount)} of {totalCount} accounts
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isLoading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
