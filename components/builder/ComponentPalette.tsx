'use client';

/**
 * Component Palette for the Storefront Builder
 * Displays available components grouped by category
 */

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentCategory, ComponentDefinition } from '@/types/storefront-builder';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

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

    const Icon = componentIcons[type] || Box;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md cursor-grab',
                'border border-transparent hover:border-border hover:bg-accent',
                'transition-colors text-sm',
                isDragging && 'opacity-50'
            )}
        >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{displayName}</span>
        </div>
    );
}

interface ComponentPaletteProps {
    components: Record<string, ComponentDefinition>;
}

export function ComponentPalette({ components }: ComponentPaletteProps) {
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

        Object.values(components).forEach((comp) => {
            if (groups[comp.category]) {
                groups[comp.category].push(comp);
            }
        });

        return groups;
    }, [components]);

    const defaultOpenCategories = ['layout', 'content', 'commerce'];
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-2" />;
    }

    return (
        <div className="p-2">
            <Accordion type="multiple" defaultValue={defaultOpenCategories}>
                {(Object.keys(grouped) as ComponentCategory[]).map((category) => {
                    const items = grouped[category];
                    if (items.length === 0) return null;

                    const CategoryIcon = categoryIcons[category];

                    return (
                        <AccordionItem key={category} value={category}>
                            <AccordionTrigger className="h-10 px-2 text-sm hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                    {categoryLabels[category]}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-2">
                                <div className="flex flex-col gap-1">
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
        </div>
    );
}
