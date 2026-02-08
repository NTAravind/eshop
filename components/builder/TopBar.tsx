'use client';

/**
 * Top bar for the Storefront Builder
 * Contains document name, device switcher, preview toggle, undo/redo, save, publish
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Undo2,
    Redo2,
    Save,
    Upload,
    Monitor,
    Tablet,
    Smartphone,
    Eye,
    Pencil,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { useEditorStore, selectCanUndo, selectCanRedo } from '@/lib/builder/editor-store';
import { cn } from '@/lib/utils';
import type { DeviceType, EditorMode } from '@/types/storefront-builder';

interface TopBarProps {
    documentName?: string;
    onSave?: () => Promise<void>;
    onPublish?: () => Promise<void>;
    onGenerate?: () => Promise<void>;
    isSaving?: boolean;
    isPublishing?: boolean;
    isGenerating?: boolean;
}

export function TopBar({
    documentName = 'Untitled',
    onSave,
    onPublish,
    onGenerate,
    isSaving = false,
    isPublishing = false,
    isGenerating = false,
}: TopBarProps) {
    const mode = useEditorStore((s) => s.mode);
    const device = useEditorStore((s) => s.device);
    const isDirty = useEditorStore((s) => s.isDirty);
    const canUndo = useEditorStore(selectCanUndo);
    const canRedo = useEditorStore(selectCanRedo);
    const { setMode, setDevice, undo, redo } = useEditorStore();

    const devices: { id: DeviceType; icon: React.ElementType; label: string }[] = [
        { id: 'desktop', icon: Monitor, label: 'Desktop' },
        { id: 'tablet', icon: Tablet, label: 'Tablet' },
        { id: 'mobile', icon: Smartphone, label: 'Mobile' },
    ];

    const modes: { id: EditorMode; icon: React.ElementType; label: string }[] = [
        { id: 'edit', icon: Pencil, label: 'Edit' },
        { id: 'preview', icon: Eye, label: 'Preview' },
    ];

    return (
        <div className="h-12 border-b bg-background flex items-center justify-between px-4 gap-4">
            {/* Left: Document name */}
            <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate max-w-[200px]">
                    {documentName}
                </span>
                {isDirty && (
                    <span className="text-xs text-muted-foreground">•</span>
                )}
            </div>

            {/* Center: Device and Mode controls */}
            <div className="flex items-center gap-2">
                {/* Device switcher */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                    {devices.map(({ id, icon: Icon, label }) => (
                        <Button
                            key={id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'h-7 w-7 p-0',
                                device === id && 'bg-background shadow-sm'
                            )}
                            onClick={() => setDevice(id)}
                            title={label}
                        >
                            <Icon className="h-4 w-4" />
                        </Button>
                    ))}
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Mode switcher */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                    {modes.map(({ id, icon: Icon, label }) => (
                        <Button
                            key={id}
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'h-7 px-2 gap-1',
                                mode === id && 'bg-background shadow-sm'
                            )}
                            onClick={() => setMode(id)}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="text-xs">{label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Undo/Redo */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo"
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo"
                    >
                        <Redo2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Save */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onSave}
                    disabled={!isDirty || isSaving}
                    className="gap-1"
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save
                </Button>

                {/* Publish */}
                <Button
                    size="sm"
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="gap-1"
                >
                    {isPublishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4" />
                    )}
                    Publish
                </Button>

                {/* Generate Storefront */}
                <Button
                    size="sm"
                    variant="default"
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="gap-1 bg-indigo-600 hover:bg-indigo-700"
                    title="Update Live Storefront"
                >
                    {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    Generate
                </Button>
            </div>
        </div>
    );
}
