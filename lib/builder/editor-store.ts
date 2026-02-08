/**
 * Zustand store for the Storefront Builder editor
 * Manages editor state, selection, history (undo/redo), and document tree
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
    StorefrontNode,
    EditorMode,
    DeviceType,
    EditorSelection,
    HistoryEntry,
    ThemeVars,
} from '@/types/storefront-builder';
import { defaultTheme } from '@/lib/storefront/defaults/theme';

// ==================== EDITOR STATE ====================

interface EditorState {
    // Document
    documentId: string | null;
    documentKind: 'LAYOUT' | 'PAGE' | 'TEMPLATE' | 'PREFAB' | null;
    documentKey: string | null;
    tree: StorefrontNode | null;
    isDirty: boolean;
    theme: ThemeVars;

    // Editor mode
    mode: EditorMode;
    device: DeviceType;
    zoom: number;

    // Selection
    selection: EditorSelection;

    // History
    history: HistoryEntry[];
    historyIndex: number;
    maxHistorySize: number;

    // UI state
    leftPanelCollapsed: boolean;
    rightPanelCollapsed: boolean;
    activeLeftTab: 'components' | 'layers';
    activeRightTab: 'properties' | 'styles' | 'actions' | 'theme';

    // Clipboard
    clipboard: StorefrontNode | null;
}

interface EditorActions {
    // Document management
    loadDocument: (
        id: string,
        kind: EditorState['documentKind'],
        key: string,
        tree: StorefrontNode
    ) => void;
    clearDocument: () => void;
    setDirty: (dirty: boolean) => void;

    // Theme management
    setTheme: (theme: ThemeVars) => void;
    updateTheme: (updates: Partial<ThemeVars>) => void;

    // Tree operations
    updateTree: (tree: StorefrontNode, description?: string) => void;
    updateNode: (nodeId: string, updates: Partial<StorefrontNode>) => void;
    insertNode: (parentId: string, node: StorefrontNode, index?: number) => void;
    removeNode: (nodeId: string) => void;
    moveNode: (nodeId: string, targetParentId: string, index?: number) => void;

    // Selection
    select: (nodeId: string | null) => void;
    selectPath: (path: number[]) => void;

    // Mode controls
    setMode: (mode: EditorMode) => void;
    setDevice: (device: DeviceType) => void;
    setZoom: (zoom: number) => void;

    // History
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // UI controls
    toggleLeftPanel: () => void;
    toggleRightPanel: () => void;
    setActiveLeftTab: (tab: EditorState['activeLeftTab']) => void;
    setActiveRightTab: (tab: EditorState['activeRightTab']) => void;

    // Clipboard
    copy: () => void;
    cut: () => void;
    paste: () => void;
}

type EditorStore = EditorState & EditorActions;

// ==================== HELPER FUNCTIONS ====================

/**
 * Find a node by ID in the tree
 */
function findNodeById(
    node: StorefrontNode,
    id: string
): StorefrontNode | null {
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Find the path to a node by ID
 */
function findNodePath(
    node: StorefrontNode,
    id: string,
    path: number[] = []
): number[] | null {
    if (node.id === id) return path;
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            const found = findNodePath(node.children[i], id, [...path, i]);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Deep clone a node
 */
function cloneNode(node: StorefrontNode): StorefrontNode {
    return JSON.parse(JSON.stringify(node));
}

/**
 * Generate a unique ID
 */
function generateId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get node at path
 */
function getNodeAtPath(tree: StorefrontNode, path: number[]): StorefrontNode | null {
    let current: StorefrontNode = tree;
    for (const index of path) {
        if (!current.children || !current.children[index]) return null;
        current = current.children[index];
    }
    return current;
}

/**
 * Get parent of node by ID
 */
function findParentNode(
    node: StorefrontNode,
    targetId: string,
    parent: StorefrontNode | null = null
): StorefrontNode | null {
    if (node.id === targetId) return parent;
    if (node.children) {
        for (const child of node.children) {
            const found = findParentNode(child, targetId, node);
            if (found) return found;
        }
    }
    return null;
}

// ==================== STORE CREATION ====================

const initialState: EditorState = {
    documentId: null,
    documentKind: null,
    documentKey: null,
    tree: null,
    isDirty: false,
    theme: defaultTheme,
    mode: 'edit',
    device: 'desktop',
    zoom: 100,
    selection: { nodeId: null, path: [] },
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    activeLeftTab: 'components',
    activeRightTab: 'properties',
    clipboard: null,
};

export const useEditorStore = create<EditorStore>()(
    immer((set, get) => ({
        ...initialState,

        // Document management
        loadDocument: (id, kind, key, tree) => {
            set((state) => {
                state.documentId = id;
                state.documentKind = kind;
                state.documentKey = key;
                state.tree = tree;
                state.isDirty = false;
                state.selection = { nodeId: null, path: [] };
                state.history = [{ tree: cloneNode(tree), timestamp: Date.now() }];
                state.historyIndex = 0;
            });
        },

        clearDocument: () => {
            set((state) => {
                state.documentId = null;
                state.documentKind = null;
                state.documentKey = null;
                state.tree = null;
                state.isDirty = false;
                state.selection = { nodeId: null, path: [] };
                state.history = [];
                state.historyIndex = -1;
            });
        },

        setDirty: (dirty) => {
            set((state) => {
                state.isDirty = dirty;
            });
        },

        // Tree operations
        updateTree: (tree, description) => {
            set((state) => {
                state.tree = tree;
                state.isDirty = true;

                // Add to history
                const newEntry: HistoryEntry = {
                    tree: cloneNode(tree),
                    timestamp: Date.now(),
                    description,
                };

                // Trim future history if we're not at the end
                if (state.historyIndex < state.history.length - 1) {
                    state.history = state.history.slice(0, state.historyIndex + 1);
                }

                state.history.push(newEntry);

                // Trim old history if exceeds max size
                if (state.history.length > state.maxHistorySize) {
                    state.history = state.history.slice(-state.maxHistorySize);
                }

                state.historyIndex = state.history.length - 1;
                state.historyIndex = state.history.length - 1;
            });
        },

        // Theme operations
        setTheme: (theme) => {
            set((state) => {
                state.theme = theme;
                state.isDirty = true;
            });
        },

        updateTheme: (updates) => {
            set((state) => {
                Object.assign(state.theme, updates);
                state.isDirty = true;
            });
        },

        updateNode: (nodeId, updates) => {
            const { tree, updateTree } = get();
            if (!tree) return;

            const newTree = cloneNode(tree);
            const node = findNodeById(newTree, nodeId);
            if (node) {
                Object.assign(node, updates);
                updateTree(newTree, `Update ${node.type}`);
            }
        },

        insertNode: (parentId, node, index) => {
            const { tree, updateTree, select } = get();
            if (!tree) return;

            const newTree = cloneNode(tree);
            const parent = findNodeById(newTree, parentId);
            if (!parent) return;

            // Ensure children array exists
            if (!parent.children) parent.children = [];

            // Clone node and assign new ID
            const newNode = cloneNode(node);
            newNode.id = generateId();

            // Insert at index or end
            if (index !== undefined && index >= 0) {
                parent.children.splice(index, 0, newNode);
            } else {
                parent.children.push(newNode);
            }

            updateTree(newTree, `Insert ${newNode.type}`);
            select(newNode.id);
        },

        removeNode: (nodeId) => {
            const { tree, updateTree, selection, select } = get();
            if (!tree) return;

            // Can't remove root
            if (tree.id === nodeId) return;

            const newTree = cloneNode(tree);
            const parent = findParentNode(newTree, nodeId);
            if (!parent || !parent.children) return;

            const index = parent.children.findIndex((c) => c.id === nodeId);
            if (index === -1) return;

            parent.children.splice(index, 1);
            updateTree(newTree, 'Remove node');

            // Clear selection if removed node was selected
            if (selection.nodeId === nodeId) {
                select(null);
            }
        },

        moveNode: (nodeId, targetParentId, index) => {
            const { tree, updateTree, select } = get();
            if (!tree) return;

            // Can't move root
            if (tree.id === nodeId) return;

            const newTree = cloneNode(tree);

            // Find and remove from current parent
            const currentParent = findParentNode(newTree, nodeId);
            if (!currentParent || !currentParent.children) return;

            const currentIndex = currentParent.children.findIndex((c) => c.id === nodeId);
            if (currentIndex === -1) return;

            const [movedNode] = currentParent.children.splice(currentIndex, 1);

            // Insert into target parent
            const targetParent = findNodeById(newTree, targetParentId);
            if (!targetParent) return;

            if (!targetParent.children) targetParent.children = [];

            if (index !== undefined && index >= 0) {
                targetParent.children.splice(index, 0, movedNode);
            } else {
                targetParent.children.push(movedNode);
            }

            updateTree(newTree, 'Move node');
            select(nodeId);
        },

        // Selection
        select: (nodeId) => {
            set((state) => {
                if (nodeId === null) {
                    state.selection = { nodeId: null, path: [] };
                } else if (state.tree) {
                    const path = findNodePath(state.tree, nodeId);
                    state.selection = { nodeId, path: path || [] };
                }
            });
        },

        selectPath: (path) => {
            set((state) => {
                if (state.tree) {
                    const node = getNodeAtPath(state.tree, path);
                    state.selection = { nodeId: node?.id || null, path };
                }
            });
        },

        // Mode controls
        setMode: (mode) => {
            set((state) => {
                state.mode = mode;
            });
        },

        setDevice: (device) => {
            set((state) => {
                state.device = device;
            });
        },

        setZoom: (zoom) => {
            set((state) => {
                state.zoom = Math.max(25, Math.min(200, zoom));
            });
        },

        // History
        undo: () => {
            const { canUndo } = get();
            if (!canUndo()) return;

            set((state) => {
                state.historyIndex--;
                state.tree = cloneNode(state.history[state.historyIndex].tree);
                state.isDirty = true;
            });
        },

        redo: () => {
            const { canRedo } = get();
            if (!canRedo()) return;

            set((state) => {
                state.historyIndex++;
                state.tree = cloneNode(state.history[state.historyIndex].tree);
                state.isDirty = true;
            });
        },

        canUndo: () => {
            const { historyIndex } = get();
            return historyIndex > 0;
        },

        canRedo: () => {
            const { history, historyIndex } = get();
            return historyIndex < history.length - 1;
        },

        // UI controls
        toggleLeftPanel: () => {
            set((state) => {
                state.leftPanelCollapsed = !state.leftPanelCollapsed;
            });
        },

        toggleRightPanel: () => {
            set((state) => {
                state.rightPanelCollapsed = !state.rightPanelCollapsed;
            });
        },

        setActiveLeftTab: (tab) => {
            set((state) => {
                state.activeLeftTab = tab;
            });
        },

        setActiveRightTab: (tab) => {
            set((state) => {
                state.activeRightTab = tab;
            });
        },

        // Clipboard
        copy: () => {
            const { tree, selection } = get();
            if (!tree || !selection.nodeId) return;

            const node = findNodeById(tree, selection.nodeId);
            if (node) {
                set((state) => {
                    state.clipboard = cloneNode(node);
                });
            }
        },

        cut: () => {
            const { tree, selection, removeNode } = get();
            if (!tree || !selection.nodeId) return;

            // Can't cut root
            if (tree.id === selection.nodeId) return;

            const node = findNodeById(tree, selection.nodeId);
            if (node) {
                set((state) => {
                    state.clipboard = cloneNode(node);
                });
                removeNode(selection.nodeId);
            }
        },

        paste: () => {
            const { clipboard, tree, selection, insertNode } = get();
            if (!clipboard || !tree) return;

            const targetId = selection.nodeId || tree.id;
            insertNode(targetId, clipboard);
        },
    }))
);

// ==================== SELECTORS ====================

export const selectSelectedNode = (state: EditorStore) => {
    if (!state.tree || !state.selection.nodeId) return null;
    return findNodeById(state.tree, state.selection.nodeId);
};

export const selectCanUndo = (state: EditorStore) => state.historyIndex > 0;
export const selectCanRedo = (state: EditorStore) => state.historyIndex < state.history.length - 1;
