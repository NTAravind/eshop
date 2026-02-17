'use client';

import React, { useCallback } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BindingExprNode } from './BindingExprNode';
import { Plus } from 'lucide-react';
import type { BindingExpr } from '@/types/storefront-builder';

interface BindingEditorProps {
    nodeId: string;
}

export function BindingEditor({ nodeId }: BindingEditorProps) {
    // Subscribe only to the specific properties we need
    const tree = useEditorStore((s) => s.tree);
    const nodeData = React.useMemo(() => {
        if (!tree) return null;
        const node = require('@/shared/utils/tree').findNodeById(tree, nodeId);
        if (!node) return null;
        return {
            id: node.id,
            bindingMap: node.bindingMap,
            props: node.props
        };
    }, [tree, nodeId]);
    const updateNode = useEditorStore((s) => s.updateNode);

    const node = nodeData;

    if (!node) return <div className="p-4 text-sm text-muted-foreground">Select a node to edit bindings.</div>;

    // Helper to update a binding expression
    const handleBindingChange = useCallback((propName: string, expr: BindingExpr | undefined) => {
        const newBindingMap = { ...node?.bindingMap };
        if (expr) {
            newBindingMap[propName] = expr;
        } else {
            delete newBindingMap[propName];
        }
        updateNode(nodeId, { bindingMap: newBindingMap });
    }, [node?.bindingMap, nodeId, updateNode]);

    // Helper to get contract/schema fields
    // In a real V2 app, this would come from the component registry contract.
    // For MVP, we'll infer from current props + some defaults.
    const bindableProps = React.useMemo(() => {
        const props = Object.keys(node?.props || {});
        // Add common data props if not present
        if (!props.includes('items')) props.push('items');
        if (!props.includes('label')) props.push('label');
        if (!props.includes('src')) props.push('src');
        if (!props.includes('href')) props.push('href');
        if (!props.includes('text')) props.push('text');
        if (!props.includes('value')) props.push('value');
        return props;
    }, [node?.props]);

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">Data Bindings</h3>
                <p className="text-xs text-muted-foreground">
                    Connect component properties to dynamic data.
                </p>
            </div>

            <div className="space-y-4">
                {bindableProps.map((prop) => {
                    const currentBinding = node.bindingMap?.[prop];

                    return (
                        <div key={prop} className="space-y-2 rounded-lg border p-3 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium font-mono">{prop}</Label>
                                {!currentBinding && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => handleBindingChange(prop, {
                                            kind: 'path',
                                            root: 'product',
                                            segments: ['title']
                                        })}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Bind
                                    </Button>
                                )}
                            </div>

                            {currentBinding && (
                                <BindingExprNode
                                    expr={currentBinding}
                                    onChange={(newExpr) => handleBindingChange(prop, newExpr)}
                                    onDelete={() => handleBindingChange(prop, undefined)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
