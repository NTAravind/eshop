'use client';

import React, { useState, useCallback } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Trash2,
    GripVertical,
    MoreVertical,
    AlertTriangle,
    Play
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { BindingExprNode } from './BindingExprNode';
import { actionRegistry } from '@/modules/storefront/actions/registry';
import { createPipeline, createSimplePipeline } from '@/modules/storefront/actions/pipeline';
import { findNodeById, generateNodeId } from '@/shared/utils/tree';
import type {
    ActionPipeline,
    ActionStep as PipelineStep,
    BindingExpr,
    ActionRef
} from '@/types/storefront-builder';

interface PipelineEditorProps {
    nodeId: string;
}

// Mock event list for MVP
const EVENTS = ['onClick', 'onMouseEnter', 'onMouseLeave', 'onSubmit', 'onChange'];

export function PipelineEditor({ nodeId }: PipelineEditorProps) {
    // Subscribe only to the specific properties we need
    const tree = useEditorStore((s) => s.tree);
    const nodeData = React.useMemo(() => {
        if (!tree) return null;
        const node = findNodeById(tree, nodeId);
        if (!node) return null;
        return {
            id: node.id,
            actionMap: node.actionMap
        };
    }, [tree, nodeId]);
    const updateNode = useEditorStore((s) => s.updateNode);

    const node = nodeData;

    // Local state for selected event (controlled tab/select)
    const [selectedEvent, setSelectedEvent] = useState<string>('onClick');

    if (!node) return <div className="p-4 text-sm text-muted-foreground">Select a node to edit actions.</div>;

    const pipeline = node.actionMap?.[selectedEvent] || createPipeline(generateNodeId(), []);

    const handleUpdatePipeline = useCallback((updates: Partial<ActionPipeline>) => {
        const newPipeline = { ...pipeline, ...updates };
        const newActionMap = { ...node?.actionMap, [selectedEvent]: newPipeline };
        updateNode(nodeId, { actionMap: newActionMap });
    }, [pipeline, node?.actionMap, selectedEvent, nodeId, updateNode]);

    const handleAddStep = useCallback(() => {
        const newStep: PipelineStep = {
            id: crypto.randomUUID(),
            actionId: 'navigate', // default
            payload: {},
        };
        handleUpdatePipeline({ steps: [...pipeline.steps, newStep] });
    }, [handleUpdatePipeline, pipeline.steps]);

    const handleRemoveStep = useCallback((stepId: string) => {
        handleUpdatePipeline({
            steps: pipeline.steps.filter(s => s.id !== stepId)
        });
    }, [handleUpdatePipeline, pipeline.steps]);

    const handleMoveStep = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = pipeline.steps.findIndex((s) => s.id === active.id);
            const newIndex = pipeline.steps.findIndex((s) => s.id === over?.id);
            handleUpdatePipeline({
                steps: arrayMove(pipeline.steps, oldIndex, newIndex),
            });
        }
    };

    const handleUpdateStep = useCallback((stepId: string, updates: Partial<PipelineStep>) => {
        handleUpdatePipeline({
            steps: pipeline.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
        });
    }, [handleUpdatePipeline, pipeline.steps]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header: Event Selector */}
            <div className="p-4 border-b bg-muted/40 space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Event Trigger</Label>
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue placeholder="Event" />
                        </SelectTrigger>
                        <SelectContent>
                            {EVENTS.map(evt => (
                                <SelectItem key={evt} value={evt} className="text-xs">
                                    {evt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Pipeline Settings */}
                <div className="border border-border/50 rounded p-2 bg-background">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Error Strategy</Label>
                        <Select
                            value={pipeline.onError || 'stop'}
                            onValueChange={(v: any) => handleUpdatePipeline({ onError: v })}
                        >
                            <SelectTrigger className="w-[100px] h-6 text-[10px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stop" className="text-xs">Stop (Default)</SelectItem>
                                <SelectItem value="continue" className="text-xs">Continue</SelectItem>
                                <SelectItem value="rollback" className="text-xs">Rollback</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Steps List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleMoveStep}
                >
                    <SortableContext
                        items={pipeline.steps.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {pipeline.steps.map((step, index) => (
                            <PipelineStepCard
                                key={step.id}
                                step={step}
                                index={index}
                                onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                                onRemove={() => handleRemoveStep(step.id)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed text-muted-foreground hover:bg-muted/50"
                    onClick={handleAddStep}
                >
                    <Plus className="w-3 h-3 mr-2" />
                    Add Action Step
                </Button>
            </div>
        </div>
    );
}

interface PipelineStepCardProps {
    step: PipelineStep;
    index: number;
    onUpdate: (updates: Partial<PipelineStep>) => void;
    onRemove: () => void;
}

function PipelineStepCard({ step, index, onUpdate, onRemove }: PipelineStepCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const definition = (actionRegistry as Record<string, any>)[step.actionId];

    // Toggle condition editor
    const [showCondition, setShowCondition] = React.useState(!!step.condition);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative rounded-lg border bg-card text-card-foreground shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20"
        >
            {/* Step Header */}
            <div className="flex items-center p-3 gap-2 border-b bg-muted/20">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-move text-muted-foreground hover:text-foreground touch-none"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                <span className="text-[10px] font-mono font-medium text-muted-foreground min-w-[1.5rem] bg-muted px-1 rounded text-center">
                    {index + 1}
                </span>

                <div className="flex-1 min-w-0">
                    <Select
                        value={step.actionId}
                        onValueChange={(id) => onUpdate({ actionId: id, payload: {} })}
                    >
                        <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-0 focus:ring-0 w-auto font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(actionRegistry).map((def: any) => (
                                <SelectItem key={def.displayName} value={Object.keys(actionRegistry).find(k => (actionRegistry as any)[k] === def) || ''} className="text-xs">
                                    <div className="flex flex-col gap-0.5">
                                        <span>{def.displayName}</span>
                                        <span className="text-[10px] text-muted-foreground">{def.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-1">
                    {!showCondition && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-indigo-600"
                            onClick={() => setShowCondition(true)}
                            title="Add Condition"
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={onRemove}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Condition Editor */}
            {showCondition && (
                <div className="px-3 py-2 bg-amber-50/50 border-b border-amber-100 flex items-start gap-2">
                    <span className="text-[10px] font-bold text-amber-600 mt-1.5 uppercase">If</span>
                    <div className="flex-1">
                        {step.condition ? (
                            <BindingExprNode
                                expr={step.condition}
                                onChange={(expr) => onUpdate({ condition: expr })}
                                onDelete={() => {
                                    onUpdate({ condition: undefined });
                                    setShowCondition(false);
                                }}
                            />
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-dashed w-full text-muted-foreground"
                                onClick={() => onUpdate({
                                    condition: { kind: 'path', root: 'uiState', segments: ['isEnabled'] }
                                })}
                            >
                                Add Condition Expression
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Payload Config */}
            <div className="p-3 space-y-3">
                {Object.entries(definition?.schema?.properties || {}).map(([key, schema]: [string, any]) => {
                    const currentBinding = step.payloadBindings?.[key];
                    const staticValue = step.payload?.[key];

                    return (
                        <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground">{schema.title || key}</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-5 px-1.5 text-[10px] ${currentBinding ? 'bg-indigo-50 text-indigo-600' : 'text-muted-foreground'}`}
                                    onClick={() => {
                                        if (currentBinding) {
                                            // Remove binding
                                            const newBindings = { ...step.payloadBindings };
                                            delete newBindings[key];
                                            onUpdate({ payloadBindings: newBindings });
                                        } else {
                                            // Add binding
                                            const newBindings = { ...step.payloadBindings };
                                            newBindings[key] = { kind: 'path', root: 'product', segments: ['title'] };
                                            onUpdate({ payloadBindings: newBindings });
                                        }
                                    }}
                                >
                                    {currentBinding ? 'Bound' : 'Bind'}
                                </Button>
                            </div>

                            {currentBinding ? (
                                <BindingExprNode
                                    expr={currentBinding}
                                    onChange={(expr) => {
                                        const newBindings = { ...step.payloadBindings };
                                        newBindings[key] = expr;
                                        onUpdate({ payloadBindings: newBindings });
                                    }}
                                />
                            ) : (
                                <Input
                                    className="h-7 text-xs"
                                    placeholder={String(schema.type || 'text')}
                                    value={String(staticValue ?? '')}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newPayload = { ...step.payload };
                                        newPayload[key] = e.target.value;
                                        onUpdate({ payload: newPayload });
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
