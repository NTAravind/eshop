import React from 'react';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';
import { useRuntimeContext } from '../runtime/context';
import { Renderer } from '../runtime/renderer';
import type { StorefrontNode } from '@/types/storefront-builder';

// ==================== PrefabInstance ====================

interface PrefabInstanceProps extends BaseComponentProps {
    prefabKey?: string;
    // Optional overrides could be passed here, but for now we just render the tree
}

function PrefabInstance({
    prefabKey,
    style,
    className,
    ...rest
}: PrefabInstanceProps) {
    const { context } = useRuntimeContext();

    // 1. Look up the prefab tree from context
    const prefabTree = context.prefabs?.[prefabKey || ''];

    if (!prefabKey) {
        return <div style={{ padding: '0.5rem', border: '1px dashed #ccc', color: '#666', ...style }} className={className}>[Select Prefab]</div>;
    }

    if (!prefabTree) {
        return (
            <div style={{ padding: '0.5rem', border: '1px dashed red', color: 'red', ...style }} className={className}>
                [Prefab not found: "{prefabKey}"]
            </div>
        );
    }

    // 2. Render the tree using Renderer
    // We wrap it in a div to apply styles/classes to the instance itself if needed
    // However, usually the prefab root has its own styles.
    // Ideally, we merge styles? Or just render the tree?
    // Let's render the tree directly. But we need to handle the props passed to this instance.
    // If the prefab root is a Container, we might want to merge style/className.
    // For simplicity, we just render the tree.

    // NOTE: In a robust implementation, we might want to pass slot content or override props.
    // For now, it's a direct reference rendering.

    return (
        <div style={{ display: 'contents', ...style }} className={className} {...rest}>
            <Renderer tree={prefabTree} />
        </div>
    );
}

// Register utilities
export function registerUtilityComponents() {
    registerComponent('PrefabInstance', PrefabInstance as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'PrefabInstance',
        displayName: 'Prefab Instance',
        category: 'utility',
        icon: 'Copy',
        propsSchema: {},
        controls: {
            prefabKey: { type: 'text', label: 'Prefab Key' }, // Should ideally be a select
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styleOverrides: {},
        },
    });
}
