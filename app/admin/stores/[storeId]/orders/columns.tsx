"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

export type OrderColumn = {
    id: string;
    customer: string;
    total: number;
    storeId: string; // Added storeId
    status: string;
    createdAt: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
    {
        accessorKey: "id",
        header: "Order ID",
    },
    {
        accessorKey: "customer",
        header: "Customer",
    },
    {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.getValue("total")),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant={
                    status === "PAID" || status === "COMPLETED" ? "default" :
                        status === "PENDING" ? "secondary" : "destructive"
                }>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: "Date",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const order = row.original;
            return (
                <Link href={`/admin/stores/${order.storeId}/orders/${order.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                    </Button>
                </Link>
            )
        }
    }
];
