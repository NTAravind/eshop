'use client';

/**
 * Runtime renderer for storefront documents
 * Renders StorefrontNode trees with bindings and actions resolved
 */

import React, { useMemo } from 'react';
import type { StorefrontNode, BindingContext, RepeaterScope } from '@/types/storefront-builder';
import { useRuntimeContext } from './context';
import { resolveBindings } from '../bindings';
import { resolveStyles, getCurrentBreakpoint } from '../styles';
import { getComponent, isValidComponent } from '../registry';

export interface RendererProps {
    tree: StorefrontNode;
    scope?: RepeaterScope;
}

/**
 * Render a single node with resolved bindings and styles
 */
function RenderNode({ node, context }: { node: StorefrontNode; context: BindingContext }) {
    const { createHandler } = useRuntimeContext();

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
    const resolvedStyles = resolveStyles(node.styles, 'base');

    // Create action handlers
    const actionHandlers: Record<string, () => Promise<void>> = {};
    if (node.actions) {
        for (const [slot, action] of Object.entries(node.actions)) {
            actionHandlers[slot] = createHandler(action, context);
        }
    }

    // Render children
    const children = node.children?.map((child, index) => (
        <RenderNode key={child.id || index} node={child} context={context} />
    ));

    // Render the component
    return (
        <Component
            {...resolvedProps}
            style={resolvedStyles}
            {...actionHandlers}
            data-node-id={node.id}
        >
            {children}
        </Component>
    );
}

/**
 * Special handling for Repeater nodes
 */
function RenderRepeater({
    node,
    context,
}: {
    node: StorefrontNode;
    context: BindingContext;
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
}: {
    node: StorefrontNode;
    context: BindingContext;
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
                <RenderNode key={child.id || index} node={child} context={context} />
            ))}
        </>
    );
}

/**
 * Main renderer - entry point for rendering a document tree
 */
export function Renderer({ tree, scope }: RendererProps) {
    const { context } = useRuntimeContext();

    // Build binding context with optional scope
    const bindingContext = useMemo<BindingContext>(
        () => (scope ? { ...context, __scope: scope } : context),
        [context, scope]
    );

    // Handle special node types
    if (tree.type === 'Repeater') {
        return <RenderRepeater node={tree} context={bindingContext} />;
    }

    if (tree.type === 'Conditional') {
        return <RenderConditional node={tree} context={bindingContext} />;
    }

    return <RenderNode node={tree} context={bindingContext} />;
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
    const { context } = useRuntimeContext();

    const bindingContext = useMemo<BindingContext>(
        () => (scope ? { ...context, __scope: scope } : context),
        [context, scope]
    );

    if (!layout) {
        return <RenderNode node={page} context={bindingContext} />;
    }

    // Find and replace the Slot in the layout with page content
    function renderWithSlot(node: StorefrontNode): React.ReactNode {
        if (node.type === 'Slot') {
            return <RenderNode node={page} context={bindingContext} />;
        }

        if (!isValidComponent(node.type)) {
            return null;
        }

        const Component = getComponent(node.type);
        if (!Component) {
            return null;
        }

        const resolvedProps = resolveBindings(node.props, node.bindings, bindingContext);
        const resolvedStyles = resolveStyles(node.styles, 'base');

        const actionHandlers: Record<string, () => Promise<void>> = {};
        if (node.actions) {
            const { createHandler } = useRuntimeContext();
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
