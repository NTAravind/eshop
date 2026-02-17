'use client';

import React, { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEditorStore } from '@/modules/builder/editor-store';
import type { ProductContext } from '@/types/storefront-builder';
import { Package } from 'lucide-react';

interface PreviewProductSelectorProps {
    products: ProductContext[];
}

export function PreviewProductSelector({ products }: PreviewProductSelectorProps) {
    const previewProductId = useEditorStore((s) => s.previewProductId);
    const setPreviewProductId = useEditorStore((s) => s.setPreviewProductId);
    const mode = useEditorStore((s) => s.mode);

    // Guard against Radix Select hydration mismatch (unstable aria-controls IDs)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Only show in preview mode or if there are products
    if (products.length === 0 || !mounted) return null;

    // Use first product if nothing selected, but don't force state update during render
    const selectedId = previewProductId || products[0]?.id;

    return (
        <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center text-xs text-muted-foreground gap-1">
                <Package className="h-3 w-3" />
                <span>Previewing:</span>
            </div>
            <Select
                value={selectedId}
                onValueChange={(value) => setPreviewProductId(value)}
            >
                <SelectTrigger className="h-7 w-[180px] text-xs">
                    <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Products</SelectLabel>
                        {products.map((product) => (
                            <SelectItem key={product.id} value={product.id} className="text-xs">
                                {product.name}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
