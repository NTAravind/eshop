"use client";

import axios from "axios";
import { Copy, Edit, MoreHorizontal, Trash, Package } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AlertModal } from "@/components/modals/alert-modal";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { ProductColumn } from "./columns";

interface CellActionProps {
    data: ProductColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        setMounted(true);
    }, []);

    const onConfirm = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/admin/stores/${params.storeId}/products/${data.id}`);
            toast.success('Product deleted.');
            router.refresh();
        } catch (error) {
            toast.error('Make sure you removed all categories using this product first.');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    const onCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success('Product ID copied to clipboard.');
    }

    if (!mounted) {
        return null;
    }

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
                    <DropdownMenuItem onClick={() => onCopy(data.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Id
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/stores/${params.storeId}/products/${data.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Update
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/stores/${params.storeId}/products/${data.id}/variants`)}>
                        <Package className="mr-2 h-4 w-4" /> Manage Variants
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
