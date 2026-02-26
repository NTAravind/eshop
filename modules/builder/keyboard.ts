import { useEditorStore } from '@/modules/builder/editor-store';
import {
    findNodeById,
    getParentNode,
    cloneNode,
    cloneNodeWithNewIds,
    generateNodeId
} from '@/shared/utils/tree';
import type { StorefrontNode } from '@/types/storefront-builder';

export interface KeyboardShortcutOptions {
    onSave?: () => void; // Ctrl+S
}

export function handleKeyboardShortcut(
    e: KeyboardEvent,
    options: KeyboardShortcutOptions = {}
) {
    // Don't intercept when user is typing in an input/textarea
    // But allow if modifier key is pressed (e.g. Ctrl+S in text input)
    // Actually, usually we don't want D/G/J in inputs even with mod?
    // Standard apps allow Ctrl+S/C/V/Z in inputs.
    // But Ctrl+D (Duplicate) in input is usually Delete selection? Or Bookmark?
    // Let's respect the existing check: return if input.
    const target = e.target as HTMLElement;
    if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
    ) {
        // Allow Ctrl+S even in inputs
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            options.onSave?.();
        }
        return;
    }

    const isMod = e.metaKey || e.ctrlKey;
    const store = useEditorStore.getState();

    // Ctrl+S — Save
    if (isMod && e.key === 's') {
        e.preventDefault();
        options.onSave?.();
        return;
    }

    // Ctrl+Z — Undo
    if (isMod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        store.undo();
        return;
    }

    // Ctrl+Y or Ctrl+Shift+Z — Redo
    if ((isMod && e.key === 'y') || (isMod && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
        e.preventDefault();
        store.redo();
        return;
    }

    // Ctrl+C — Copy
    if (isMod && e.key === 'c') {
        e.preventDefault();
        store.copy();
        return;
    }

    // Ctrl+X — Cut
    if (isMod && e.key === 'x') {
        e.preventDefault();
        store.cut();
        return;
    }

    // Ctrl+V — Paste
    if (isMod && e.key === 'v') {
        e.preventDefault();
        store.paste();
        return;
    }

    // Ctrl+D — Duplicate
    if (isMod && e.key === 'd') {
        e.preventDefault();
        duplicateNode(store);
        return;
    }

    // Ctrl+G — Group
    if (isMod && e.key === 'g') {
        e.preventDefault();
        groupNodes(store);
        return;
    }

    // Ctrl+J — Toggle Bottom Panel
    if (isMod && e.key === 'j') {
        e.preventDefault();
        store.toggleBottomPanel();
        return;
    }

    // Delete or Backspace — Remove selected node
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const { selection } = store;
        if (selection.nodeId) {
            store.removeNode(selection.nodeId);
        }
        return;
    }

    // Escape — Deselect
    if (e.key === 'Escape') {
        e.preventDefault();
        store.select(null);
        return;
    }

    // Arrow Up / Arrow Down — Navigate siblings
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSibling(store, e.key === 'ArrowUp' ? -1 : 1);
        return;
    }

    // Arrow Left — Select parent
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToParent(store);
        return;
    }

    // Arrow Right — Select first child
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToFirstChild(store);
        return;
    }
}

function duplicateNode(store: ReturnType<typeof useEditorStore.getState>) {
    const { tree, selection, insertNode, select } = store;
    if (!tree || !selection.nodeId) return;
    if (tree.id === selection.nodeId) return; // Can't duplicate root

    const node = findNodeById(tree, selection.nodeId);
    if (!node) return;

    const parent = getParentNode(tree, selection.nodeId);
    if (!parent || !parent.children) return;

    const newNode = cloneNodeWithNewIds(node);
    const index = parent.children.findIndex(c => c.id === selection.nodeId);

    if (index !== -1) {
        insertNode(parent.id, newNode, index + 1);
        // We select via setTimeout to ensure the node exists in the tree update?
        // insertNode is synchronous in store (uses immer), so it should be immediate.
        select(newNode.id);
    }
}

function groupNodes(store: ReturnType<typeof useEditorStore.getState>) {
    const { tree, selection, insertNode, removeNode, select } = store;
    if (!tree || !selection.nodeId) return;
    if (tree.id === selection.nodeId) return; // Can't group root

    const node = findNodeById(tree, selection.nodeId);
    if (!node) return;

    const parent = getParentNode(tree, selection.nodeId);
    if (!parent || !parent.children) return;

    const index = parent.children.findIndex(c => c.id === selection.nodeId);
    if (index === -1) return;

    // Create container
    const containerId = generateNodeId();
    const container: StorefrontNode = {
        id: containerId,
        type: 'box', // Default container
        props: {},
        styleOverrides: {
            base: {
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem'
            }
        },
        children: [cloneNode(node)] // Use clone to preserve structure but we'll remove original
    };

    // Remove original node first
    removeNode(selection.nodeId);

    // Insert container at original position
    insertNode(parent.id, container, index);

    // Select container
    select(containerId);
}

function navigateSibling(
    store: ReturnType<typeof useEditorStore.getState>,
    direction: 1 | -1
) {
    const { tree, selection } = store;
    if (!tree || !selection.nodeId) return;

    const parent = getParentNode(tree, selection.nodeId);
    if (!parent || !parent.children) return;

    const currentIndex = parent.children.findIndex((c) => c.id === selection.nodeId);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < parent.children.length) {
        store.select(parent.children[nextIndex].id);
    }
}

function navigateToParent(
    store: ReturnType<typeof useEditorStore.getState>
) {
    const { tree, selection } = store;
    if (!tree || !selection.nodeId) return;

    const parent = getParentNode(tree, selection.nodeId);
    if (parent) {
        store.select(parent.id);
    }
}

function navigateToFirstChild(
    store: ReturnType<typeof useEditorStore.getState>
) {
    const { tree, selection } = store;
    if (!tree || !selection.nodeId) return;

    const node = findNodeById(tree, selection.nodeId);
    if (node?.children && node.children.length > 0) {
        store.select(node.children[0].id);
    }
}
