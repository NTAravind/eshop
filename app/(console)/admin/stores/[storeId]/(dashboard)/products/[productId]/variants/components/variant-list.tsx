"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertModal } from "@/components/modals/alert-modal";
import axios from "axios";
import { toast } from "sonner";

interface Variant {
    id: string;
    sku: string;
    price: number;
    stock: number;
    isActive: boolean;
    customData?: Record<string, any>;
}

interface VariantListProps {
    variants: Variant[];
    productId: string;
}

export const VariantList: React.FC<VariantListProps> = ({ variants, productId }) => {
    const params = useParams();
    const router = useRouter();
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
        open: false,
        id: null
    });
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!deleteModal.id) return;

        try {
            setLoading(true);
            await axios.delete(
                `/api/admin/stores/${params.storeId}/products/${productId}/variants/${deleteModal.id}`
            );
            toast.success("Variant deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete variant");
        } finally {
            setLoading(false);
            setDeleteModal({ open: false, id: null });
        }
    };

    const renderCustomData = (customData?: Record<string, any>) => {
        if (!customData || Object.keys(customData).length === 0) {
            return <span className="text-sm text-muted-foreground">-</span>;
        }

        const entries = Object.entries(customData);
        const displayCount = 3;
        const hasMore = entries.length > displayCount;

        return (
            <div className="flex flex-wrap gap-1">
                {entries.slice(0, displayCount).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                        {key}: {String(value)}
                    </Badge>
                ))}
                {hasMore && (
                    <Badge variant="secondary" className="text-xs">
                        +{entries.length - displayCount} more
                    </Badge>
                )}
            </div>
        );
    };

    if (variants.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No variants yet. Create one to get started.</p>
            </div>
        );
    }

    return (
        <>
            <AlertModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null })}
                onConfirm={handleDelete}
                loading={loading}
            />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Custom Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variants.map((variant) => (
                        <TableRow key={variant.id}>
                            <TableCell className="font-medium">{variant.sku}</TableCell>
                            <TableCell>₹{(variant.price / 100).toFixed(2)}</TableCell>
                            <TableCell>{variant.stock}</TableCell>
                            <TableCell>{renderCustomData(variant.customData)}</TableCell>
                            <TableCell>
                                <Badge variant={variant.isActive ? "default" : "secondary"}>
                                    {variant.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                router.push(
                                                    `/admin/stores/${params.storeId}/products/${productId}/variants/${variant.id}`
                                                )
                                            }
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setDeleteModal({ open: true, id: variant.id })}
                                        >
                                            <Trash className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};
