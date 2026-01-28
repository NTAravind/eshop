"use client";

import { DataTable } from "@/components/ui/data-table";
import { CustomerColumn, columns } from "./columns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface CustomersClientProps {
    data: CustomerColumn[];
    pageCount: number;
    pageIndex: number;
}

export function CustomersClient({ data, pageCount, pageIndex }: CustomersClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const onPageChange = (page: number) => {
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
                    <h2 className="text-3xl font-bold tracking-tight">Customers ({data.length})</h2>
                    <p className="text-muted-foreground">Customers who bought from this store</p>
                </div>
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
