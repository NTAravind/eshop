"use client";

import { Heading } from "@/shared/components/ui/heading";
import { Separator } from "@/shared/components/ui/separator";
import { Facet } from "@/app/generated/prisma";
import { DataTable } from "@/shared/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/components/ui/button";
import { Trash, RefreshCw } from "lucide-react";
import { deleteFacetAction } from "@/server/actions/facets";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertModal } from "@/shared/components/modals/alert-modal";
import { useState } from "react";

interface FacetClientProps {
    data: Facet[];
    storeId: string;
}

export const FacetClient: React.FC<FacetClientProps> = ({
    data,
    storeId
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [facetToDelete, setFacetToDelete] = useState<string | null>(null);

    const onSync = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/stores/${storeId}/facets/sync`, {
                method: "POST",
            });

            if (response.ok) {
                toast.success("Filters synced successfully.");
                router.refresh();
            } else {
                toast.error("Failed to sync filters.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await deleteFacetAction(storeId, facetToDelete!);
            router.refresh();
            toast.success("Facet deleted.");
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
            setOpen(false);
            setFacetToDelete(null);
        }
    };

    const columns: ColumnDef<Facet>[] = [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "code",
            header: "Key",
        },
        {
            accessorKey: "schemaType",
            header: "Type",
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <Button variant="destructive" size="icon" onClick={() => {
                    setFacetToDelete(row.original.id);
                    setOpen(true);
                }}>
                    <Trash className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />
            <div className="flex items-center justify-between">
                <Heading
                    title={`Filters (${data.length})`}
                    description="Manage filters for your store."
                />
                <Button onClick={onSync} disabled={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Filters
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="name" columns={columns} data={data} />
        </>
    );
};
