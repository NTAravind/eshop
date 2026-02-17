'use client';

/**
 * ActionsPanel component for the Inspector
 * Allows users to configure component actions with registry-driven UI
 */

import React, { useState, useCallback } from 'react';
import type { StorefrontNode, ActionRef, ActionID } from '@/types/storefront-builder';
import { useEditorStore } from '@/modules/builder/editor-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { actionRegistry, getActionsForUI } from '@/modules/storefront/actions/registry';

interface ActionsPanelProps {
    node: StorefrontNode;
}

export function ActionsPanel({ node }: ActionsPanelProps) {
    const updateNode = useEditorStore((s) => s.updateNode);
    const actions = node.actions || {};
    const [selectedEvent, setSelectedEvent] = useState<string>('');

    // Available event types for this component
    const availableEvents = ['onClick', 'onSubmit', 'onChange', 'onFocus', 'onBlur'];

    const handleAddAction = useCallback(() => {
        if (!selectedEvent) return;

        const newAction: ActionRef = {
            actionId: 'NAVIGATE',
            payload: { to: '/' },
        };

        updateNode(node.id, {
            actions: {
                ...actions,
                [selectedEvent]: newAction,
            },
        });
        setSelectedEvent('');
    }, [selectedEvent, updateNode, node.id, actions]);

    const handleRemoveAction = useCallback((event: string) => {
        const newActions = { ...actions };
        delete newActions[event];
        updateNode(node.id, { actions: newActions });
    }, [actions, updateNode, node.id]);

    const handleUpdateAction = useCallback((event: string, updates: Partial<ActionRef>) => {
        const currentAction = actions[event];
        if (!currentAction) return;

        updateNode(node.id, {
            actions: {
                ...actions,
                [event]: {
                    ...currentAction,
                    ...updates,
                },
            },
        });
    }, [actions, updateNode, node.id]);

    const handleUpdatePayload = useCallback((event: string, key: string, value: unknown) => {
        const currentAction = actions[event];
        if (!currentAction) return;

        updateNode(node.id, {
            actions: {
                ...actions,
                [event]: {
                    ...currentAction,
                    payload: {
                        ...currentAction.payload,
                        [key]: value,
                    },
                },
            },
        });
    }, [actions, updateNode, node.id]);

    const handleUpdatePayloadBinding = useCallback((event: string, key: string, path: string | undefined) => {
        const currentAction = actions[event];
        if (!currentAction) return;

        const newPayloadBindings = { ...(currentAction.payloadBindings || {}) };
        if (path) {
            newPayloadBindings[key] = path;
        } else {
            delete newPayloadBindings[key];
        }

        updateNode(node.id, {
            actions: {
                ...actions,
                [event]: {
                    ...currentAction,
                    payloadBindings: Object.keys(newPayloadBindings).length > 0 ? newPayloadBindings : undefined,
                },
            },
        });
    }, [actions, updateNode, node.id]);

    const availableActions = getActionsForUI();
    const usedEvents = Object.keys(actions);
    const unusedEvents = availableEvents.filter(e => !usedEvents.includes(e));

    return (
        <div className="space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
            </div>

            {/* Existing Actions */}
            {Object.keys(actions).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No actions configured for this element.
                </p>
            ) : (
                <div className="space-y-3">
                    {Object.entries(actions).map(([event, action]) => (
                        <ActionEditor
                            key={event}
                            event={event}
                            action={action}
                            availableActions={availableActions}
                            onUpdate={(updates) => handleUpdateAction(event, updates)}
                            onUpdatePayload={(key, value) => handleUpdatePayload(event, key, value)}
                            onUpdatePayloadBinding={(key, path) => handleUpdatePayloadBinding(event, key, path)}
                            onRemove={() => handleRemoveAction(event)}
                        />
                    ))}
                </div>
            )}

            {/* Add New Action */}
            {unusedEvents.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                    <Label className="text-xs">Add Action</Label>
                    <div className="flex gap-2">
                        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select event..." />
                            </SelectTrigger>
                            <SelectContent>
                                {unusedEvents.map((event) => (
                                    <SelectItem key={event} value={event}>
                                        {event}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            onClick={handleAddAction}
                            disabled={!selectedEvent}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ActionEditorProps {
    event: string;
    action: ActionRef;
    availableActions: Array<{ id: string; displayName: string; description: string }>;
    onUpdate: (updates: Partial<ActionRef>) => void;
    onUpdatePayload: (key: string, value: unknown) => void;
    onUpdatePayloadBinding: (key: string, path: string | undefined) => void;
    onRemove: () => void;
}

function ActionEditor({
    event,
    action,
    availableActions,
    onUpdate,
    onUpdatePayload,
    onUpdatePayloadBinding,
    onRemove,
}: ActionEditorProps) {
    const actionDef = actionRegistry[action.actionId as keyof typeof actionRegistry];
    const payloadShape = actionDef?.payloadSchema.shape;
    const bindablePayload = actionDef?.bindablePayload || [];

    return (
        <div className="p-3 bg-muted rounded-md space-y-3">
            {/* Event and Action Type */}
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <Label className="text-xs font-medium">{event}</Label>
                    <Select
                        value={action.actionId}
                        onValueChange={(value) => onUpdate({ actionId: value as ActionID })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableActions.map((act) => (
                                <SelectItem key={act.id} value={act.id}>
                                    {act.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="ml-2"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Payload Fields */}
            {actionDef && payloadShape && (
                <div className="space-y-2 pl-2 border-l-2 border-border">
                    <Label className="text-xs text-muted-foreground">Payload</Label>
                    {Object.entries(payloadShape).map(([key, schema]) => {
                        const currentValue = action.payload?.[key];
                        const currentBinding = action.payloadBindings?.[key];
                        const isBindable = bindablePayload.includes(key as never);
                        const isBound = !!currentBinding;
                        const schemaType = (schema as { _def?: { typeName?: string } })?._def?.typeName;

                        return (
                            <div key={key} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs capitalize flex items-center gap-1.5">
                                        {key}
                                        {isBound && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </Label>
                                    {isBindable && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-2 text-[10px]"
                                            onClick={() => {
                                                if (isBound) {
                                                    onUpdatePayloadBinding(key, undefined);
                                                } else {
                                                    onUpdatePayloadBinding(key, 'product.id');
                                                }
                                            }}
                                        >
                                            {isBound ? 'Unbind' : 'Bind'}
                                        </Button>
                                    )}
                                </div>
                                {isBound ? (
                                    <Input
                                        type="text"
                                        value={currentBinding}
                                        onChange={(e) => onUpdatePayloadBinding(key, e.target.value)}
                                        className="h-8 text-xs font-mono border-blue-200 bg-blue-50/50"
                                        placeholder="e.g. product.selectedVariant.id"
                                    />
                                ) : (
                                    renderPayloadInput(
                                        key,
                                        schemaType,
                                        currentValue,
                                        (value) => onUpdatePayload(key, value)
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function renderPayloadInput(
    key: string,
    schemaType: string | undefined,
    value: unknown,
    onChange: (value: unknown) => void
) {
    switch (schemaType) {
        case 'ZodBoolean':
            return (
                <Switch
                    checked={Boolean(value)}
                    onCheckedChange={onChange}
                />
            );
        case 'ZodNumber':
            return (
                <Input
                    type="number"
                    value={Number(value) || 0}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="h-8 text-xs"
                />
            );
        case 'ZodString':
        default:
            return (
                <Input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 text-xs"
                    placeholder={key === 'to' ? '/collection' : ''}
                />
            );
    }
}
