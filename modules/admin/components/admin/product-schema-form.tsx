"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash, Plus, GripVertical } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

const fieldSchema = z.object({
    key: z.string().min(1, "Key is required").regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
    label: z.string().min(1, "Label is required"),
    type: z.enum(["text", "number", "boolean", "select", "date"]),
    required: z.boolean().default(false),
    options: z.string().optional(), // Comma separated string for input
});

const schemaFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    fields: z.array(fieldSchema),
});

type SchemaFormValues = z.infer<typeof schemaFormSchema>;

interface ProductSchemaFormProps {
    initialData?: any;
}

export const ProductSchemaForm: React.FC<ProductSchemaFormProps> = ({
    initialData
}) => {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const title = initialData ? "Edit Product Type" : "Create Product Type";
    const description = "Define the attributes and fields for your products.";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<SchemaFormValues>({
        resolver: zodResolver(schemaFormSchema) as any,
        defaultValues: initialData ? {
            name: initialData.name,
            fields: (initialData.fields as any[]).map(f => ({
                ...f,
                options: f.options ? f.options.join(", ") : ""
            }))
        } : {
            name: "",
            fields: [{ key: "", label: "", type: "text", required: false, options: "" }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "fields",
    });

    const onSubmit = async (data: SchemaFormValues) => {
        try {
            setLoading(true);
            const formattedData = {
                name: data.name,
                fields: data.fields.map(f => ({
                    ...f,
                    options: f.type === 'select' && f.options ? f.options.split(",").map(s => s.trim()).filter(Boolean) : undefined
                }))
            };

            if (initialData) {
                await fetch(`/api/admin/stores/${params.storeId}/product-schemas/${params.schemaId}`, {
                    method: "PATCH",
                    body: JSON.stringify(formattedData),
                });
            } else {
                await fetch(`/api/admin/stores/${params.storeId}/product-schemas`, {
                    method: "POST",
                    body: JSON.stringify(formattedData),
                });
            }
            router.refresh();
            router.push(`/admin/stores/${params.storeId}/product-schemas`);
            toast.success("Product type saved.");
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
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
                                    <FormLabel>Type Name</FormLabel>
                                    <FormControl>
                                        <Input disabled={loading} placeholder="e.g. Electronics, Clothing" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Fields Definition</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ key: "", label: "", type: "text", required: false, options: "" })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Field
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <Card key={field.id}>
                                <CardContent className="p-4 grid grid-cols-12 gap-4 items-start">
                                    <div className="col-span-1 flex items-center justify-center pt-3 text-muted-foreground cursor-move">
                                        <GripVertical className="h-5 w-5" />
                                    </div>

                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.label`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Label</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Display Name" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-3">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Key (Internal)</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="internal_key" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.type`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="text">Text</SelectItem>
                                                            <SelectItem value="number">Number</SelectItem>
                                                            <SelectItem value="boolean">Checkbox</SelectItem>
                                                            <SelectItem value="select">Select</SelectItem>
                                                            <SelectItem value="date">Date</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`fields.${index}.required`}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-8">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Required</FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1 pt-6">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>

                                    {form.watch(`fields.${index}.type`) === 'select' && (
                                        <div className="col-span-11 col-start-2">
                                            <FormField
                                                control={form.control}
                                                name={`fields.${index}.options`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Options (comma separated)</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Option 1, Option 2, Option 3" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
