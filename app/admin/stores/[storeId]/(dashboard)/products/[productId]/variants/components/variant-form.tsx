"use client";

import * as z from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Trash, Code, SlidersHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { AlertModal } from "@/components/modals/alert-modal";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";

const formSchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    price: z.number().min(0, "Price must be non-negative"),
    stock: z.number().min(0, "Stock must be non-negative").int("Stock must be a whole number"),
    isActive: z.boolean().default(true),
    customData: z.any().optional(),
});

type VariantFormValues = z.infer<typeof formSchema>;

interface VariantFormProps {
    initialData: any | null;
    productId: string;
    productSchema?: any | null;
}

export const VariantForm: React.FC<VariantFormProps> = ({
    initialData,
    productId,
    productSchema
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isJsonMode, setIsJsonMode] = useState(false);

    const title = initialData ? "Edit variant" : "Create variant";
    const description = initialData ? "Edit variant details and custom attributes." : "Add a new variant with SKU, price, and stock.";
    const toastMessage = initialData ? "Variant updated." : "Variant created.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<VariantFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: initialData ? {
            sku: initialData.sku,
            price: initialData.price / 100, // Convert from paise to rupees
            stock: initialData.stock,
            isActive: initialData.isActive,
            customData: initialData.customData || {},
        } : {
            sku: "",
            price: 0,
            stock: 0,
            isActive: true,
            customData: {},
        },
    });

    const onSubmit = async (data: VariantFormValues) => {
        try {
            setLoading(true);

            // If in JSON mode, parse customData
            let customData = data.customData;
            if (isJsonMode && typeof customData === 'string') {
                try {
                    customData = JSON.parse(customData);
                } catch (e) {
                    toast.error("Invalid JSON format");
                    return;
                }
            }

            const variantData = {
                sku: data.sku,
                price: data.price,
                stock: data.stock,
                isActive: data.isActive,
                customData: customData || {},
            };

            if (initialData) {
                await axios.patch(
                    `/api/admin/stores/${params.storeId}/products/${productId}/variants/${initialData.id}`,
                    variantData
                );
            } else {
                await axios.post(
                    `/api/admin/stores/${params.storeId}/products/${productId}/variants`,
                    variantData
                );
            }

            router.refresh();
            router.push(`/admin/stores/${params.storeId}/products/${productId}/variants`);
            toast.success(toastMessage);
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(
                `/api/admin/stores/${params.storeId}/products/${productId}/variants/${initialData.id}`
            );
            router.refresh();
            router.push(`/admin/stores/${params.storeId}/products/${productId}/variants`);
            toast.success("Variant deleted.");
        } catch (error) {
            toast.error("Failed to delete variant.");
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    const toggleJsonMode = () => {
        const currentData = form.getValues("customData");
        if (!isJsonMode) {
            // Switching TO JSON mode
            form.setValue("customData", JSON.stringify(currentData || {}, null, 2));
        } else {
            // Switching FROM JSON mode
            try {
                const parsed = JSON.parse(currentData as string);
                form.setValue("customData", parsed);
            } catch (e) {
                toast.error("Invalid JSON - keeping as text");
            }
        }
        setIsJsonMode(!isJsonMode);
    };

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />
            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="icon"
                        onClick={() => setOpen(true)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="PROD-001" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Unique stock keeping unit
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            disabled={loading}
                                            placeholder="99.99"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stock</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            disabled={loading}
                                            placeholder="100"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={loading}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Active</FormLabel>
                                    <FormDescription>
                                        Variant will be available for purchase
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Custom Data</h3>
                                <p className="text-sm text-muted-foreground">
                                    Store variant-specific attributes like color, size, etc.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleJsonMode}
                                disabled={loading}
                            >
                                {isJsonMode ? (
                                    <>
                                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                                        Form Mode
                                    </>
                                ) : (
                                    <>
                                        <Code className="mr-2 h-4 w-4" />
                                        JSON Mode
                                    </>
                                )}
                            </Button>
                        </div>
                        <Separator />

                        <FormField
                            control={form.control}
                            name="customData"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {isJsonMode ? "JSON Editor" : "Custom Attributes"}
                                    </FormLabel>
                                    <FormControl>
                                        {isJsonMode ? (
                                            <Textarea
                                                disabled={loading}
                                                placeholder='{"color": "Black", "size": "Large"}'
                                                className="font-mono min-h-[200px]"
                                                {...field}
                                                value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value, null, 2)}
                                            />
                                        ) : (
                                            <div className="rounded-md border p-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Use JSON mode to edit custom attributes. Example: {"{"}color: "Black", size: "Large"{"}"}
                                                </p>
                                            </div>
                                        )}
                                    </FormControl>
                                    <FormDescription>
                                        {isJsonMode
                                            ? "Enter valid JSON to store custom variant attributes"
                                            : "Switch to JSON mode to edit custom attributes"
                                        }
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
