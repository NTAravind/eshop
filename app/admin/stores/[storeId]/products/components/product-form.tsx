"use client";

import * as z from "zod";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Trash, Code, SlidersHorizontal, Plus, X, Image as ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    productSchemaId: z.string().optional(),
    isActive: z.boolean().default(true),
    customData: z.any().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
    initialData: any | null;
    schemas: any[];
    categories: any[];
}

export const ProductForm: React.FC<ProductFormProps> = ({
    initialData,
    schemas,
    categories
}) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [jsonMode, setJsonMode] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(
        (initialData?.customData?.images as string[]) || []
    );

    // Find active schema based on selection or initial data
    const [selectedSchemaId, setSelectedSchemaId] = useState<string | undefined>(
        initialData?.productSchemaId || (schemas.length > 0 ? schemas[0].id : undefined)
    );

    const title = initialData ? "Edit product" : "Create product";
    const description = initialData ? "Edit product details. Manage variants separately." : "Add a new product. You'll add variants after creation.";
    const toastMessage = initialData ? "Product updated." : "Product created.";
    const action = initialData ? "Save changes" : "Create";

    const defaultValues = initialData ? {
        name: initialData.name,
        description: initialData.description || "",
        categoryId: initialData.categoryId || undefined,
        productSchemaId: initialData.productSchemaId || undefined,
        isActive: initialData.isActive,
        customData: initialData.customData || {},
    } : {
        name: "",
        description: "",
        categoryId: undefined,
        productSchemaId: schemas.length > 0 ? schemas[0].id : undefined,
        isActive: true,
        customData: {},
    };

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues,
    });

    const activeSchema = schemas.find(s => s.id === selectedSchemaId);
    const schemaFields = (activeSchema?.fields as any[]) || [];

    // Watch for schema changes to update state if connected
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'productSchemaId') {
                setSelectedSchemaId(value.productSchemaId);
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);


    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);

            // Merge images into customData
            const customDataWithImages = {
                ...data.customData,
                images: imageUrls.filter(url => url.trim() !== '')
            };

            const submitData = {
                ...data,
                customData: customDataWithImages
            };

            if (initialData) {
                await fetch(`/api/stores/${params.storeId}/products/${params.productId}`, {
                    method: "PATCH",
                    body: JSON.stringify(submitData),
                });
            } else {
                const response = await fetch(`/api/stores/${params.storeId}/products`, {
                    method: "POST",
                    body: JSON.stringify(submitData),
                });
                const product = await response.json();

                // Redirect to variants page for new products
                router.refresh();
                router.push(`/admin/stores/${params.storeId}/products/${product.id}/variants`);
                toast.success("Product created. Now add variants.");
                return;
            }
            router.refresh();
            router.push(`/admin/stores/${params.storeId}/products`);
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
            await fetch(`/api/stores/${params.storeId}/products/${params.productId}`, {
                method: "DELETE",
            });
            router.refresh();
            router.push(`/admin/stores/${params.storeId}/products`);
            toast.success("Product deleted.");
        } catch (error) {
            toast.error("Make sure you removed all variants first.");
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
                onConfirm={onDelete}
                loading={loading}
            />
            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setJsonMode(!jsonMode)}
                    >
                        {jsonMode ? <SlidersHorizontal className="mr-2 h-4 w-4" /> : <Code className="mr-2 h-4 w-4" />}
                        {jsonMode ? "Form View" : "JSON Editor"}
                    </Button>
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
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    <div className="grid grid-cols-3 gap-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="Product name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="productSchemaId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Type</FormLabel>
                                    <Select
                                        disabled={loading || !!initialData} // Lock type on edit? Or allow change? Usually lock.
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            // Optional: Clear customData when type changes to avoid pollution?
                                            // form.setValue('customData', {}); 
                                        }}
                                        value={field.value}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {schemas.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select
                                        disabled={loading}
                                        onValueChange={(value) => {
                                            field.onChange(value === "unassigned" ? null : value);
                                        }}
                                        value={field.value || undefined}
                                        defaultValue={field.value || undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category (optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">None</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                        <FormLabel>
                                            Active
                                        </FormLabel>
                                        <FormDescription>
                                            Product will be visible in store
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Product Images Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium">Product Images</h3>
                                <p className="text-sm text-muted-foreground">
                                    Add image URLs for this product
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setImageUrls([...imageUrls, ""])}
                                disabled={loading}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Image
                            </Button>
                        </div>

                        {imageUrls.length > 0 && (
                            <div className="space-y-4">
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="https://example.com/image.jpg"
                                                    value={url}
                                                    onChange={(e) => {
                                                        const newUrls = [...imageUrls];
                                                        newUrls[index] = e.target.value;
                                                        setImageUrls(newUrls);
                                                    }}
                                                    disabled={loading}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newUrls = imageUrls.filter((_, i) => i !== index);
                                                        setImageUrls(newUrls);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {url && (
                                                <div className="relative w-full h-48 border rounded-md overflow-hidden bg-muted">
                                                    <img
                                                        src={url}
                                                        alt={`Product image ${index + 1}`}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent && !parent.querySelector('.error-message')) {
                                                                const errorDiv = document.createElement('div');
                                                                errorDiv.className = 'error-message flex items-center justify-center h-full text-muted-foreground';
                                                                errorDiv.innerHTML = '<ImageIcon className="h-12 w-12" /><span className="ml-2">Failed to load image</span>';
                                                                parent.appendChild(errorDiv);
                                                            }
                                                        }}
                                                        onLoad={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'block';
                                                            const parent = target.parentElement;
                                                            const errorDiv = parent?.querySelector('.error-message');
                                                            if (errorDiv) {
                                                                errorDiv.remove();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {imageUrls.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    No images yet. Click "Add Image" to get started.
                                </p>
                            </div>
                        )}
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        disabled={loading}
                                        placeholder="Product description"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Dynamic Fields Section */}
                    {activeSchema && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {activeSchema.name} Attributes
                                    {jsonMode && <span className="ml-2 text-xs font-normal text-muted-foreground">(JSON Editing)</span>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {jsonMode ? (
                                    <FormField
                                        control={form.control}
                                        name="customData"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="space-y-2">
                                                        <Textarea
                                                            className="font-mono min-h-[300px]"
                                                            value={JSON.stringify(field.value, null, 2)}
                                                            onChange={(e) => {
                                                                try {
                                                                    const parsed = JSON.parse(e.target.value);
                                                                    field.onChange(parsed);
                                                                } catch (err) {
                                                                    // Ignore parse errors while typing
                                                                }
                                                            }}
                                                        // We need to control this input somewhat loosely to allow typing
                                                        // Let's use a controlled component approach via a local state wrapper if needed.
                                                        // For now, let's keep it simple: Render JSON string, onChange tries parse.
                                                        />
                                                        <p className="text-sm text-muted-foreground">
                                                            Editing raw JSON data. Be careful with syntax.
                                                        </p>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 gap-6">
                                        {schemaFields.map((field) => (
                                            <FormField
                                                key={field.key}
                                                control={form.control}
                                                name={`customData.${field.key}`}
                                                render={({ field: inputField }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {field.label}
                                                            {field.required && <span className="text-destructive ml-1">*</span>}
                                                        </FormLabel>
                                                        <FormControl>
                                                            {field.type === 'boolean' ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        checked={inputField.value}
                                                                        onCheckedChange={inputField.onChange}
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">{field.label}</span>
                                                                </div>
                                                            ) : field.type === 'select' ? (
                                                                <Select
                                                                    onValueChange={inputField.onChange}
                                                                    value={inputField.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder={`Select ${field.label}`} />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {(field.options as string[])?.map((opt) => (
                                                                            <SelectItem key={opt} value={opt}>
                                                                                {opt}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : field.type === 'date' ? (
                                                                <Input
                                                                    type="date"
                                                                    {...inputField}
                                                                    value={inputField.value ? format(new Date(inputField.value), 'yyyy-MM-dd') : ''}
                                                                />
                                                            ) : (
                                                                <Input
                                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                                    {...inputField}
                                                                    value={inputField.value ?? ''}
                                                                    onChange={(e) => {
                                                                        const val = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                                                        inputField.onChange(val);
                                                                    }}
                                                                />
                                                            )}
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
