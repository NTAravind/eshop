'use client';

/**
 * Layer Tree for the Storefront Builder
 * Displays the document tree structure with drag-and-drop reordering
 */

import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Box,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    Copy,
    GripVertical,
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/utils';
import { useEditorStore } from '@/modules/builder/editor-store';
import type { StorefrontNode } from '@/types/storefront-builder';
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
    selectedNodeId: string | null;
    onSelect: (nodeId: string) => void;
    onToggleHidden: (nodeId: string, hidden: boolean) => void;
    onToggleLocked: (nodeId: string, locked: boolean) => void;
    onRemove: (nodeId: string) => void;

    onCopy: (nodeId: string) => void;
    // Prefab support
    prefabs?: Record<string, StorefrontNode>;
    prefabInstanceId?: string; // If set, we are rendering inside a prefab instance
}

function LayerItem({
    node,
    depth,
    selectedNodeId,
    onSelect,
    onToggleHidden,
    onToggleLocked,
    onRemove,
    onCopy,
    prefabs,
    prefabInstanceId,
}: LayerItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Resolve prefab structure if applicable
    const isPrefab = node.type === 'Prefab';
    const prefabKey = isPrefab ? (node.props.prefabKey as string) : undefined;
    const prefabTree = isPrefab && prefabKey && prefabs ? prefabs[prefabKey] : undefined;

    // Determine children: regular children + prefab children
    // Note: Prefab instances conceptually "have" the prefab's tree as children for the LayerTree
    const regularChildren = node.children || [];
    const prefabChildren = prefabTree ? [prefabTree] : []; // The root of the prefab is the first child

    const hasChildren = regularChildren.length > 0 || prefabChildren.length > 0;

    // ID Resolution
    // If we are inside a prefab instance, the node.id is the definition ID.
    // We need to construct the runtime ID: `${instanceId}_${node.id}`
    const runtimeId = prefabInstanceId ? `${prefabInstanceId}_${node.id}` : node.id;

    const isSelected = runtimeId === selectedNodeId;

    // Interaction locks
    const isInsidePrefab = !!prefabInstanceId;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: runtimeId, // Use runtime ID for DnD if we were dragging, but keys must match
        data: { node },
        disabled: isInsidePrefab, // Disable sorting for prefab internals
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        paddingLeft: `${depth * 16}px`,
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(runtimeId);
    };

    return (
        <div className="select-none">
            <ContextMenu>
                <ContextMenuTrigger disabled={isInsidePrefab}>
                    <div
                        ref={setNodeRef}
                        style={style}
                        className={cn(
                            'group flex items-center h-8 pr-2 gap-1 cursor-pointer',
                            'hover:bg-accent/50 rounded-sm border-l-2 border-transparent',
                            isSelected && 'bg-accent border-primary',
                            node.hidden && 'opacity-50'
                        )}
                        onClick={handleSelect}
                    >
                        {/* Drag Handle - hide if inside prefab */}
                        {!isInsidePrefab && (
                            <div
                                {...attributes}
                                {...listeners}
                                className="opacity-0 group-hover:opacity-100 p-0.5 cursor-grab active:cursor-grabbing hover:bg-muted rounded"
                            >
                                <GripVertical className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                        {isInsidePrefab && <div className="w-4" />}

                        {/* Expand/collapse toggle */}
                        <button
                            className={cn(
                                'h-4 w-4 flex items-center justify-center hover:bg-muted rounded',
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
                        <span className="text-sm truncate flex-1 font-medium flex items-center gap-2">
                            {isPrefab ? (
                                <span className="text-primary">{prefabKey}</span>
                            ) : (
                                node.type
                            )}

                            {Boolean(node.props?.text) && (
                                <span className="text-muted-foreground text-xs font-normal">
                                    "{String(node.props.text).substring(0, 20)}..."
                                </span>
                            )}

                            {isPrefab && !prefabTree && (
                                <span className="text-destructive text-xs">(Missing)</span>
                            )}
                        </span>

                        {/* Actions - hide if inside prefab (read-only structure for now) */}
                        {!isInsidePrefab && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleLocked(runtimeId, !node.locked);
                                    }}
                                    className={cn(
                                        "p-1 rounded hover:bg-background",
                                        node.locked ? "opacity-100 text-amber-500" : "text-muted-foreground"
                                    )}
                                >
                                    {node.locked ? (
                                        <Lock className="h-3 w-3" />
                                    ) : (
                                        <Unlock className="h-3 w-3" />
                                    )}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleHidden(runtimeId, !node.hidden);
                                    }}
                                    className={cn(
                                        "p-1 rounded hover:bg-background",
                                        node.hidden ? "opacity-100 text-muted-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    {node.hidden ? (
                                        <EyeOff className="h-3 w-3" />
                                    ) : (
                                        <Eye className="h-3 w-3" />
                                    )}
                                </button>
                            </div>
                        )}
                        {isInsidePrefab && (
                            <div className="flex items-center gap-1 opacity-50">
                                <Lock className="h-3 w-3 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => onCopy(runtimeId)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        onClick={() => onRemove(runtimeId)}
                        className="text-destructive"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {/* Children Sortable Context */}
            {hasChildren && isExpanded && (
                <div className="flex flex-col">
                    {/* Render Prefab internals first (read-only, no SortableContext needed for structure usually, but we keep structure) */}
                    {/* Actually, if we want them selectable, just recursive render */}
                    {/* Prefab children are NOT sortable in the main tree context, so we don't wrap them in SortableContext of the parent */}
                    {/* But regular children ARE. We need to split them. */}

                    {prefabChildren.map(child => (
                        // Using runtimeId as the new instance ID context for children
                        <LayerItem
                            key={`prefab-${child.id}`} // Virtual key
                            node={child}
                            depth={depth + 1}
                            selectedNodeId={selectedNodeId}
                            onSelect={onSelect}
                            onToggleHidden={onToggleHidden}
                            onToggleLocked={onToggleLocked}
                            onRemove={onRemove}
                            onCopy={onCopy}
                            prefabs={prefabs} // Pass recursively
                            prefabInstanceId={runtimeId} // Pass current ID as instance ID
                        />
                    ))}

                    <SortableContext
                        items={regularChildren.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {regularChildren.map((child) => (
                            <LayerItem
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                selectedNodeId={selectedNodeId}
                                onSelect={onSelect}
                                onToggleHidden={onToggleHidden}
                                onToggleLocked={onToggleLocked}
                                onRemove={onRemove}
                                onCopy={onCopy}
                                prefabs={prefabs}
                                // prefabInstanceId is NOT passed here because these are regular children of the node
                                // UNLESS we are already inside a prefab instance.
                                // If we are inside, we must propagate it.
                                prefabInstanceId={prefabInstanceId}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}

export function LayerTree({ prefabs = {} }: { prefabs?: Record<string, StorefrontNode> }) {
    const tree = useEditorStore((s) => s.tree);
    const selection = useEditorStore((s) => s.selection);
    const select = useEditorStore((s) => s.select);
    const removeNode = useEditorStore((s) => s.removeNode);
    const copy = useEditorStore((s) => s.copy);
    const updateNode = useEditorStore((s) => s.updateNode);
    const moveNode = useEditorStore((s) => s.moveNode);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!tree) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No document loaded
            </div>
        );
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // Helper to find parent of a node
    const findParent = (root: StorefrontNode, id: string): { parent: StorefrontNode | null; index: number } => {
        if (root.children) {
            for (let i = 0; i < root.children.length; i++) {
                if (root.children[i].id === id) {
                    return { parent: root, index: i };
                }
                const found = findParent(root.children[i], id);
                if (found.parent) return found;
            }
        }
        return { parent: null, index: -1 };
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;
        if (active.id === over.id) return;

        const activeNodeId = active.id as string;
        const overNodeId = over.id as string;

        // Find current parent of active node
        const { parent: activeParent, index: activeIndex } = findParent(tree, activeNodeId);

        // Find parent of over node (to reorder within that parent)
        const { parent: overParent, index: overIndex } = findParent(tree, overNodeId);

        if (activeParent && overParent && activeParent.id === overParent.id) {
            // Reordering siblings
            moveNode(activeNodeId, activeParent.id, overIndex);
        } else if (overParent) {
            // Moving to a different parent (e.g. dragging into a different list position in the expansion)
            // Note: This mainly handles reordering when the 'over' target is another item.
            // If we want to drop *inside* an item (nesting) by dragging *on top* of it, 
            // we'd need to check if 'overNode' accepts children and if we are hovering the middle.
            // For now, assuming standard list reordering behavior between valid sortables.
            moveNode(activeNodeId, overParent.id, overIndex);
        }
    };

    // Animation for drop
    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="p-2 h-full overflow-auto">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 flex justify-between items-center">
                    <span>Layers</span>
                </div>

                {/* Root is not draggable usually, or it's the container */}
                <LayerItem
                    node={tree}
                    depth={0}
                    selectedNodeId={selection.nodeId}
                    onSelect={select}
                    onToggleHidden={(id, v) => updateNode(id, { hidden: v })}
                    onToggleLocked={(id, v) => updateNode(id, { locked: v })}
                    onRemove={(id) => id !== tree.id && removeNode(id)}
                    onCopy={(id) => { select(id); copy(); }}
                />
            </div>
            <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                    <div className="bg-background border rounded px-2 py-1 shadow-lg flex items-center gap-2 opacity-80">
                        <Box className="h-3.5 w-3.5" />
                        <span className="text-sm">Moving Layer...</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
