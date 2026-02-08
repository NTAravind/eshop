'use client';

/**
 * Inspector panel for the Storefront Builder
 * Displays and edits properties, styles, and actions for the selected node
 */

import React from 'react';
import { useEditorStore, selectSelectedNode } from '@/lib/builder/editor-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { StorefrontNode, StyleObject } from '@/types/storefront-builder';

interface InspectorProps {
    className?: string;
}

import { ThemePanel } from './ThemePanel';

interface InspectorProps {
    className?: string;
}

export function Inspector({ className }: InspectorProps) {
    const selectedNode = useEditorStore(selectSelectedNode);
    const activeRightTab = useEditorStore((state) => state.activeRightTab);
    const setActiveRightTab = useEditorStore((state) => state.setActiveRightTab);
    const { updateNode } = useEditorStore();

    const handlePropChange = (propName: string, value: unknown) => {
        if (!selectedNode) return;
        updateNode(selectedNode.id, {
            props: {
                ...selectedNode.props,
                [propName]: value,
            },
        });
    };

    const handleStyleChange = (
        breakpoint: keyof StyleObject,
        property: string,
        value: string
    ) => {
        if (!selectedNode) return;
        const currentStyles = selectedNode.styles || {};
        const currentBreakpoint = currentStyles[breakpoint] || {};

        updateNode(selectedNode.id, {
            styles: {
                ...currentStyles,
                [breakpoint]: {
                    ...currentBreakpoint,
                    [property]: value,
                },
            },
        });
    };

    const EmptySelection = () => (
        <div className="p-4 text-center text-sm text-muted-foreground">
            Select an element to edit its properties
        </div>
    );

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={className} />;
    }

    return (
        <div className={className}>
            <Tabs
                value={activeRightTab}
                onValueChange={(v) => setActiveRightTab(v as typeof activeRightTab)}
                className="w-full"
            >
                <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="properties">Props</TabsTrigger>
                    <TabsTrigger value="styles">Styles</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="p-4 space-y-4">
                    {selectedNode ? (
                        <PropertiesPanel node={selectedNode} onPropChange={handlePropChange} />
                    ) : (
                        <EmptySelection />
                    )}
                </TabsContent>

                <TabsContent value="styles" className="p-4 space-y-4">
                    {selectedNode ? (
                        <StylesPanel node={selectedNode} onStyleChange={handleStyleChange} />
                    ) : (
                        <EmptySelection />
                    )}
                </TabsContent>

                <TabsContent value="actions" className="p-4 space-y-4">
                    {selectedNode ? (
                        <ActionsPanel node={selectedNode} />
                    ) : (
                        <EmptySelection />
                    )}
                </TabsContent>

                <TabsContent value="theme" className="h-[calc(100vh-8rem)]">
                    <ThemePanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}

import { getRegistry } from '@/lib/storefront/registry/init';
import { ColorPicker } from '@/components/builder/inputs/ColorPicker';
import { ImagePicker } from '@/components/builder/inputs/ImagePicker';

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

    // If registry has controls defined, use them
    if (definition?.controls) {
        return (
            <div className="space-y-4">
                <div className="text-sm font-medium flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{definition.displayName || node.type}</span>
                </div>

                {Object.entries(definition.controls).map(([propName, control]) => (
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
                                    {control.options.map((opt) => {
                                        const label = typeof opt === 'string' ? opt : opt.label;
                                        const value = typeof opt === 'string' ? opt : opt.value;
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
                    </div>
                ))}

                {/* ID field (read-only) */}
                <div className="space-y-2 pt-4 border-t">
                    <Label className="text-xs text-muted-foreground">ID</Label>
                    <Input value={node.id} readOnly className="font-mono text-xs bg-muted/50" />
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
        </div>
    );
}

/**
 * Styles Panel
 */
interface StylesPanelProps {
    node: StorefrontNode;
    onStyleChange: (breakpoint: keyof StyleObject, property: string, value: string) => void;
}

function StylesPanel({ node, onStyleChange }: StylesPanelProps) {
    const baseStyles = node.styles?.base || {};

    const styleProperties: { name: string; cssProperty: string; type: 'text' | 'color' | 'select'; options?: string[] }[] = [
        { name: 'Width', cssProperty: 'width', type: 'text' },
        { name: 'Height', cssProperty: 'height', type: 'text' },
        { name: 'Padding', cssProperty: 'padding', type: 'text' },
        { name: 'Margin', cssProperty: 'margin', type: 'text' },
        { name: 'Background', cssProperty: 'backgroundColor', type: 'color' },
        { name: 'Color', cssProperty: 'color', type: 'color' },
        { name: 'Font Size', cssProperty: 'fontSize', type: 'text' },
        { name: 'Font Weight', cssProperty: 'fontWeight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
        { name: 'Display', cssProperty: 'display', type: 'select', options: ['block', 'flex', 'grid', 'inline', 'inline-block', 'none'] },
        { name: 'Justify', cssProperty: 'justifyContent', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around'] },
        { name: 'Align', cssProperty: 'alignItems', type: 'select', options: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'] },
        { name: 'Gap', cssProperty: 'gap', type: 'text' },
        { name: 'Border Radius', cssProperty: 'borderRadius', type: 'text' },
    ];

    return (
        <div className="space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Base Styles
            </div>

            <div className="grid grid-cols-2 gap-3">
                {styleProperties.map(({ name, cssProperty, type, options }) => (
                    <div key={cssProperty} className="space-y-1">
                        <Label className="text-xs">{name}</Label>
                        {type === 'text' && (
                            <Input
                                value={(baseStyles as Record<string, string>)[cssProperty] || ''}
                                onChange={(e) => onStyleChange('base', cssProperty, e.target.value)}
                                className="h-8 text-xs"
                            />
                        )}
                        {type === 'color' && (
                            <div className="flex gap-1">
                                <Input
                                    type="color"
                                    value={(baseStyles as Record<string, string>)[cssProperty] || '#000000'}
                                    onChange={(e) => onStyleChange('base', cssProperty, e.target.value)}
                                    className="h-8 w-10 p-1"
                                />
                                <Input
                                    value={(baseStyles as Record<string, string>)[cssProperty] || ''}
                                    onChange={(e) => onStyleChange('base', cssProperty, e.target.value)}
                                    className="h-8 text-xs flex-1"
                                />
                            </div>
                        )}
                        {type === 'select' && options && (
                            <Select
                                value={(baseStyles as Record<string, string>)[cssProperty] || ''}
                                onValueChange={(value) => onStyleChange('base', cssProperty, value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select..." />
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
            </div>
        </div>
    );
}

/**
 * Actions Panel
 */
interface ActionsPanelProps {
    node: StorefrontNode;
}

function ActionsPanel({ node }: ActionsPanelProps) {
    const actions = node.actions || {};

    return (
        <div className="space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
            </div>

            {Object.keys(actions).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No actions configured for this element.
                </p>
            ) : (
                <div className="space-y-2">
                    {Object.entries(actions).map(([event, action]) => (
                        <div key={event} className="p-3 bg-muted rounded-md">
                            <div className="text-sm font-medium">{event}</div>
                            <div className="text-xs text-muted-foreground">
                                {action.actionId}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
