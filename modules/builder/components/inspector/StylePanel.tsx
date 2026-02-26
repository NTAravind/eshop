'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import {
    Monitor,
    Tablet,
    Smartphone,
    MousePointer2,
    Zap,
    Hand
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

import { TypographySection } from './style/sections/TypographySection';
import { DimensionsSection } from './style/sections/DimensionsSection';
import { BackgroundSection } from './style/sections/BackgroundSection';
import { BorderSection } from './style/sections/BorderSection';
import { EffectsSection } from './style/sections/EffectsSection';

import {
    resolveTokenPath,
    Breakpoint
} from '@/modules/storefront/tokens';
import { findNodeById } from '@/shared/utils/tree';
import type { DesignTokenMap } from '@/types/storefront-builder';

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

type ElementState = 'default' | 'hover' | 'focus' | 'active';

const STATES: { id: ElementState; icon: React.ElementType; label: string }[] = [
    { id: 'default', icon: Monitor, label: 'Default' },
    { id: 'hover', icon: MousePointer2, label: 'Hover' },
    { id: 'focus', icon: Zap, label: 'Focus' },
    { id: 'active', icon: Hand, label: 'Pressed' },
];

export function StylePanel({ nodeId }: StylePanelProps) {
    // 1. Efficient Store Selection
    const tree = useEditorStore((s) => s.tree);
    const theme = useEditorStore((s) => s.theme);
    const updateNode = useEditorStore((s) => s.updateNode);

    const nodeData = useMemo(() => {
        if (!tree) return null;
        const n = findNodeById(tree, nodeId);
        if (!n) return null;
        return {
            id: n.id,
            type: n.type,
            styleTokens: n.styleTokens || {},
            styleOverrides: n.styleOverrides || {},
            // Include V1 legacy styles for bridging
            legacyStyles: n.styles || {},
        };
    }, [tree, nodeId]);

    // 2. Local View State
    const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('base');
    const [activeState, setActiveState] = useState<ElementState>('default');

    // 3. Compute Effective Styles & Current Layer
    const { effectiveStyles, currentLayerOverrides, hasV2System } = useMemo(() => {
        if (!nodeData) return { effectiveStyles: {}, currentLayerOverrides: {}, hasV2System: false };

        const tokens = nodeData.styleTokens || {};
        const overrides = nodeData.styleOverrides || {};
        const legacy = nodeData.legacyStyles || {};
        const baseOverrides = overrides.base || {};

        // Check if node has actual V2 style system (not legacy)
        const hasV2 = Object.keys(tokens).length > 0 || Object.keys(overrides).length > 0;

        // Start with resolved tokens (if theme available)
        const resolved: Record<string, any> = {};
        if (theme) {
            Object.entries(tokens).forEach(([prop, path]) => {
                if (path) {
                    resolved[prop] = resolveTokenPath(path, theme as unknown as DesignTokenMap);
                }
            });
        }

        // Apply Base Overrides (always active as foundation)
        Object.assign(resolved, baseOverrides);

        // Determine current layer object
        let layer: Record<string, any> = {};

        if (activeState !== 'default') {
            // State Mode (Hover/Focus/Active)
            layer = overrides[activeState] || {};
            Object.assign(resolved, layer);
        } else {
            // Breakpoint Mode
            if (activeBreakpoint !== 'base') {
                layer = overrides[activeBreakpoint] || {};
                Object.assign(resolved, layer);
            } else {
                layer = baseOverrides;
            }
        }

        // If no V2 system, fall back to V1 legacy styles
        // Only use legacy if there's no V2 at all
        if (!hasV2) {
            const legacyBase = legacy.base || {};
            Object.assign(resolved, legacyBase);
            layer = legacyBase;
        }

        return {
            effectiveStyles: resolved,
            currentLayerOverrides: layer,
            hasV2System: hasV2
        };
    }, [nodeData, theme, activeBreakpoint, activeState]);

    // 4. Update Handlers
    const handleStyleUpdate = useCallback((property: string, value: any) => {
        if (!nodeData) return;

        // Only use V2 if there's already a V2 system (styleTokens or styleOverrides)
        // Don't migrate legacy styles to V2 automatically - that causes issues
        const hasV2 = hasV2System;

        if (hasV2) {
            // V2 update
            const newOverrides = { ...(nodeData.styleOverrides || {}) };

            let targetKey: string = activeBreakpoint;
            if (activeState !== 'default') {
                targetKey = activeState;
            }

            // Initialize target layer if missing, or clone it if it exists
            const currentLayer = newOverrides[targetKey as keyof typeof newOverrides];
            // @ts-ignore
            newOverrides[targetKey] = currentLayer ? { ...currentLayer } : {};

            // Update value
            // @ts-ignore
            newOverrides[targetKey][property] = value;

            // If value is empty, cleanup
            if (value === '' || value === undefined || value === null) {
                // @ts-ignore
                delete newOverrides[targetKey][property];
                // @ts-ignore
                if (Object.keys(newOverrides[targetKey]).length === 0) {
                    // @ts-ignore
                    delete newOverrides[targetKey];
                }
            }

            updateNode(nodeId, { styleOverrides: newOverrides });
        } else {
            // Legacy V1 update - write to styles directly
            const newStyles = {
                ...nodeData.legacyStyles,
                base: {
                    ...nodeData.legacyStyles?.base,
                    [property]: value
                }
            };
            updateNode(nodeId, { styles: newStyles });
        }
    }, [nodeData, hasV2System, activeBreakpoint, activeState, nodeId, updateNode]);

    const handleTokenChange = useCallback((property: string, tokenPath: string) => {
        if (!nodeData) return;
        const newStyleTokens = { ...(nodeData.styleTokens || {}) };

        if (tokenPath) {
            newStyleTokens[property] = tokenPath;
            // Clear override in current layer if in default/base to allow token to show
            if (activeState === 'default' && activeBreakpoint === 'base') {
                handleStyleUpdate(property, undefined);
            }
        } else {
            delete newStyleTokens[property];
        }

        updateNode(nodeId, { styleTokens: newStyleTokens });
    }, [nodeData, nodeId, updateNode, activeState, activeBreakpoint, handleStyleUpdate]);

    const handleReset = useCallback((property: string) => {
        handleStyleUpdate(property, undefined);
    }, [handleStyleUpdate]);

    if (!nodeData) {
        return <div className="p-8 text-center text-sm text-muted-foreground">Select an element to style</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header: State & Breakpoint */}
            <div className="flex flex-col border-b bg-muted/20">
                {/* State Selector */}
                <div className="px-2 py-2 flex items-center gap-2">
                    <Select
                        value={activeState}
                        onValueChange={(v) => setActiveState(v as ElementState)}
                    >
                        <SelectTrigger className="h-8 text-xs w-full bg-background border-muted-foreground/20">
                            <div className="flex items-center gap-2">
                                {React.createElement(STATES.find(s => s.id === activeState)?.icon || Monitor, { className: "w-3.5 h-3.5" })}
                                <span>{STATES.find(s => s.id === activeState)?.label}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {STATES.map(state => (
                                <SelectItem key={state.id} value={state.id} className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <state.icon className="w-3.5 h-3.5" />
                                        <span>{state.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Breakpoint Selector - Only visible/active in Default State */}
                {activeState === 'default' && (
                    <div className="px-1 pb-2">
                        <Tabs value={activeBreakpoint} onValueChange={(v) => setActiveBreakpoint(v as Breakpoint)}>
                            <TabsList className="w-full grid grid-cols-5 h-7 p-0 bg-transparent">
                                {BREAKPOINTS.map((bp) => (
                                    <TabsTrigger
                                        key={bp.id}
                                        value={bp.id}
                                        className="h-7 text-[10px] px-0 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                                        title={bp.label}
                                    >
                                        <bp.icon className="w-3.5 h-3.5" />
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                )}

                {/* Context Indicator */}
                {activeState !== 'default' && (
                    <div className="px-2 pb-2 text-[10px] text-amber-600 bg-amber-50/50 flex items-center gap-1.5 mx-2 mb-2 rounded border border-amber-100/50">
                        <Zap className="w-3 h-3" />
                        Editing global {activeState} styles
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6 pb-20">
                    <DimensionsSection
                        values={effectiveStyles}
                        overrides={currentLayerOverrides}
                        tokens={nodeData.styleTokens}
                        theme={theme as unknown as DesignTokenMap}
                        onChange={handleStyleUpdate}
                        onTokenChange={handleTokenChange}
                        onReset={handleReset}
                    />

                    <TypographySection
                        values={effectiveStyles}
                        overrides={currentLayerOverrides}
                        tokens={nodeData.styleTokens}
                        theme={theme as unknown as DesignTokenMap}
                        onChange={handleStyleUpdate}
                        onTokenChange={handleTokenChange}
                        onReset={handleReset}
                    />

                    <BackgroundSection
                        values={effectiveStyles}
                        overrides={currentLayerOverrides}
                        tokens={nodeData.styleTokens}
                        theme={theme as unknown as DesignTokenMap}
                        onChange={handleStyleUpdate}
                        onTokenChange={handleTokenChange}
                        onReset={handleReset}
                    />

                    <BorderSection
                        values={effectiveStyles}
                        overrides={currentLayerOverrides}
                        tokens={nodeData.styleTokens}
                        theme={theme as unknown as DesignTokenMap}
                        onChange={handleStyleUpdate}
                        onTokenChange={handleTokenChange}
                        onReset={handleReset}
                    />

                    <EffectsSection
                        values={effectiveStyles}
                        overrides={currentLayerOverrides}
                        tokens={nodeData.styleTokens}
                        theme={theme as unknown as DesignTokenMap}
                        onChange={handleStyleUpdate}
                        onTokenChange={handleTokenChange}
                        onReset={handleReset}
                    />
                </div>
            </ScrollArea>
        </div>
    );
}
