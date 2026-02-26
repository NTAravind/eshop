'use client';

/**
 * Runtime renderer for storefront documents
 * Renders StorefrontNode trees with bindings and actions resolved
 */

import React, { useMemo, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
    StorefrontNode,
    BindingContext,
    RepeaterScope,
    PrefabOverrides,
    ResponsiveStyleOverrides,
    ActionPipeline,
    StyleTokenMap,
} from '@/types/storefront-builder';
import { useRuntimeContext } from './context';
import { resolveNodeBindings } from '../bindings';
import { getCurrentBreakpoint, resolveStyles } from '../styles';
import { resolveNodeStyles, resolveOverridesOnly } from '../tokens';
import { useDynamicStyles } from './style-injector';
import { getComponent, isValidComponent } from '../registry';
import { useTheme } from './providers';

type Breakpoint = ReturnType<typeof getCurrentBreakpoint>;

function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>('base');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let frame: number | null = null;

        const handleResize = () => {
            if (frame) cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                setBreakpoint(getCurrentBreakpoint(window.innerWidth));
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return breakpoint;
}

export interface RendererProps {
    tree: StorefrontNode;
    scope?: RepeaterScope;
}

/**
 * Error boundary for individual nodes – prevents one broken component
 * from crashing the entire page.
 */
class NodeErrorBoundary extends React.Component<
    { nodeId: string; nodeType: string; children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { nodeId: string; nodeType: string; children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error) {
        console.error(`[Renderer] Error in <${this.props.nodeType}> (${this.props.nodeId}):`, error);
    }
    render() {
        if (this.state.hasError) {
            return null; // silently skip broken node
        }
        return this.props.children;
    }
}

/**
 * Create a simple merge of responsive overrides
 */
function mergeResponsiveOverrides(
    a: ResponsiveStyleOverrides | undefined,
    b: ResponsiveStyleOverrides | undefined
): ResponsiveStyleOverrides {
    if (!a) return b || {};
    if (!b) return a;

    const merged: ResponsiveStyleOverrides = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof ResponsiveStyleOverrides>;

    for (const key of keys) {
        if (a[key] && b[key]) {
            merged[key] = { ...a[key], ...b[key] };
        } else {
            merged[key] = (a[key] || b[key]) as any;
        }
    }
    return merged;
}

/**
 * Render a single node with resolved bindings and styles
 */
function RenderNode({ node, context, breakpoint }: { node: StorefrontNode; context: BindingContext; breakpoint: Breakpoint }) {
    const { createHandler, dispatchPipeline } = useRuntimeContext();
    const theme = useTheme();

    // Skip hidden nodes
    if (node.hidden) return null;

    // Handle special node types that need custom rendering
    if (node.type === 'Repeater') {
        return <RenderRepeater node={node} context={context} breakpoint={breakpoint} />;
    }

    if (node.type === 'Conditional') {
        return <RenderConditional node={node} context={context} breakpoint={breakpoint} />;
    }

    if (node.type === 'Prefab') {
        return <RenderPrefab node={node} context={context} breakpoint={breakpoint} />;
    }

    // Render unknown components as a visible placeholder
    if (!isValidComponent(node.type)) {
        const children = node.children
            ?.filter((child) => !child.hidden)
            .map((child, index) => (
                <RenderNode key={child.id || index} node={child} context={context} breakpoint={breakpoint} />
            ));

        return (
            <NodeErrorBoundary nodeId={node.id} nodeType={node.type}>
                <div
                    data-node-id={node.id}
                    style={{
                        border: '1px dashed var(--destructive, #ef4444)',
                        padding: '8px',
                        minHeight: '32px',
                        opacity: 0.6,
                        borderRadius: '4px',
                    }}
                >
                    <span style={{ fontSize: '12px', color: 'var(--muted-foreground, #888)' }}>
                        Unknown: {node.type}
                    </span>
                    {children}
                </div>
            </NodeErrorBoundary>
        );
    }

    // Get the component from registry
    const Component = getComponent(node.type);
    if (!Component) {
        return null;
    }

    // Resolve bindings (V2)
    const resolvedProps = resolveNodeBindings(node, context);

    // Resolve styles (V2 with theme, V2 overrides-only without theme, or V1 fallback)
    let resolvedStyles: CSSProperties = {};
    if (theme?.theme) {
        resolvedStyles = resolveNodeStyles(node, theme.theme, breakpoint);
    } else if (node.styleOverrides) {
        // V2 overrides without theme - apply directly
        resolvedStyles = resolveOverridesOnly(node.styleOverrides, breakpoint);
    }
    // Fall back to V1 if still empty
    if (Object.keys(resolvedStyles).length === 0 && node.styles?.base) {
        resolvedStyles = resolveStyles(node.styles, breakpoint);
    }

    // Create action handlers (V2 pipelines)
    const actionHandlers: Record<string, (...args: any[]) => Promise<void>> = {};
    if (node.actionMap) {
        for (const [slot, pipeline] of Object.entries(node.actionMap)) {
            actionHandlers[slot] = async (...args: any[]) => {
                const eventContext = {
                    ...context,
                    $event: args.length > 0 ? (args.length === 1 ? args[0] : args) : undefined
                };
                await dispatchPipeline(pipeline, eventContext);
            };
        }
    }

    // Inject dynamic styles (hover, focus, active)
    // Pass both V1 and V2 styles - hook prefers V2
    const dynamicClassName = useDynamicStyles(node.id, node.styles, node.styleOverrides);

    // Render children (skip hidden children)
    const children = node.children
        ?.filter((child) => !child.hidden)
        .map((child, index) => (
            <RenderNode key={child.id || index} node={child} context={context} breakpoint={breakpoint} />
        ));

    // Render the component inside an error boundary
    return (
        <NodeErrorBoundary nodeId={node.id} nodeType={node.type}>
            <Component
                {...resolvedProps}
                style={resolvedStyles}
                className={dynamicClassName}
                {...actionHandlers}
                data-node-id={node.id}
            >
                {children}
            </Component>
        </NodeErrorBoundary>
    );
}

/**
 * Special handling for Repeater nodes
 */
function RenderRepeater({
    node,
    context,
    breakpoint,
}: {
    node: StorefrontNode;
    context: BindingContext;
    breakpoint: Breakpoint;
}) {
    // Repeater uses explicit dataPath property, not bindingMap usually, but we should respect resolvedProps
    // However, the standard is props.dataPath. 
    // We resolve bindings for the node first to get dynamic dataPath if needed?
    // Actually, resolveNodeBindings handles props.

    // For now, assume dataPath is in props or resolved via bindings
    const resolvedProps = resolveNodeBindings(node, context);
    const items = resolvedProps.items as unknown[];

    if (!Array.isArray(items)) {
        return null;
    }

    // Get the template child
    const template = node.children?.[0];
    if (!template) {
        return null;
    }

    return (
        <>
            {items.map((item, index) => {
                // Create scoped context for each item
                const scopedContext: BindingContext = {
                    ...context,
                    __scope: { item, index },
                };

                return (
                    <RenderNode
                        key={(item as { id?: string })?.id ?? index}
                        node={template}
                        context={scopedContext}
                        breakpoint={breakpoint}
                    />
                );
            })}
        </>
    );
}

/**
 * Special handling for Conditional nodes
 */
function RenderConditional({
    node,
    context,
    breakpoint,
}: {
    node: StorefrontNode;
    context: BindingContext;
    breakpoint: Breakpoint;
}) {
    const resolvedProps = resolveNodeBindings(node, context);
    const condition = resolvedProps.show;

    if (!condition) {
        return null;
    }

    return (
        <>
            {node.children?.map((child, index) => (
                <RenderNode key={child.id || index} node={child} context={context} breakpoint={breakpoint} />
            ))}
        </>
    );
}

/**
 * Helper to apply overrides and namespace IDs for a prefab instance
 */
function applyOverrides(
    node: StorefrontNode,
    overrides: PrefabOverrides,
    instanceId: string
): StorefrontNode | null {
    const override = overrides[node.id];

    // Check hidden override
    if (override?.hidden) {
        return null;
    }

    // Merge styles if override exists
    const mergedStyleOverrides = override?.styleOverrides
        ? mergeResponsiveOverrides(node.styleOverrides, override.styleOverrides)
        : node.styleOverrides;

    // Merge style tokens if override exists
    const mergedStyleTokens = override?.styleTokens
        ? { ...node.styleTokens, ...override.styleTokens } as StyleTokenMap
        : node.styleTokens;

    // Merge props if override exists (shallow merge)
    // Also inject metadata for the editor to track selection back to the prefab instance
    const mergedProps = {
        ...(override?.props || node.props),
        'data-prefab-instance-id': instanceId,
        'data-prefab-child-id': node.id,
    };

    // Merge bindings if override exists
    const mergedBindingMap = override?.bindingMap
        ? { ...node.bindingMap, ...override.bindingMap }
        : node.bindingMap;

    // Merge action map if override exists
    const mergedActionMap = override?.actionMap
        ? { ...node.actionMap, ...override.actionMap }
        : node.actionMap;

    // Namespace the ID to ensure uniqueness in the page
    const newId = `${instanceId}_${node.id}`;

    // Recursive map for children
    const newChildren = node.children
        ?.map((child) => applyOverrides(child, overrides, instanceId))
        .filter((child): child is StorefrontNode => child !== null);

    return {
        ...node,
        id: newId,
        props: mergedProps,
        styleOverrides: mergedStyleOverrides,
        styleTokens: mergedStyleTokens,
        bindingMap: mergedBindingMap,
        actionMap: mergedActionMap,
        children: newChildren,
    };
}

/**
 * Special handling for Prefab nodes
 */
function RenderPrefab({
    node,
    context,
    breakpoint,
}: {
    node: StorefrontNode;
    context: BindingContext;
    breakpoint: Breakpoint;
}) {
    const prefabKey = node.props.prefabKey as string;
    const prefabTree = context.prefabs?.[prefabKey];

    const overrides = (node.props.overrides as PrefabOverrides) || {};

    // Memoize the overridden tree to prevent re-computation on every render
    // unless the prefab definition or overrides change
    const resolvedTree = useMemo(() => {
        if (!prefabTree) return null;
        return applyOverrides(prefabTree, overrides, node.id);
    }, [prefabTree, overrides, node.id]);

    if (!resolvedTree) {
        // console.warn(`Prefab not found: ${prefabKey}`);
        return null;
    }

    return <RenderNode node={resolvedTree} context={context} breakpoint={breakpoint} />;
}

/**
 * Main renderer - entry point for rendering a document tree
 */
export function Renderer({ tree, scope }: RendererProps) {
    const { context } = useRuntimeContext();
    const breakpoint = useBreakpoint();

    // Build binding context with optional scope
    const bindingContext = useMemo<BindingContext>(
        () => (scope ? { ...context, __scope: scope } : context),
        [context, scope]
    );

    // Handle special node types
    if (tree.type === 'Repeater') {
        return <RenderRepeater node={tree} context={bindingContext} breakpoint={breakpoint} />;
    }

    if (tree.type === 'Conditional') {
        return <RenderConditional node={tree} context={bindingContext} breakpoint={breakpoint} />;
    }

    if (tree.type === 'Prefab') {
        return <RenderPrefab node={tree} context={bindingContext} breakpoint={breakpoint} />;
    }

    return <RenderNode node={tree} context={bindingContext} breakpoint={breakpoint} />;
}

/**
 * Renderer with layout composition
 * Wraps page content in layout(s)
 */
export function RendererWithLayout({
    layout,
    page,
    scope,
}: {
    layout?: StorefrontNode;
    page: StorefrontNode;
    scope?: RepeaterScope;
}) {
    const { context, dispatchPipeline } = useRuntimeContext();
    const breakpoint = useBreakpoint();
    const theme = useTheme();

    const bindingContext = useMemo<BindingContext>(
        () => (scope ? { ...context, __scope: scope } : context),
        [context, scope]
    );

    if (!layout) {
        return <RenderNode node={page} context={bindingContext} breakpoint={breakpoint} />;
    }

    // Find and replace the Slot in the layout with page content
    function renderWithSlot(node: StorefrontNode): React.ReactNode {
        if (node.type === 'Slot') {
            return <RenderNode key={node.id} node={page} context={bindingContext} breakpoint={breakpoint} />;
        }

        if (node.type === 'Prefab') {
            return <RenderPrefab key={node.id} node={node} context={bindingContext} breakpoint={breakpoint} />;
        }

        if (!isValidComponent(node.type)) {
            return (
                <div
                    key={node.id}
                    data-node-id={node.id}
                    style={{
                        border: '1px dashed var(--destructive, #ef4444)',
                        padding: '8px',
                        minHeight: '32px',
                        opacity: 0.6,
                        borderRadius: '4px',
                    }}
                >
                    <span style={{ fontSize: '12px', color: 'var(--muted-foreground, #888)' }}>
                        Unknown: {node.type}
                    </span>
                    {node.children?.map((child) => renderWithSlot(child))}
                </div>
            );
        }

        const Component = getComponent(node.type);
        if (!Component) {
            return null;
        }

        const resolvedProps = resolveNodeBindings(node, bindingContext);

        // Resolve styles (V2 property check inside tokens.ts)
        const resolvedStyles = theme?.theme
            ? resolveNodeStyles(node, theme.theme, breakpoint)
            : {};

        const actionHandlers: Record<string, (...args: any[]) => Promise<void>> = {};
        if (node.actionMap) {
            for (const [slot, pipeline] of Object.entries(node.actionMap)) {
                actionHandlers[slot] = async (...args: any[]) => {
                    const eventContext = {
                        ...bindingContext,
                        $event: args.length > 0 ? (args.length === 1 ? args[0] : args) : undefined
                    };
                    await dispatchPipeline(pipeline, eventContext);
                };
            }
        }

        return (
            <Component
                key={node.id}
                {...resolvedProps}
                style={resolvedStyles}
                {...actionHandlers}
                data-node-id={node.id}
            >
                {node.children?.map((child) => renderWithSlot(child))}
            </Component>
        );
    }

    return <>{renderWithSlot(layout)}</>;
}
