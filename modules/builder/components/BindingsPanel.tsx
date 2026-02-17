"use client";

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { StorefrontNode } from '@/types/storefront-builder';
import { getRegistry } from '@/modules/storefront/registry/init';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useParams } from 'next/navigation';

interface BindingsPanelProps {
    node: StorefrontNode;
    onBindingChange: (propName: string, path: string | undefined) => void;
}

interface SchemaField {
    name: string;
    type: string;
}

export function BindingsPanel({ node, onBindingChange }: BindingsPanelProps) {
    const registry = getRegistry();
    const definition = registry.components[node.type];
    const params = useParams();
    const storeId = params.storeId as string;

    const [schemas, setSchemas] = useState<{ id: string; name: string; fields: SchemaField[] }[]>([]);

    useEffect(() => {
        if (!storeId) return;
        // Fetch schemas to populate auto-complete suggestions
        fetch(`/api/admin/stores/${storeId}/product-schemas`)
            .then(res => res.json())
            .then(data => setSchemas(data))
            .catch(err => console.error("Failed to load schemas", err));
    }, [storeId]);

    // Get all available props from registry definition
    const availableProps = definition?.controls ? Object.keys(definition.controls) : [];
    const nodeProps = Object.keys(node.props || {});
    const boundProps = Object.keys(node.bindings || {});

    // Also include common overrides if any
    const commonProps = ['text', 'src', 'alt', 'href', 'price'];

    // Combine and dedupe
    const availablePropsSet = new Set([...availableProps, ...nodeProps, ...boundProps, ...commonProps]);
    const allProps = Array.from(availablePropsSet);

    // Current bindings
    const bindings = node.bindings || {};

    return (
        <div className="space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data Bindings
            </div>

            <div className="space-y-4">
                {allProps.map(propName => {
                    const currentBinding = bindings[propName];
                    const isBound = !!currentBinding;

                    return (
                        <div key={propName} className="space-y-2 border-b pb-4 last:border-0 hover:bg-muted/10 p-2 rounded">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold capitalize flex items-center gap-2">
                                    {propName}
                                    {isBound && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                </Label>
                                {isBound && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => onBindingChange(propName, undefined)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>

                            <div className="relative">
                                <Input
                                    value={currentBinding || ''}
                                    onChange={(e) => onBindingChange(propName, e.target.value)}
                                    placeholder="e.g. product.name"
                                    className={`text-xs font-mono h-8 ${isBound ? 'border-blue-200 bg-blue-50/50' : ''}`}
                                />
                                {/* Quick suggestion buttons could go here */}
                            </div>

                            {/* Schema Fields Suggestions (Collapsible) */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="suggestions" className="border-0">
                                    <AccordionTrigger className="py-1 text-[10px] text-muted-foreground hover:no-underline">
                                        Suggest Path
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-col gap-1 pl-2 border-l-2">
                                            <div className="text-[10px] font-semibold text-muted-foreground">Product:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'product.name')}>name</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'product.description')}>description</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'product.images[0].url')}>images[0].url</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'product.variants[0].price')}>variants[0].price</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'product.slug')}>slug</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Selected Variant:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'selectedVariant.price')}>price</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'selectedVariant.compareAtPrice')}>compareAtPrice</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'selectedVariant.sku')}>sku</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'selectedVariant.stock')}>stock</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Collection:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'collection.products')}>products</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'collection.total')}>total</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Similar Products:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'similarProducts')}>similarProducts (array)</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Cart:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'cart.items')}>items</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'cart.total')}>total</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'cart.itemCount')}>itemCount</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Store:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'store.name')}>name</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'store.currency')}>currency</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'store.logo')}>logo</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">User:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'user.name')}>name</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'user.email')}>email</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Orders:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'orders')}>orders (array)</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Route:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'route.slug')}>slug</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'route.query')}>query</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">UI State:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'uiState.searchQuery')}>searchQuery</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'uiState.selectedFilters')}>selectedFilters</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Repeater Scope:</div>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'item')}>item (current repeater item)</button>
                                            <button className="text-[10px] text-left hover:text-primary ml-2" onClick={() => onBindingChange(propName, 'index')}>index (current index)</button>

                                            <div className="pt-1 text-[10px] font-semibold text-muted-foreground">Custom Data:</div>
                                            {schemas.length === 0 && <span className="text-[10px] italic text-muted-foreground">Loading schemas...</span>}
                                            {schemas.map(schema => (
                                                <div key={schema.id} className="ml-2">
                                                    <div className="text-[10px] text-muted-foreground">{schema.name}</div>
                                                    { }
                                                    {filteredFields(schema.fields as any[]).map((field: any, idx: number) => (
                                                        <button
                                                            key={`${field.name}-${idx}`}
                                                            className="block text-[10px] text-left hover:text-primary ml-2 w-full truncate"
                                                            onClick={() => onBindingChange(propName, `product.customData.${field.name}`)}
                                                        >
                                                            {field.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    );
                })}
            </div>

            <div className="text-[10px] text-muted-foreground mt-4 bg-muted p-2 rounded">
                Use dot notation to bind runtime data:
                <ul className="list-disc pl-3 mt-1 space-y-0.5">
                    <li><code>product.*</code> - current product</li>
                    <li><code>selectedVariant.*</code> - active variant</li>
                    <li><code>collection.*</code> - products list</li>
                    <li><code>similarProducts</code> - related products</li>
                    <li><code>cart.*</code> - cart state</li>
                    <li><code>store.*</code> - store info</li>
                    <li><code>user.*</code> - authenticated user</li>
                    <li><code>orders</code> - order history</li>
                    <li><code>route.*</code> - current route params</li>
                    <li><code>uiState.*</code> - client-side UI state</li>
                    <li><code>item.*</code> / <code>index</code> - repeater scope</li>
                </ul>
            </div>
        </div>
    );
}

// Helper to handle schema fields usually stored as JSON or defined elsewhere
// Assuming the API returns fields in a usable format.
// If not, we might need to adjust.

function filteredFields(fields: any[]) {
    if (!Array.isArray(fields)) return [];
    return fields.slice(0, 5); // Show top 5 fields per schema to avoid clutter
}
