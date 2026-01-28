"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./components/cell-action";

export interface SchemaColumn {
    id: string;
    name: string;
    version: number;
    fieldsCount: number;
    isActive: boolean;
    createdAt: string;
}

export const columns: ColumnDef<SchemaColumn>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "version",
        header: "Version",
    },
    {
        accessorKey: "fieldsCount",
        header: "Fields",
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? "default" : "secondary"}>
                {row.original.isActive ? "Active" : "Archived"}
            </Badge>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Created Date",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />
    }
];

interface ProductSchemasClientProps {
    data: SchemaColumn[];
}

export const ProductSchemasClient: React.FC<ProductSchemasClientProps> = ({
    data
}) => {
    const params = useParams();
    const router = useRouter();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading
                    title={`Product Types (${data.length})`}
                    description="Manage dynamic content models for your products"
                />
                <Button onClick={() => router.push(`/admin/stores/${params.storeId}/product-schemas/new`)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="name" columns={columns} data={data} />
        </>
    );
};
