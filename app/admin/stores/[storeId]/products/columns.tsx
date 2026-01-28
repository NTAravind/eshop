"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CellAction } from "./cell-action";

export type ProductColumn = {
    id: string;
    name: string;
    productType: string;
    category: string;
    isActive: boolean;
    createdAt: string;
    sku: string;
    price: number;
    stock: number;
    // Index signature for dynamic fields
    [key: string]: any;
};

export const getColumns = (schemaFields: any[] = []): ColumnDef<ProductColumn>[] => {
    const defaultColumns: ColumnDef<ProductColumn>[] = [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "sku",
            header: "SKU",
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }) => formatCurrency(row.getValue("price")),
        },
        {
            accessorKey: "stock",
            header: "Stock",
        },
        {
            accessorKey: "productType",
            header: "Product Type",
        },
        {
            accessorKey: "category",
            header: "Category",
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? "default" : "secondary"}>
                    {row.original.isActive ? "Active" : "Draft"}
                </Badge>
            ),
        }
    ];

    // Add dynamic columns from schema
    const dynamicColumns: ColumnDef<ProductColumn>[] = schemaFields.map(field => ({
        accessorKey: `customData.${field.key}`,
        header: field.label,
        cell: ({ row }) => {
            const val = row.original?.customData?.[field.key];
            if (field.type === 'boolean') {
                return val ? "Yes" : "No";
            }
            return val || "-";
        }
    }));

    // Combine: Default -> Dynamic -> Date -> Actions
    return [
        ...defaultColumns,
        ...dynamicColumns,
        {
            accessorKey: "createdAt",
            header: "Date",
        },
        {
            id: "actions",
            cell: ({ row }) => <CellAction data={row.original} />
        },
    ];
};
