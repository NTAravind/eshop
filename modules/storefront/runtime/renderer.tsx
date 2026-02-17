'use client';

/**
 * Runtime renderer for storefront documents
 * Renders StorefrontNode trees with bindings and actions resolved
 */

import React, { useMemo, useEffect, useState } from 'react';
import type { StorefrontNode, BindingContext, RepeaterScope, PrefabOverrides } from '@/types/storefront-builder';
import { useRuntimeContext } from './context';
import { resolveBindings } from '../bindings';
import { resolveStyles, getCurrentBreakpoint, mergeStyles } from '../styles';
import { useDynamicStyles } from './style-injector';
import { getComponent, isValidComponent } from '../registry';

type Breakpoint = ReturnType<typeof getCurrentBreakpoint>;

function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
        typeof window !== 'undefined' ? getCurrentBreakpoint(window.innerWidth) : 'base'
    );

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
 * Render a single node with resolved bindings and styles
 */
function RenderNode({ node, context, breakpoint }: { node: StorefrontNode; context: BindingContext; breakpoint: Breakpoint }) {
    const { createHandler } = useRuntimeContext();

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

    // Skip unknown components
    if (!isValidComponent(node.type)) {
        console.warn(`Unknown component type: ${node.type}`);
        return null;
    }

    // Get the component from registry
    const Component = getComponent(node.type);
    if (!Component) {
        return null;
    }

    // Resolve bindings
    const resolvedProps = resolveBindings(node.props, node.bindings, context);

    // Resolve styles (using base breakpoint for SSR, client updates later)
    const resolvedStyles = resolveStyles(node.styles, breakpoint);

    // Create action handlers
    const actionHandlers: Record<string, () => Promise<void>> = {};
    if (node.actions) {
        for (const [slot, action] of Object.entries(node.actions)) {
            actionHandlers[slot] = createHandler(action, context);
        }
    }

    // Inject dynamic styles (hover, focus, active)
    const dynamicClassName = useDynamicStyles(node.id, node.styles);

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
    const items = resolveBindings({ items: '' }, { items: node.props.dataPath as string }, context)
        .items as unknown[];

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
    const condition = resolveBindings(
        { show: node.props.show },
        node.bindings,
        context
    ).show;

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
 * Special handling for Prefab nodes
 */
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
    const mergedStyles = override?.styles
        ? mergeStyles(node.styles, override.styles)
        : node.styles;

    // Merge props if override exists (shallow merge)
    // Also inject metadata for the editor to track selection back to the prefab instance
    const mergedProps = {
        ...(override?.props || node.props),
        'data-prefab-instance-id': instanceId,
        'data-prefab-child-id': node.id,
    };

    // Merge bindings if override exists
    const mergedBindings = override?.bindings
        ? { ...node.bindings, ...override.bindings }
        : node.bindings;

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
        styles: mergedStyles,
        bindings: mergedBindings,
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
    const { context, createHandler } = useRuntimeContext();
    const breakpoint = useBreakpoint();

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
            return null;
        }

        const Component = getComponent(node.type);
        if (!Component) {
            return null;
        }

        const resolvedProps = resolveBindings(node.props, node.bindings, bindingContext);
        const resolvedStyles = resolveStyles(node.styles, breakpoint);

        const actionHandlers: Record<string, () => Promise<void>> = {};
        if (node.actions) {
            for (const [slot, action] of Object.entries(node.actions)) {
                actionHandlers[slot] = createHandler(action, bindingContext);
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
