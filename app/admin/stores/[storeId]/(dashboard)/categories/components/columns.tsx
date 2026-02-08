
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { AlertModal } from "@/components/modals/alert-modal"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type CategoryColumn = {
    id: string
    name: string
    slug: string
    createdAt: string
}

const CellAction = ({ data }: { data: CategoryColumn }) => {
    const router = useRouter();
    const params = useParams();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const onConfirm = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/admin/stores/${params.storeId}/categories/${data.id}`);
            toast.success("Category deleted.");
            router.refresh();
        } catch (error) {
            toast.error("Make sure you removed all products using this category first.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onConfirm}
                loading={loading}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push(`/admin/stores/${params.storeId}/categories/${data.id}`)}>
                        Update
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const columns: ColumnDef<CategoryColumn>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "slug",
        header: "Slug",
    },
    {
        accessorKey: "createdAt",
        header: "Date",
    },
    {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />
    },
]
