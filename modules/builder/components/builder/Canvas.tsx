'use client';

/**
 * Canvas for the Storefront Builder
 * Renders the document tree with selection overlay
 */

import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/builder/editor-store';
import type { StorefrontNode, DeviceType } from '@/types/storefront-builder';

interface CanvasProps {
    children?: React.ReactNode;
}

// Device width presets
const deviceWidths: Record<DeviceType, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
};

export function Canvas({ children }: CanvasProps) {
    const device = useEditorStore((s) => s.device);
    const zoom = useEditorStore((s) => s.zoom);
    const mode = useEditorStore((s) => s.mode);
    const theme = useEditorStore((s) => s.theme);
    const select = useEditorStore((s) => s.select);

    // Generate CSS variables from theme
    const themeStyles = React.useMemo(() => {
        const styles: Record<string, string> = {};
        Object.entries(theme).forEach(([key, value]) => {
            if (value) {
                styles[`--${key}`] = value;
            }
        });
        return styles as React.CSSProperties;
    }, [theme]);

    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-root',
        data: {
            type: 'canvas',
        },
    });

    const containerWidth = deviceWidths[device];
    const scale = zoom / 100;

    const handleCanvasClick = (e: React.MouseEvent) => {
        // Find the closest node element
        const target = e.target as HTMLElement;
        const nodeElement = target.closest('[data-node-id]');

        if (nodeElement) {
            e.stopPropagation();
            const nodeId = nodeElement.getAttribute('data-node-id');
            select(nodeId);
        } else {
            select(null);
        }
    };

    return (
        <div className="flex-1 bg-muted/50 overflow-auto relative">
            <SelectionOverlay />
            <div className="flex items-start justify-center p-8 min-h-full">
                <div
                    ref={setNodeRef}
                    onClick={handleCanvasClick}
                    className={cn(
                        'bg-background shadow-lg transition-all duration-200',
                        isOver && 'ring-2 ring-primary'
                    )}
                    style={{
                        width: containerWidth,
                        minHeight: '100vh',
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center',
                        ...themeStyles,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * Selection overlay for the canvas
 */
export function SelectionOverlay() {
    const [rect, setRect] = React.useState<DOMRect | null>(null);
    const selection = useEditorStore((s) => s.selection);

    useEffect(() => {
        if (!selection.nodeId) {
            setRect(null);
            return;
        }

        const updateRect = () => {
            const element = document.querySelector(`[data-node-id="${selection.nodeId}"]`);
            if (element) {
                setRect(element.getBoundingClientRect());
            } else {
                setRect(null);
            }
        };

        // Initial update
        updateRect();

        // Update on resize/scroll
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [selection.nodeId]);

    if (!rect || !selection.nodeId) return null;

    return (
        <div
            className="fixed pointer-events-none z-50 border-2 border-primary rounded-sm"
            style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            }}
        >
            {/* Label */}
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-t-sm">
                {selection.nodeId}
            </div>

            {/* Resize handles */}
            <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-sm cursor-se-resize" />
        </div>
    );
}
