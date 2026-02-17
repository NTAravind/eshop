/**
 * Consolidated tree utility functions for StorefrontNode trees.
 *
 * These are the single-source-of-truth implementations used by both
 * the editor store and the validation / service layers.
 */

import type { StorefrontNode } from '@/types/storefront-builder';

// ==================== ID Generation ====================

/**
 * Generate a unique node ID.
 */
export function generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== Lookups ====================

/**
 * Find a node by ID in the tree (depth-first).
 */
export function findNodeById(
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
 * Find a node by component type (depth-first).
 */
export function findNodeByType(
    node: StorefrontNode,
    type: string
): StorefrontNode | null {
    if (node.type === type) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeByType(child, type);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Get the index-path from root to a node.
 * Returns null if the node is not found.
 */
export function getNodePath(
    node: StorefrontNode,
    id: string,
    path: number[] = []
): number[] | null {
    if (node.id === id) return path;
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            const found = getNodePath(node.children[i], id, [...path, i]);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Get the node at a given index-path.
 */
export function getNodeAtPath(
    tree: StorefrontNode,
    path: number[]
): StorefrontNode | null {
    let current: StorefrontNode = tree;
    for (const index of path) {
        if (!current.children || !current.children[index]) return null;
        current = current.children[index];
    }
    return current;
}

/**
 * Get the parent of a node by ID.
 * Returns null for the root node or if the node is not found.
 */
export function getParentNode(
    tree: StorefrontNode,
    id: string
): StorefrontNode | null {
    if (!tree.children) return null;
    for (const child of tree.children) {
        if (child.id === id) return tree;
        const found = getParentNode(child, id);
        if (found) return found;
    }
    return null;
}

// ==================== Cloning ====================

/**
 * Deep clone a node tree. Structure only — no ID regeneration.
 */
export function cloneNode(node: StorefrontNode): StorefrontNode {
    return JSON.parse(JSON.stringify(node));
}

/**
 * Deep clone a node and regenerate IDs for the root **and all descendants**.
 * Use this when pasting or duplicating nodes to avoid duplicate-key errors.
 */
export function cloneNodeWithNewIds(node: StorefrontNode): StorefrontNode {
    const cloned: StorefrontNode = {
        ...node,
        id: generateNodeId(),
        props: node.props ? { ...node.props } : {},
    };

    if (node.styles) {
        cloned.styles = JSON.parse(JSON.stringify(node.styles));
    }
    if (node.bindings) {
        cloned.bindings = { ...node.bindings };
    }
    if (node.actions) {
        cloned.actions = JSON.parse(JSON.stringify(node.actions));
    }
    if (node.children) {
        cloned.children = node.children.map(cloneNodeWithNewIds);
    }

    return cloned;
}

// ==================== Immutable Tree Updates ====================

/**
 * Immutably update a single node identified by ID.
 */
export function updateNodeImmutable(
    tree: StorefrontNode,
    id: string,
    updater: (node: StorefrontNode) => StorefrontNode
): StorefrontNode {
    if (tree.id === id) return updater(tree);
    if (!tree.children) return tree;
    return {
        ...tree,
        children: tree.children.map((child) =>
            updateNodeImmutable(child, id, updater)
        ),
    };
}

/**
 * Immutably delete a node by ID.
 * Throws if you attempt to delete the root.
 */
export function deleteNodeImmutable(
    tree: StorefrontNode,
    id: string
): StorefrontNode {
    if (tree.id === id) throw new Error('Cannot delete root node');
    if (!tree.children) return tree;
    return {
        ...tree,
        children: tree.children
            .filter((child) => child.id !== id)
            .map((child) => deleteNodeImmutable(child, id)),
    };
}

/**
 * Immutably insert a node as a child of the given parent.
 */
export function insertNodeImmutable(
    tree: StorefrontNode,
    parentId: string,
    node: StorefrontNode,
    index?: number
): StorefrontNode {
    return updateNodeImmutable(tree, parentId, (parent) => {
        const children = parent.children ? [...parent.children] : [];
        const insertIndex = index !== undefined ? index : children.length;
        children.splice(insertIndex, 0, node);
        return { ...parent, children };
    });
}

/**
 * Immutably move a node to a new parent (and optional index).
 */
export function moveNodeImmutable(
    tree: StorefrontNode,
    nodeId: string,
    newParentId: string,
    index?: number
): StorefrontNode {
    const nodeToMove = findNodeById(tree, nodeId);
    if (!nodeToMove) throw new Error(`Node ${nodeId} not found`);
    let newTree = deleteNodeImmutable(tree, nodeId);
    newTree = insertNodeImmutable(newTree, newParentId, nodeToMove, index);
    return newTree;
}
