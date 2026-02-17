'use client';

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { cn } from '@/shared/utils';
import type { StorefrontNode } from '@/types/storefront-builder';

// Components that support inline text editing and their text prop name
export const EDITABLE_COMPONENTS: Record<string, string> = {
    Text: 'text',
    Heading: 'text',
    Button: 'text',
    Link: 'text',
    Badge: 'text',
};

interface InlineTextEditorProps {
    node: StorefrontNode;
    zoom: number;
    onClose: () => void;
}

export function InlineTextEditor({ node, zoom, onClose }: InlineTextEditorProps) {
    const updateNode = useEditorStore((s) => s.updateNode);
    const propName = EDITABLE_COMPONENTS[node.type] || 'text';
    const initialText = (node.props[propName] as string) || '';

    const [value, setValue] = useState(initialText);
    const [styles, setStyles] = useState<React.CSSProperties | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const originalElementRef = useRef<HTMLElement | null>(null);

    // Sync position and styles
    useLayoutEffect(() => {
        const element = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
        if (!element) {
            onClose();
            return;
        }
        originalElementRef.current = element;

        // Hide the original element visually but keep layout
        // actually, we just overlay on top. Hiding might cause layout shift if not careful.
        // Let's just overlay opaque background.

        const computed = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Find the canvas container (the scalable part) to calculate relative position
        const canvasContainer = element.closest('.isolate') as HTMLElement;
        const containerRect = canvasContainer?.getBoundingClientRect() || { top: 0, left: 0 };

        const scale = zoom / 100;

        // Calculate relative position accounting for scale
        const top = (rect.top - containerRect.top) / scale;
        const left = (rect.left - containerRect.left) / scale;
        const width = rect.width / scale;
        const height = rect.height / scale;

        setStyles({
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,

            // Text styles
            fontSize: computed.fontSize,
            fontFamily: computed.fontFamily,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            textAlign: computed.textAlign as any,
            color: computed.color,
            padding: computed.padding,

            // Box styles
            backgroundColor: computed.backgroundColor === 'rgba(0, 0, 0, 0)' || computed.backgroundColor === 'transparent'
                ? 'var(--background)' // default to background if transparent
                : computed.backgroundColor,

            // Input resets
            border: 'none',
            outline: '2px solid var(--primary)',
            resize: 'none',
            overflow: 'hidden',
            margin: 0,
            whiteSpace: computed.whiteSpace,
            boxSizing: 'border-box',
            zIndex: 1000,
        });

        // Focus and select all
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }

    }, [node.id, zoom, onClose]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
        e.stopPropagation(); // Prevent canvas shortcuts
    };

    const handleSave = () => {
        if (value !== initialText) {
            updateNode(node.id, {
                props: {
                    ...node.props,
                    [propName]: value,
                },
            });
        }
        onClose();
    };

    if (!styles) return null;

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            style={styles}
            className="shadow-lg rounded-sm"
        />
    );
}
