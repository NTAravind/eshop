"use client";

import { DataTable } from "@/components/ui/data-table";
import { ProductColumn, getColumns } from "./columns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProductsClientProps {
    data: ProductColumn[];
    pageCount: number;
    pageIndex: number;
    schemaFields: any[];
}

export function ProductsClient({ data, pageCount, pageIndex, schemaFields }: ProductsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const columns = getColumns(schemaFields);

    const onPageChange = (page: number) => {
        // page is 1-based from DataTable button click
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set("page", page.toString());
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Products ({data.length})</h2>
                    <p className="text-muted-foreground">Manage products for your store</p>
                </div>
                <Button onClick={() => router.push(`${pathname}/new`)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New
                </Button>
            </div>
            <Separator className="my-4" />
            <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageIndex={pageIndex}
                onPageChange={onPageChange}
            />
        </>
    );
}
