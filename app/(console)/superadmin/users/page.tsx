'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Search, Users, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { KPICard } from '@/components/superadmin/kpi-card';

interface UserRow {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    ownedAccountsCount: number;
}

export default function UsersPage() {
    const [data, setData] = useState<UserRow[]>([]);
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

                const response = await fetch(`/api/superadmin/users?${params}`);
                const result = await response.json();

                if (response.ok) {
                    setData(result.users.map((u: any) => ({
                        id: u.id,
                        email: u.email,
                        name: u.name,
                        createdAt: new Date(u.createdAt),
                        ownedAccountsCount: u.ownedAccounts.length,
                    })));
                    setTotalCount(result.total);
                } else {
                    toast.error('Failed to load users');
                }
            } catch (error) {
                toast.error('Error loading users');
                console.error('Fetch users error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [page, pageSize, debouncedSearch]);

    const columns = useMemo<ColumnDef<UserRow>[]>(
        () => [
            {
                accessorKey: 'image',
                header: '',
                cell: ({ row }) => (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {row.original.name?.[0] || row.original.email[0].toUpperCase()}
                    </div>
                ),
            },
            {
                accessorKey: 'name',
                header: 'Name',
                cell: ({ row }) => (
                    <div className="font-medium">{row.original.name || 'N/A'}</div>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
            },
            {
                accessorKey: 'ownedAccountsCount',
                header: 'Accounts',
                cell: ({ row }) => (
                    <div className="text-center md:text-left pl-4">{row.original.ownedAccountsCount}</div>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Joined',
                cell: ({ row }) => format(row.original.createdAt, 'MMM dd, yyyy'),
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
                                Copy User ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.email)}>
                                Copy Email
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                <p className="text-muted-foreground">
                    Manage system-wide users and permissions.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <KPICard
                    title="Total Users"
                    value={totalCount}
                    icon={Users}
                    description="Total registered users across the platform"
                />
                <KPICard
                    title="New Users (Visible)"
                    value={data.length}
                    icon={UserPlus}
                    description="Users displayed on this page"
                    isLoading={isLoading}
                />
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
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
