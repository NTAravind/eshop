'use client';

import React, { useMemo, useCallback } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Tablet, Smartphone, X, Link as LinkIcon } from 'lucide-react';
import {
    resolveTokenPath,
    filterSafeOverrides,
    Breakpoint
} from '@/modules/storefront/tokens';
import { TokenPicker } from './TokenPicker';
import { findNodeById } from '@/shared/utils/tree';
import type { StyleObject, SafeCSSProperties, DesignTokenMap } from '@/types/storefront-builder';

interface StylePanelProps {
    nodeId: string;
}

const BREAKPOINTS: { id: Breakpoint; icon: React.ElementType; label: string }[] = [
    { id: 'base', icon: Monitor, label: 'Base' },
    { id: 'sm', icon: Smartphone, label: 'SM' },
    { id: 'md', icon: Tablet, label: 'MD' },
    { id: 'lg', icon: Monitor, label: 'LG' },
    { id: 'xl', icon: Monitor, label: 'XL' },
];

const COMMON_PROPS = {
    layout: ['display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'padding', 'margin'],
    typography: ['color', 'fontSize', 'fontWeight', 'textAlign'],
    appearance: ['backgroundColor', 'borderRadius', 'border', 'boxShadow', 'opacity'],
    dimensions: ['width', 'height', 'minWidth', 'minHeight'],
};

export function StylePanel({ nodeId }: StylePanelProps) {
    // Subscribe only to the specific properties we need
    const tree = useEditorStore((s) => s.tree);
    const nodeData = React.useMemo(() => {
        if (!tree) return null;
        const n = findNodeById(tree, nodeId);
        if (!n) return null;
        return {
            id: n.id,
            type: n.type,
            styleTokens: n.styleTokens,
            styleOverrides: n.styleOverrides
        };
    }, [tree, nodeId]);
    const theme = useEditorStore((s) => s.theme);
    const updateNode = useEditorStore((s) => s.updateNode);

    // Reconstruct minimal node for rendering
    const node = nodeData;

    // Local state for active breakpoint tab
    const [activeBreakpoint, setActiveBreakpoint] = React.useState<Breakpoint>('base');

    if (!node) return <div className="p-4 text-sm text-muted-foreground">Select a node to edit styles.</div>;

    // Helper to update a style token
    const handleTokenChange = useCallback((property: string, tokenPath: string) => {
        const newStyleTokens = { ...node?.styleTokens };
        if (tokenPath) {
            newStyleTokens[property] = tokenPath;
        } else {
            delete newStyleTokens[property];
        }
        updateNode(nodeId, { styleTokens: newStyleTokens });
    }, [node?.styleTokens, nodeId, updateNode]);

    // Helper to update an override value
    const handleOverrideChange = useCallback((property: string, value: string) => {
        const newOverrides = node?.styleOverrides ? { ...node.styleOverrides } : { base: {} };
        if (!newOverrides[activeBreakpoint]) {
            newOverrides[activeBreakpoint] = {};
        }

        // If value is empty, remove the override
        if (!value) {
            delete (newOverrides[activeBreakpoint] as any)[property];
            // Cleanup empty breakpoint objects
            if (Object.keys(newOverrides[activeBreakpoint]!).length === 0) {
                delete newOverrides[activeBreakpoint];
            }
        } else {
            (newOverrides[activeBreakpoint] as any)[property] = value;
        }

        updateNode(nodeId, { styleOverrides: newOverrides });
    }, [node?.styleOverrides, activeBreakpoint, nodeId, updateNode]);

    const renderPropertyInput = (property: string, label: string) => {
        // 1. Check if bound to a token
        const tokenPath = node.styleTokens?.[property];
        const isTokenBound = !!tokenPath;

        // 2. Check if has override for current breakpoint
        const overrideValue = node.styleOverrides?.[activeBreakpoint]?.[property];

        // 3. Resolve effective value for display
        // If override exists, it wins. Else if token exists, resolve it.
        const resolvedTokenValue = tokenPath ? resolveTokenPath(tokenPath, theme as unknown as DesignTokenMap) : undefined;
        const displayValue = overrideValue ?? resolvedTokenValue ?? '';

        return (
            <div key={property} className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    {isTokenBound && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded-sm flex items-center">
                                <LinkIcon className="w-2.5 h-2.5 mr-1" />
                                {tokenPath}
                            </span>
                            {/* Option to detach token */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleTokenChange(property, '')}
                                title="Detach token"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {/* Token Picker Trigger */}
                    {!overrideValue && (
                        <div className="w-8 shrink-0">
                            <TokenPicker
                                theme={theme as unknown as DesignTokenMap}
                                value={tokenPath}
                                onChange={(path) => handleTokenChange(property, path)}
                                trigger={
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        title="Pick generic token"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                }
                            />
                        </div>
                    )}

                    {/* Manual Input (Override) */}
                    <Input
                        className={`h-8 text-xs ${overrideValue ? 'border-primary/50 bg-primary/5' : ''}`}
                        value={displayValue}
                        placeholder={isTokenBound ? 'Token value...' : 'unset'}
                        onChange={(e) => handleOverrideChange(property, e.target.value)}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Breakpoint Tabs */}
            <div className="p-2 border-b bg-muted/40">
                <Tabs value={activeBreakpoint} onValueChange={(v) => setActiveBreakpoint(v as Breakpoint)}>
                    <TabsList className="w-full grid grid-cols-5 h-8">
                        {BREAKPOINTS.map((bp) => (
                            <TabsTrigger key={bp.id} value={bp.id} className="text-[10px] px-0 h-7">
                                <bp.icon className="w-3 h-3 md:mr-1" />
                                <span className="hidden md:inline">{bp.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                {activeBreakpoint !== 'base' && (
                    <div className="mt-2 text-[10px] text-amber-600 flex items-center justify-center bg-amber-50 py-1 rounded border border-amber-100">
                        Editing {activeBreakpoint} overrides only (inherits from base)
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Layout Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold mb-3 tracking-wide text-foreground/80">Layout</h3>
                    <div className="grid grid-cols-2 gap-x-4">
                        {renderPropertyInput('display', 'Display')}
                        {renderPropertyInput('gap', 'Gap')}
                        {renderPropertyInput('padding', 'Padding')}
                        {renderPropertyInput('margin', 'Margin')}
                    </div>
                </div>

                {/* Typography Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold mb-3 tracking-wide text-foreground/80">Typography</h3>
                    <div className="grid grid-cols-1 gap-x-4">
                        {renderPropertyInput('color', 'Color')}
                        {renderPropertyInput('fontSize', 'Size')}
                        {renderPropertyInput('fontWeight', 'Weight')}
                        {renderPropertyInput('textAlign', 'Align')}
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold mb-3 tracking-wide text-foreground/80">Appearance</h3>
                    <div className="grid grid-cols-1 gap-x-4">
                        {renderPropertyInput('backgroundColor', 'Background')}
                        {renderPropertyInput('borderRadius', 'Radius')}
                        {renderPropertyInput('boxShadow', 'Shadow')}
                        {renderPropertyInput('opacity', 'Opacity')}
                    </div>
                </div>

                {/* Dimensions Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold mb-3 tracking-wide text-foreground/80">Dimensions</h3>
                    <div className="grid grid-cols-2 gap-x-4">
                        {renderPropertyInput('width', 'Width')}
                        {renderPropertyInput('height', 'Height')}
                    </div>
                </div>
            </div>
        </div>
    );
}
