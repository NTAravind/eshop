"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";

export type CustomerColumn = {
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
};

export const columns: ColumnDef<CustomerColumn>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "totalOrders",
        header: "Orders",
    },
    {
        accessorKey: "totalSpent",
        header: "Total Spent",
        cell: ({ row }) => formatCurrency(row.getValue("totalSpent")),
    },
    {
        accessorKey: "lastOrderAt",
        header: "Last Order",
    },
];
