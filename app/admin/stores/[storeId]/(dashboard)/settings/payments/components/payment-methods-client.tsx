"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Key } from "lucide-react";
import { PaymentConfigForm } from "./payment-config-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PaymentMethodsClientProps {
    storeId: string;
    configs: any[];
}

export function PaymentMethodsClient({ storeId, configs }: PaymentMethodsClientProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<any | null>(null);

    const handleSuccess = () => {
        setOpen(false);
        setEditingConfig(null);
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/payment-configs/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Payment configuration deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete configuration");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payment Methods</h2>
                    <p className="text-muted-foreground">
                        Manage payment providers and credentials for your store.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) setEditingConfig(null);
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Method
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingConfig ? "Edit Payment Method" : "Add Payment Method"}
                            </DialogTitle>
                        </DialogHeader>
                        <PaymentConfigForm
                            storeId={storeId}
                            existingConfig={editingConfig}
                            onSuccess={handleSuccess}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {configs.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground">
                        <Key className="h-10 w-10 mb-4 opacity-50" />
                        <p>No payment methods configured.</p>
                        <p className="text-sm">Add a provider to start accepting payments.</p>
                    </div>
                )}
                {configs.map((config) => (
                    <Card key={config.id} className="relative overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    {config.provider}
                                </CardTitle>
                                {config.isLive ? (
                                    <Badge variant="default" className="text-[10px]">LIVE</Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px]">TEST</Badge>
                                )}
                            </div>
                            <CardDescription>
                                {config.isActive ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        ● Active
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        ○ Inactive
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-4">
                                Config ID: <span className="font-mono">{config.id}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingConfig(config);
                                        setOpen(true);
                                    }}
                                >
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the
                                                <span className="font-semibold"> {config.provider} </span>
                                                configuration and disable payments for this method.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(config.id)}>
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
