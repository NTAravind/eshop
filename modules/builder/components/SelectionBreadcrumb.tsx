'use client';

/**
 * SelectionBreadcrumb — shows the full path from root to the selected node.
 * Clicking any ancestor selects it.
 */

import React, { useMemo } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { findNodeById, getParentNode } from '@/shared/utils/tree';
import type { StorefrontNode } from '@/types/storefront-builder';

function getAncestorChain(tree: StorefrontNode, nodeId: string): StorefrontNode[] {
    const chain: StorefrontNode[] = [];
    let currentId: string | null = nodeId;

    while (currentId) {
        const node = findNodeById(tree, currentId);
        if (!node) break;
        chain.unshift(node);
        const parent = getParentNode(tree, currentId);
        currentId = parent?.id ?? null;
    }
    return chain;
}

export function SelectionBreadcrumb() {
    const tree = useEditorStore((s) => s.tree);
    const selectedId = useEditorStore((s) => s.selection.nodeId);
    const select = useEditorStore((s) => s.select);

    const chain = useMemo(() => {
        if (!tree || !selectedId) return [];
        return getAncestorChain(tree, selectedId);
    }, [tree, selectedId]);

    if (chain.length === 0) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 12,
                color: '#666',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#fafafa',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                minHeight: 28,
            }}
        >
            {chain.map((node, i) => {
                const isLast = i === chain.length - 1;
                return (
                    <React.Fragment key={node.id}>
                        <button
                            onClick={() => select(node.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                borderRadius: 3,
                                fontSize: 12,
                                color: isLast ? '#2563eb' : '#666',
                                fontWeight: isLast ? 600 : 400,
                            }}
                            title={`Select ${node.type} (${node.id})`}
                        >
                            {node.type}
                        </button>
                        {!isLast && (
                            <span style={{ color: '#ccc', userSelect: 'none' }}>›</span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
