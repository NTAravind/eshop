'use client';

import { useCallback } from 'react';

/**
 * Inspector panel for the Storefront Builder
 * Displays and edits properties, styles, and actions for the selected node
 */

import React, { useState, useMemo } from 'react';
import { useEditorStore, selectSelectedNode } from '@/modules/builder/editor-store';
import { findNodeById } from '@/shared/utils/tree';
import { mergeStyles } from '@/modules/storefront/styles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Palette, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import type { StorefrontNode, StyleObject, ThemeVars, PrefabOverrides } from '@/types/storefront-builder';
import { hslToHex } from '@/shared/utils/color-utils';
import { cn } from '@/shared/utils';

import { TweakcnThemeEditor } from './TweakcnThemeEditor';
import { BindingsPanel } from './BindingsPanel';
import { ActionsPanel } from './ActionsPanel';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InspectorProps {
    className?: string;
    onSaveTheme?: () => Promise<void>;
    prefabs?: Record<string, StorefrontNode>;
}

const EmptySelection = () => (
    <div className="p-4 text-center text-sm text-muted-foreground">
        Select an element to edit its properties
    </div>
);

/**
 * Compact theme preview for the Inspector tab.
 * Shows color swatches + "Open Theme Editor" button.
 */
function ThemePreviewMini({ onOpenEditor }: { onOpenEditor: () => void }) {
    const theme = useEditorStore((s) => s.theme);

    const swatches = useMemo(
        () => [
            { key: 'background', label: 'BG' },
            { key: 'foreground', label: 'FG' },
            { key: 'primary', label: 'Primary' },
            { key: 'secondary', label: 'Secondary' },
            { key: 'accent', label: 'Accent' },
            { key: 'muted', label: 'Muted' },
            { key: 'card', label: 'Card' },
            { key: 'destructive', label: 'Destructive' },
            { key: 'border', label: 'Border' },
            { key: 'ring', label: 'Ring' },
        ],
        []
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Theme</span>
            </div>

            {/* Color Palette Grid */}
            <div className="grid grid-cols-5 gap-2">
                {swatches.map(({ key, label }) => {
                    const hsl = theme[key as keyof ThemeVars] || '0 0% 50%';
                    const hex = hslToHex(hsl);
                    return (
                        <div key={key} className="text-center">
                            <div
                                className="w-full aspect-square rounded-md border border-border shadow-sm"
                                style={{ backgroundColor: hex }}
                                title={`${label}: ${hex}`}
                            />
                            <span className="text-[9px] text-muted-foreground mt-1 block leading-tight">
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Live mini-preview */}
            <div className="rounded-lg border overflow-hidden">
                <div
                    className="p-3 space-y-2"
                    style={{ backgroundColor: `hsl(${theme.background || '0 0% 100%'})` }}
                >
                    <div className="flex gap-1.5">
                        <div
                            className="px-2.5 py-1 text-[10px] font-medium"
                            style={{
                                backgroundColor: `hsl(${theme.primary || '0 0% 0%'})`,
                                color: `hsl(${theme.primaryForeground || '0 0% 100%'})`,
                                borderRadius: theme.radius || '0.5rem',
                            }}
                        >
                            Primary
                        </div>
                        <div
                            className="px-2.5 py-1 text-[10px] font-medium"
                            style={{
                                backgroundColor: `hsl(${theme.secondary || '0 0% 90%'})`,
                                color: `hsl(${theme.secondaryForeground || '0 0% 0%'})`,
                                borderRadius: theme.radius || '0.5rem',
                            }}
                        >
                            Secondary
                        </div>
                        <div
                            className="px-2.5 py-1 text-[10px] font-medium"
                            style={{
                                backgroundColor: `hsl(${theme.destructive || '0 84% 60%'})`,
                                color: `hsl(${theme.destructiveForeground || '0 0% 100%'})`,
                                borderRadius: theme.radius || '0.5rem',
                            }}
                        >
                            Destructive
                        </div>
                    </div>
                    <div
                        className="rounded-md border px-2 py-1.5 text-[10px]"
                        style={{
                            borderColor: `hsl(${theme.input || '0 0% 90%'})`,
                            color: `hsl(${theme.mutedForeground || '0 0% 50%'})`,
                            borderRadius: theme.radius || '0.5rem',
                        }}
                    >
                        Search...
                    </div>
                </div>
            </div>

            {/* Radius indicator */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Border Radius</span>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {theme.radius || '0.5rem'}
                </span>
            </div>

            {/* Open Editor Button */}
            <Button onClick={onOpenEditor} className="w-full gap-2" size="sm">
                <Palette className="h-4 w-4" />
                Open Theme Editor
            </Button>
        </div>
    );
}

import { StylePanel } from './inspector/StylePanel';
import { BindingEditor } from './inspector/BindingEditor';
import { PipelineEditor } from './inspector/PipelineEditor';
import { Layers, Settings2, Paintbrush, Database, Zap } from 'lucide-react';

// Placeholder for properties until we migrate it
// reusing the existing PropertiesPanel for now, but we will move it eventually
const PropertiesTab = ({ nodeId }: { nodeId: string }) => {
    // Subscribe directly to the node to avoid stale data
    const node = useEditorStore((state) => {
        if (!state.tree) return null;
        return findNodeById(state.tree, nodeId);
    });
    const updateNode = useEditorStore((state) => state.updateNode);

    // We need to adapt the old onPropChange signatures
    const handlePropChange = useCallback((propName: string, value: unknown) => {
        // Use getState() for fresh props to avoid depending on the node reference
        const currentState = useEditorStore.getState();
        const currentTree = currentState.tree;
        if (!currentTree) return;
        const currentNode = findNodeById(currentTree, nodeId);
        if (!currentNode) return;
        updateNode(nodeId, {
            props: {
                ...currentNode.props,
                [propName]: value,
            },
        });
    }, [nodeId, updateNode]);

    if (!node) return null;
    return <PropertiesPanel node={node} onPropChange={handlePropChange} />;
};

export function Inspector({ className, onSaveTheme }: InspectorProps) {
    const selection = useEditorStore((state) => state.selection);
    const activeRightTab = useEditorStore((state) => state.activeRightTab);
    const setActiveRightTab = useEditorStore((state) => state.setActiveRightTab);
    const toggleRightPanel = useEditorStore((state) => state.toggleRightPanel);
    const collapsed = useEditorStore((state) => state.rightPanelCollapsed);

    // If collapsed, show minimal vertical bar
    if (collapsed) {
        return (
            <div className="w-10 border-l bg-background flex flex-col items-center py-2 gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleRightPanel()}>
                    <Settings2 className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    // selection.nodeId might be null
    if (!selection.nodeId) {
        return (
            <div className="w-[320px] border-l bg-background flex flex-col h-full h-screen">
                <div className="flex items-center justify-between p-2 border-b h-12 shrink-0">
                    <h2 className="text-sm font-semibold px-2">Inspector</h2>
                    <Button variant="ghost" size="icon" onClick={() => toggleRightPanel()} className="h-8 w-8">
                        <Settings2 className="w-4 h-4" />
                    </Button>
                </div>
                <EmptySelection />
            </div>
        );
    }

    const nodeId = selection.nodeId;

    return (
        <div className={cn("w-[320px] flex flex-col border-l bg-background h-full h-screen", className)}>
            <div className="flex items-center justify-between p-2 border-b h-12 shrink-0">
                <h2 className="text-sm font-semibold px-2">Inspector</h2>
                <Button variant="ghost" size="icon" onClick={() => toggleRightPanel()} className="h-8 w-8">
                    <Settings2 className="w-4 h-4" />
                </Button>
            </div>

            <Tabs
                value={activeRightTab}
                onValueChange={(v) => setActiveRightTab(v as any)}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
                <div className="px-2 pt-2 border-b shrink-0">
                    <TabsList className="w-full grid grid-cols-5 h-9">
                        <TabsTrigger value="properties" title="Properties" className="px-0">
                            <Settings2 className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="style" title="Style" className="px-0">
                            <Paintbrush className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="bindings" title="Data Bindings" className="px-0">
                            <Database className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="actions" title="Actions" className="px-0">
                            <Zap className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="children" title="Structure" className="px-0">
                            <Layers className="w-4 h-4" />
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden relative bg-background">
                    <TabsContent value="properties" className="flex-1 overflow-auto min-h-0 data-[state=active]:flex data-[state=active]:flex-col m-0">
                        <div className="p-4 flex-1 overflow-auto">
                            <PropertiesTab nodeId={nodeId} />
                        </div>
                    </TabsContent>

                    <TabsContent value="style" className="h-full mt-0 border-0 p-0 overflow-hidden">
                        <StylePanel nodeId={nodeId} />
                    </TabsContent>

                    <TabsContent value="bindings" className="h-full mt-0 border-0 p-0 overflow-hidden">
                        <BindingEditor nodeId={nodeId} />
                    </TabsContent>

                    <TabsContent value="actions" className="h-full mt-0 border-0 p-0 overflow-hidden">
                        <PipelineEditor nodeId={nodeId} />
                    </TabsContent>

                    <TabsContent value="children" className="h-full mt-0 border-0 p-4 overflow-y-auto">
                        <div className="text-sm text-muted-foreground mb-4">
                            Structure & Children
                        </div>
                        <PropertiesTabPropertiesWrapperForChildren nodeId={nodeId} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

// Wrapper to reuse existing ChildrenPanel which expects a node object
function PropertiesTabPropertiesWrapperForChildren({ nodeId }: { nodeId: string }) {
    // Subscribe directly to the node to avoid stale data
    const node = useEditorStore((state) => {
        if (!state.tree) return null;
        return findNodeById(state.tree, nodeId);
    });

    if (!node) return null;
    return <ChildrenPanel node={node} />;
}

import { getRegistry } from '@/modules/storefront/registry/init';
import { ColorPicker } from '@/modules/builder/components/inputs/ColorPicker';
import { ImagePicker } from '@/modules/builder/components/inputs/ImagePicker';
import { ProductSchemaPicker } from '@/modules/builder/components/inputs/ProductSchemaPicker';

/**
 * Sortable Child Item Component
 */
interface SortableChildItemProps {
    child: StorefrontNode;
    removeNode: (id: string) => void;
    select: (id: string) => void;
}

function SortableChildItem({ child, removeNode, select }: SortableChildItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: child.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-2 border rounded-md bg-muted/20"
        >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground p-1">
                    <GripVertical className="h-4 w-4" />
                </div>
                <div
                    className="flex items-center gap-2 cursor-pointer flex-1 overflow-hidden"
                    onClick={() => select(child.id)}
                >
                    <span className="text-xs font-medium truncate">{String(child.type)}</span>
                    {!!child.props.name && (
                        <span className="text-xs text-muted-foreground truncate">({String(child.props.name)})</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeNode(child.id)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

/**
 * Children Panel with Drag and Drop
 */
function ChildrenPanel({ node }: { node: StorefrontNode }) {
    const moveNode = useEditorStore((s) => s.moveNode);
    const removeNode = useEditorStore((s) => s.removeNode);
    const select = useEditorStore((s) => s.select);
    const children = node.children || [];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const newIndex = children.findIndex((c) => c.id === over.id);
            if (newIndex !== -1) {
                moveNode(active.id as string, node.id, newIndex);
            }
        }
    }

    if (children.length === 0) {
        return (
            <div className="text-xs text-muted-foreground p-2 border border-dashed rounded text-center">
                No children elements
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={children.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-2">
                    {children.map((child) => (
                        <SortableChildItem
                            key={child.id}
                            child={child}
                            removeNode={removeNode}
                            select={select}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

/**
 * Properties Panel
 */
interface PropertiesPanelProps {
    node: StorefrontNode;
    onPropChange: (propName: string, value: unknown) => void;
}

function PropertiesPanel({ node, onPropChange }: PropertiesPanelProps) {
    const registry = getRegistry();
    const definition = registry.components[node.type];

    // Helper to render a single control
    const renderControl = (propName: string, control: any) => (
        <div key={propName} className="space-y-2">
            <Label htmlFor={propName} className="text-xs capitalize">
                {control.label || propName}
            </Label>

            {control.type === 'text' && (
                <Input
                    id={propName}
                    value={(node.props[propName] as string) || ''}
                    onChange={(e) => onPropChange(propName, e.target.value)}
                />
            )}
            {control.type === 'textarea' && (
                <Textarea
                    id={propName}
                    value={(node.props[propName] as string) || ''}
                    onChange={(e) => onPropChange(propName, e.target.value)}
                    rows={3}
                />
            )}
            {control.type === 'number' && (
                <Input
                    id={propName}
                    type="number"
                    value={(node.props[propName] as number) || 0}
                    onChange={(e) => onPropChange(propName, Number(e.target.value))}
                    min={control.min}
                    max={control.max}
                    step={control.step}
                />
            )}
            {control.type === 'boolean' && (
                <Switch
                    id={propName}
                    checked={(node.props[propName] as boolean) || false}
                    onCheckedChange={(checked) => onPropChange(propName, checked)}
                />
            )}
            {control.type === 'select' && control.options && (
                <Select
                    value={(node.props[propName] as string) || ''}
                    onValueChange={(value) => onPropChange(propName, value)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {control.options.map((opt: any) => {
                            const label = String(typeof opt === 'string' ? opt : opt.label);
                            const value = String(typeof opt === 'string' ? opt : opt.value);
                            return (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            )}
            {control.type === 'color' && (
                <ColorPicker
                    value={(node.props[propName] as string) || ''}
                    onChange={(value) => onPropChange(propName, value)}
                />
            )}
            {control.type === 'image' && (
                <ImagePicker
                    value={(node.props[propName] as string) || ''}
                    onChange={(value) => onPropChange(propName, value)}
                />
            )}
            {control.type === 'icon' && (
                <Input
                    id={propName}
                    value={(node.props[propName] as string) || ''}
                    onChange={(e) => onPropChange(propName, e.target.value)}
                    placeholder="Icon name (Lucide)"
                />
            )}
            {control.type === 'productSchema' && (
                <ProductSchemaPicker
                    value={(node.props[propName] as string) || ''}
                    onChange={(value) => onPropChange(propName, value)}
                />
            )}
        </div>
    );

    // If registry has controls defined, use them with sections support
    if (definition?.controls) {
        // Group controls by section
        const sections: Record<string, typeof definition.controls> = {
            'General': {}
        };

        Object.entries(definition.controls).forEach(([key, control]) => {
            const section = control.section || 'General';
            if (!sections[section]) sections[section] = {};
            sections[section][key] = control;
        });

        return (
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="text-sm font-medium flex items-center gap-2 border-b pb-2">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{definition.displayName || node.type}</span>
                    </div>

                    <Accordion type="multiple" defaultValue={['General', 'Common', 'Children']} className="w-full">
                        {/* Render grouped sections */}
                        {Object.entries(sections).map(([sectionName, controls]) => (
                            <AccordionItem key={sectionName} value={sectionName}>
                                <AccordionTrigger className="text-sm py-2">{sectionName}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    {Object.entries(controls).map(([propName, control]) =>
                                        renderControl(propName, control)
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}

                        {/* Common Section */}
                        <AccordionItem value="Common">
                            <AccordionTrigger className="text-sm py-2">Common</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">ID</Label>
                                    <Input value={node.id} readOnly className="font-mono text-xs bg-muted/50" />
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Children Management */}
                        {definition.constraints?.canHaveChildren !== false && (
                            <AccordionItem value="Children">
                                <AccordionTrigger className="text-sm py-2">Children</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <ChildrenPanel node={node} />
                                </AccordionContent>
                            </AccordionItem>
                        )}
                    </Accordion>
                </div>
            </div>
        );
    }

    // Fallback for legacy/missing definitions
    const commonProps: { name: string; type: 'text' | 'textarea' | 'number' | 'boolean' | 'select'; options?: string[] }[] = [];

    // Add type-specific props
    switch (node.type) {
        case 'Heading':
        case 'Text':
            commonProps.push({ name: 'text', type: 'textarea' });
            if (node.type === 'Heading') {
                commonProps.push({ name: 'level', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] });
            }
            break;
        case 'Button':
        case 'Link':
            commonProps.push({ name: 'text', type: 'text' });
            commonProps.push({ name: 'href', type: 'text' });
            break;
        case 'Image':
            commonProps.push({ name: 'src', type: 'text' });
            commonProps.push({ name: 'alt', type: 'text' });
            break;
    }

    return (
        <div className="space-y-4">
            <div className="text-sm font-medium flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <span>{node.type}</span>
            </div>

            {commonProps.map(({ name, type, options }) => (
                <div key={name} className="space-y-2">
                    <Label htmlFor={name} className="text-xs capitalize">
                        {name}
                    </Label>
                    {type === 'text' && (
                        <Input
                            id={name}
                            value={(node.props[name] as string) || ''}
                            onChange={(e) => onPropChange(name, e.target.value)}
                        />
                    )}
                    {type === 'textarea' && (
                        <Textarea
                            id={name}
                            value={(node.props[name] as string) || ''}
                            onChange={(e) => onPropChange(name, e.target.value)}
                            rows={3}
                        />
                    )}
                    {type === 'number' && (
                        <Input
                            id={name}
                            type="number"
                            value={(node.props[name] as number) || 0}
                            onChange={(e) => onPropChange(name, Number(e.target.value))}
                        />
                    )}
                    {type === 'boolean' && (
                        <Switch
                            id={name}
                            checked={(node.props[name] as boolean) || false}
                            onCheckedChange={(checked) => onPropChange(name, checked)}
                        />
                    )}
                    {type === 'select' && options && (
                        <Select
                            value={(node.props[name] as string) || options[0]}
                            onValueChange={(value) => onPropChange(name, value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            ))}

            {/* ID field (read-only) */}
            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <Input value={node.id} readOnly className="font-mono text-xs" />
            </div>

            {/* Children Management Logic for fallback */}
            <div className="pt-4 border-t">
                <Label className="text-xs font-semibold mb-2 block">Children</Label>
                <ChildrenPanel node={node} />
            </div>
        </div>
    );
}

/**
 * Styles Panel
 */
/**
 * Styles Panel
 */
interface StylesPanelProps {
    node: StorefrontNode;
    onStyleChange: (breakpoint: keyof StyleObject, property: string, value: string) => void;
}

function StylesPanel({ node, onStyleChange }: StylesPanelProps) {
    const device = useEditorStore((s) => s.device);

    // Map device → breakpoint key
    const activeBreakpoint: keyof StyleObject =
        device === 'mobile' ? 'sm' : device === 'tablet' ? 'md' : 'base';

    const breakpointLabel =
        activeBreakpoint === 'base' ? 'Desktop' : activeBreakpoint === 'md' ? 'Tablet' : 'Mobile';

    const baseStyles = node.styles?.base || {};
    const bpStyles = (node.styles?.[activeBreakpoint] || {}) as Record<string, string>;

    // For display: merge base + breakpoint-specific (breakpoint overrides base)
    const mergedStyles: Record<string, string> = { ...(baseStyles as Record<string, string>), ...bpStyles };

    const handleChange = (property: string, value: string) => {
        onStyleChange(activeBreakpoint, property, value);
    };

    // getValue returns the breakpoint-specific value if editing a non-base breakpoint,
    // otherwise the merged value
    const getValue = (property: string) => {
        if (activeBreakpoint === 'base') {
            return (baseStyles as Record<string, string>)[property] || '';
        }
        // For non-base: show the override if it exists, otherwise show base as placeholder-like
        return bpStyles[property] ?? '';
    };

    // Check if a property has an override on the current breakpoint
    const hasOverride = (property: string) => {
        return activeBreakpoint !== 'base' && property in bpStyles;
    };

    // Specialized Input Components
    const SizeInput = ({ label, property }: { label: string, property: string }) => (
        <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">{label}</Label>
            <Input
                className="h-7 text-xs px-2"
                value={getValue(property)}
                onChange={(e) => handleChange(property, e.target.value)}
            />
        </div>
    );

    const SelectInput = ({ label, property, options }: { label: string, property: string, options: string[] }) => (
        <div className="flex flex-col gap-1">
            <Label className="text-[10px] text-muted-foreground">{label}</Label>
            <Select value={getValue(property)} onValueChange={(v) => handleChange(property, v)}>
                <SelectTrigger className="h-7 text-xs px-2 icon-xs">
                    <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    const ColorInput = ({ label, property }: { label: string, property: string }) => {
        const value = getValue(property);
        return (
            <div className="flex flex-col gap-1 col-span-2">
                <Label className="text-[10px] text-muted-foreground">{label}</Label>
                <div className="flex gap-2 items-center">
                    <div className="h-7 w-7 rounded border overflow-hidden shrink-0 relative">
                        <input
                            type="color"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            value={value.startsWith('#') ? value : '#000000'}
                            onChange={(e) => handleChange(property, e.target.value)}
                        />
                        <div
                            className="w-full h-full"
                            style={{ backgroundColor: value || 'transparent' }}
                        />
                    </div>
                    <Input
                        className="h-7 text-xs flex-1"
                        value={value}
                        onChange={(e) => handleChange(property, e.target.value)}
                        placeholder="hex, rgb, hsl..."
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Breakpoint indicator */}
            {activeBreakpoint !== 'base' && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Editing: {breakpointLabel}
                    </span>
                    <span className="text-[10px] text-blue-500 dark:text-blue-500">
                        ({activeBreakpoint === 'sm' ? '≥640px' : '≥768px'} overrides)
                    </span>
                </div>
            )}

            <Accordion type="multiple" defaultValue={['layout', 'typography', 'appearance']} className="w-full">

                {/* Layout Section */}
                <AccordionItem value="layout">
                    <AccordionTrigger className="text-xs font-semibold py-2">Layout</AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                            <SelectInput label="Display" property="display" options={['block', 'flex', 'grid', 'inline', 'inline-block', 'none']} />
                            <SelectInput label="Position" property="position" options={['static', 'relative', 'absolute', 'fixed', 'sticky']} />
                        </div>

                        {getValue('display') === 'flex' && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded">
                                <SelectInput label="Direction" property="flexDirection" options={['row', 'column', 'row-reverse', 'column-reverse']} />
                                <SelectInput label="Wrap" property="flexWrap" options={['nowrap', 'wrap', 'wrap-reverse']} />
                                <SelectInput label="Justify" property="justifyContent" options={['flex-start', 'center', 'flex-end', 'space-between', 'space-around']} />
                                <SelectInput label="Align" property="alignItems" options={['flex-start', 'center', 'flex-end', 'stretch', 'baseline']} />
                                <div className="col-span-2">
                                    <SizeInput label="Gap" property="gap" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <SizeInput label="Width" property="width" />
                            <SizeInput label="Height" property="height" />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Margin (T R B L)</Label>
                            <Input className="h-7 text-xs" value={getValue('margin')} onChange={(e) => handleChange('margin', e.target.value)} placeholder="0px" />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Padding (T R B L)</Label>
                            <Input className="h-7 text-xs" value={getValue('padding')} onChange={(e) => handleChange('padding', e.target.value)} placeholder="0px" />
                        </div>

                        {(getValue('position') === 'absolute' || getValue('position') === 'fixed') && (
                            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/30 rounded">
                                <SizeInput label="Top" property="top" />
                                <SizeInput label="Right" property="right" />
                                <SizeInput label="Bottom" property="bottom" />
                                <SizeInput label="Left" property="left" />
                            </div>
                        )}
                        <SizeInput label="Z-Index" property="zIndex" />
                    </AccordionContent>
                </AccordionItem>

                {/* Typography Section */}
                <AccordionItem value="typography">
                    <AccordionTrigger className="text-xs font-semibold py-2">Typography</AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                            <SizeInput label="Font Size" property="fontSize" />
                            <SelectInput label="Font Weight" property="fontWeight" options={['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <SelectInput label="Align" property="textAlign" options={['left', 'center', 'right', 'justify']} />
                            <SizeInput label="Line Height" property="lineHeight" />
                        </div>
                        <ColorInput label="Text Color" property="color" />
                    </AccordionContent>
                </AccordionItem>

                {/* Appearance Section */}
                <AccordionItem value="appearance">
                    <AccordionTrigger className="text-xs font-semibold py-2">Appearance</AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <ColorInput label="Background Color" property="backgroundColor" />

                        <div className="grid grid-cols-2 gap-2">
                            <SizeInput label="Border Radius" property="borderRadius" />
                            <SizeInput label="Opacity" property="opacity" />
                        </div>

                        <div className="space-y-1 border-t pt-2">
                            <Label className="text-[10px] text-muted-foreground mb-1 block">Border</Label>
                            <div className="grid grid-cols-3 gap-1">
                                <SelectInput label="Style" property="borderStyle" options={['none', 'solid', 'dashed', 'dotted']} />
                                <SizeInput label="Width" property="borderWidth" />
                                <div className="col-span-1"></div>
                            </div>
                            {getValue('borderStyle') !== 'none' && getValue('borderStyle') !== '' && (
                                <div className="mt-2">
                                    <ColorInput label="Border Color" property="borderColor" />
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Effects Section */}
                <AccordionItem value="effects">
                    <AccordionTrigger className="text-xs font-semibold py-2">Effects</AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Box Shadow</Label>
                            <Input className="h-7 text-xs" value={getValue('boxShadow')} onChange={(e) => handleChange('boxShadow', e.target.value)} placeholder="none" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <SelectInput label="Cursor" property="cursor" options={['auto', 'default', 'pointer', 'text', 'move', 'not-allowed']} />
                            <SelectInput label="Overflow" property="overflow" options={['visible', 'hidden', 'scroll', 'auto']} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
