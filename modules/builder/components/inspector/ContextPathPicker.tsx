'use client';

/**
 * Context Path Picker
 * Tree view to select binding paths from the RuntimeContext.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Check, Database } from 'lucide-react';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ContextNode {
    key: string;
    type: string;
    children?: ContextNode[];
    isRepeaterScope?: boolean;
}

// Mock schema for MVP - in real V2 this would come from a context schema generator
const MOCK_CONTEXT_SCHEMA: ContextNode[] = [
    {
        key: 'store',
        type: 'StoreContext',
        children: [
            { key: 'name', type: 'string' },
            { key: 'currency', type: 'string' },
        ],
    },
    {
        key: 'cart',
        type: 'CartContext',
        children: [
            { key: 'subtotal', type: 'number' },
            { key: 'quantity', type: 'number' },
            {
                key: 'items',
                type: 'CartItem[]',
                children: [
                    { key: '0', type: 'CartItem' } // Example array access
                ]
            },
        ],
    },
    {
        key: 'product',
        type: 'ProductContext',
        children: [
            { key: 'title', type: 'string' },
            { key: 'description', type: 'string' },
            { key: 'price', type: 'number' },
            { key: 'images', type: 'string[]' },
            {
                key: 'variants',
                type: 'ProductVariant[]',
                children: [
                    { key: '0', type: 'ProductVariant' }
                ]
            }
        ],
    },
];

interface ContextPathPickerProps {
    value?: string; // Dot-notation path (e.g. "product.title")
    onChange: (path: string) => void;
    trigger?: React.ReactNode;
}

export function ContextPathPicker({ value, onChange, trigger }: ContextPathPickerProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (path: string) => {
        onChange(path);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="w-full justify-start font-normal">
                        {value ? (
                            <span className="flex items-center gap-2">
                                <Database className="w-3 h-3 text-indigo-500" />
                                {value}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Select data...</span>
                        )}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <ScrollArea className="h-[300px]">
                    <div className="p-2">
                        {MOCK_CONTEXT_SCHEMA.map((node) => (
                            <ContextTreeNode
                                key={node.key}
                                node={node}
                                parentPath=""
                                onSelect={handleSelect}
                                selectedPath={value}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

function ContextTreeNode({
    node,
    parentPath,
    onSelect,
    selectedPath
}: {
    node: ContextNode;
    parentPath: string;
    onSelect: (path: string) => void;
    selectedPath?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const currentPath = parentPath ? `${parentPath}.${node.key}` : node.key;
    const isSelected = selectedPath === currentPath;
    const hasChildren = node.children && node.children.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            setExpanded(!expanded);
        } else {
            onSelect(currentPath);
        }
    };

    return (
        <div className="text-sm">
            <div
                className={cn(
                    "flex items-center py-1 px-2 rounded cursor-pointer hover:bg-accent",
                    isSelected && "bg-accent/50 text-accent-foreground font-medium"
                )}
                onClick={handleClick}
            >
                <div className="w-4 h-4 mr-1 flex items-center justify-center text-muted-foreground">
                    {hasChildren && (
                        expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                    )}
                </div>

                <span className="flex-1 truncate">{node.key}</span>

                <span className="text-[10px] text-muted-foreground ml-2 opacity-70">
                    {node.type}
                </span>

                {isSelected && <Check className="w-3 h-3 ml-2 text-indigo-500" />}
            </div>

            {hasChildren && expanded && (
                <div className="pl-4 border-l ml-2 border-border/50">
                    {node.children!.map((child) => (
                        <ContextTreeNode
                            key={child.key}
                            node={child}
                            parentPath={currentPath}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
