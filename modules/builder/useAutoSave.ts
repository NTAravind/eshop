'use client';

/**
 * Auto-save hook and beforeunload guard for the Storefront Builder.
 *
 * Usage in EditorLayout:
 *   useAutoSave({ onSave: handleSave, intervalMs: 3000 });
 */

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';

interface UseAutoSaveOptions {
    /** Function to call when saving */
    onSave: () => Promise<void> | void;
    /** Debounce interval in ms (default 3000) */
    intervalMs?: number;
    /** Whether auto-save is enabled (default true) */
    enabled?: boolean;
}

export function useAutoSave({
    onSave,
    intervalMs = 3000,
    enabled = true,
}: UseAutoSaveOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    const isDirty = useEditorStore((s) => s.isDirty);
    const documentId = useEditorStore((s) => s.documentId);

    const save = useCallback(async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        try {
            await onSave();
        } catch (err) {
            console.error('[AutoSave] Failed:', err);
        } finally {
            isSavingRef.current = false;
        }
    }, [onSave]);

    // Debounced auto-save when dirty changes
    useEffect(() => {
        if (!enabled || !isDirty || !documentId) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            save();
        }, intervalMs);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isDirty, documentId, intervalMs, enabled, save]);

    // beforeunload guard
    useEffect(() => {
        function handleBeforeUnload(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                // Modern browsers show a generic message
                return '';
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);
}
