'use client';

/**
 * Layer Tree for the Storefront Builder
 * Displays the document tree structure with drag-and-drop reordering
 */

import React from 'react';
import {
    ChevronRight,
    ChevronDown,
    Box,
    Eye,
    EyeOff,
    Trash2,
    Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, selectSelectedNode } from '@/lib/builder/editor-store';
import type { StorefrontNode } from '@/types/storefront-builder';
import { Button } from '@/components/ui/button';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface LayerItemProps {
    node: StorefrontNode;
    depth: number;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
    onRemove: (nodeId: string) => void;
    onCopy: (nodeId: string) => void;
}

function LayerItem({
    node,
    depth,
    isSelected,
    onSelect,
    onRemove,
    onCopy,
}: LayerItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleSelect = () => {
        onSelect(node.id);
    };

    return (
        <div className="select-none">
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        className={cn(
                            'flex items-center h-8 px-2 gap-1 cursor-pointer',
                            'hover:bg-accent rounded-sm',
                            isSelected && 'bg-accent'
                        )}
                        style={{ paddingLeft: `${depth * 16 + 8}px` }}
                        onClick={handleSelect}
                    >
                        {/* Expand/collapse toggle */}
                        <button
                            className={cn(
                                'h-4 w-4 flex items-center justify-center',
                                !hasChildren && 'invisible'
                            )}
                            onClick={handleToggle}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                        </button>

                        {/* Icon */}
                        <Box className="h-3.5 w-3.5 text-muted-foreground" />

                        {/* Label */}
                        <span className="text-sm truncate flex-1">
                            {node.type}
                            {Boolean(node.props?.text) && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                    "{String(node.props.text).substring(0, 20)}..."
                                </span>
                            )}
                        </span>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => onCopy(node.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        onClick={() => onRemove(node.id)}
                        className="text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map((child) => (
                        <LayerItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            isSelected={false}
                            onSelect={onSelect}
                            onRemove={onRemove}
                            onCopy={onCopy}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function LayerTree() {
    const tree = useEditorStore((s) => s.tree);
    const selection = useEditorStore((s) => s.selection);
    const { select, removeNode, copy } = useEditorStore();

    if (!tree) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No document loaded
            </div>
        );
    }

    const handleSelect = (nodeId: string) => {
        select(nodeId);
    };

    const handleRemove = (nodeId: string) => {
        // Can't remove root
        if (nodeId === tree.id) return;
        removeNode(nodeId);
    };

    const handleCopy = (nodeId: string) => {
        select(nodeId);
        copy();
    };

    // Recursive rendering with selection state
    const renderWithSelection = (node: StorefrontNode, depth: number) => {
        const isSelected = selection.nodeId === node.id;

        return (
            <div key={node.id}>
                <LayerItem
                    node={node}
                    depth={depth}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                    onRemove={handleRemove}
                    onCopy={handleCopy}
                />
            </div>
        );
    };

    return (
        <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
                Layers
            </div>
            {renderWithSelection(tree, 0)}
        </div>
    );
}
