'use client';

/**
 * Component Palette for the Storefront Builder
 * Displays available components grouped by category
 */

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    Box,
    Columns,
    Rows,
    Type,
    Image,
    Link,
    ShoppingCart,
    Package,
    Grid3X3,
    Star,
    CreditCard,
    Menu,
    LayoutTemplate,
    ChevronDown,
    Search,
    Filter,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import type { ComponentCategory, ComponentDefinition } from '@/types/storefront-builder';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';

// Icon mapping for component types
const componentIcons: Record<string, React.ElementType> = {
    Container: Box,
    Row: Rows,
    Column: Columns,
    Section: LayoutTemplate,
    Heading: Type,
    Text: Type,
    Image: Image,
    Button: Box,
    Link: Link,
    NavBar: Menu,
    Footer: LayoutTemplate,
    ProductCard: Package,
    ProductGrid: Grid3X3,
    AddToCartButton: ShoppingCart,
    BuyNowButton: CreditCard,
    PriceDisplay: CreditCard,
    VariantSelector: Star,
    CollectionFilters: Filter,
    NavFilterMenu: Filter,
    'filter-menu': Filter,
    CartItemCard: ShoppingCart,
};

// Category labels
const categoryLabels: Record<ComponentCategory, string> = {
    layout: 'Layout',
    navigation: 'Navigation',
    content: 'Content',
    commerce: 'Commerce',
    forms: 'Forms',
    utility: 'Utility',
};

// Category icons
const categoryIcons: Record<ComponentCategory, React.ElementType> = {
    layout: LayoutTemplate,
    navigation: Menu,
    content: Type,
    commerce: ShoppingCart,
    forms: Box,
    utility: Box,
};

interface PaletteItemProps {
    type: string;
    displayName: string;
    icon?: string;
}

export function PaletteItemPreview({ type, displayName, icon }: PaletteItemProps) {
    const Icon = componentIcons[type] || Box;

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-2 p-2 rounded-md cursor-grab border bg-card text-card-foreground shadow-sm',
                'hover:border-primary hover:bg-accent/50',
                'transition-all duration-200 aspect-square text-center'
            )}
        >
            <Icon className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium leading-tight line-clamp-2">{displayName}</span>
        </div>
    );
}

function PaletteItem({ type, displayName, icon }: PaletteItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `palette-${type}`,
        data: {
            type,
            source: 'palette',
        },
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
        >
            <PaletteItemPreview type={type} displayName={displayName} icon={icon} />
        </div>
    );
}

interface ComponentPaletteProps {
    components: Record<string, ComponentDefinition>;
}

export function ComponentPalette({ components }: ComponentPaletteProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Group components by category
    const grouped = React.useMemo(() => {
        const groups: Record<ComponentCategory, ComponentDefinition[]> = {
            layout: [],
            navigation: [],
            content: [],
            commerce: [],
            forms: [],
            utility: [],
        };

        const query = searchQuery.toLowerCase();

        Object.values(components).forEach((comp) => {
            if (comp.displayName.toLowerCase().includes(query) || comp.type.toLowerCase().includes(query)) {
                if (groups[comp.category]) {
                    groups[comp.category].push(comp);
                }
            }
        });

        return groups;
    }, [components, searchQuery]);

    const defaultOpenCategories = ['layout', 'content', 'commerce', 'navigation'];
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-2" />;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b sticky top-0 bg-background z-10">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search components..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-9 bg-muted/50"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-2">
                <Accordion type="multiple" defaultValue={defaultOpenCategories} className="w-full">
                    {(Object.keys(grouped) as ComponentCategory[]).map((category) => {
                        const items = grouped[category];
                        if (items.length === 0) return null;

                        const CategoryIcon = categoryIcons[category];

                        return (
                            <AccordionItem key={category} value={category} className="border-b-0 mb-2">
                                <AccordionTrigger className="py-2 px-2 text-sm font-semibold hover:no-underline rounded-md hover:bg-muted">
                                    <div className="flex items-center gap-2">
                                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                        {categoryLabels[category]}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {items.map((comp) => (
                                            <PaletteItem
                                                key={comp.type}
                                                type={comp.type}
                                                displayName={comp.displayName}
                                                icon={comp.icon}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>

                {Object.values(grouped).every(g => g.length === 0) && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        No components found
                    </div>
                )}
            </div>
        </div>
    );
}
