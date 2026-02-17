"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ProductSchema {
    id: string;
    name: string;
}

interface ProductSchemaPickerProps {
    value?: string;
    onChange: (value: string) => void;
}

export function ProductSchemaPicker({ value, onChange }: ProductSchemaPickerProps) {
    const params = useParams();
    const storeId = params.storeId as string;
    const [schemas, setSchemas] = useState<ProductSchema[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!storeId) return;

        const fetchSchemas = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/admin/stores/${storeId}/product-schemas`);
                if (!response.ok) {
                    throw new Error('Failed to fetch schemas');
                }
                const data = await response.json();
                setSchemas(data);
            } catch (error) {
                console.error('Error fetching schemas:', error);
                toast.error('Failed to load product schemas');
            } finally {
                setLoading(false);
            }
        };

        fetchSchemas();
    }, [storeId]);

    return (
        <Select value={value || "all"} onValueChange={(val) => onChange(val === "all" ? "" : val)}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading schemas..." : "Select product schema"} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Schemas</SelectItem>
                {schemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                        {schema.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
