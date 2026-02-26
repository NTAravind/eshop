/**
 * Editor Command System — V2 Architecture
 *
 * Wraps tree mutations into declarative commands with automatic
 * inverse generation for undo/redo. Commands are pure functions
 * that operate on a StorefrontNode tree.
 */

import type {
    StorefrontNode,
    EditorCommand,
    CommandResult,
    StyleTokenMap,
    ResponsiveStyleOverrides,
    BindingExpr,
    ActionPipeline,
    PrefabOverrides,
} from '@/types/storefront-builder';
import {
    findNodeById,
    getParentNode,
    cloneNode,
    cloneNodeWithNewIds,
} from '@/shared/utils/tree';

// ==================== APPLY COMMAND ====================

/**
 * Apply a command to a tree, returning the new tree + inverse command.
 *
 * All operations are pure — the input tree is cloned, never mutated.
 */
export function applyCommand(
    tree: StorefrontNode,
    command: EditorCommand
): CommandResult {
    const newTree = cloneNode(tree);

    switch (command.type) {
        case 'INSERT_NODE':
            return applyInsert(newTree, command);

        case 'REMOVE_NODE':
            return applyRemove(newTree, command);

        case 'MOVE_NODE':
            return applyMove(newTree, command);

        case 'UPDATE_PROPS':
            return applyUpdateProps(newTree, command);

        case 'UPDATE_BINDINGS':
            return applyUpdateBindings(newTree, command);

        case 'UPDATE_STYLE_TOKENS':
            return applyUpdateStyleTokens(newTree, command);

        case 'UPDATE_STYLE_OVERRIDES':
            return applyUpdateStyleOverrides(newTree, command);

        case 'UPDATE_ACTIONS':
            return applyUpdateActions(newTree, command);

        case 'SET_HIDDEN':
            return applySetHidden(newTree, command);

        case 'UPDATE_PREFAB_OVERRIDE':
            return applyUpdatePrefabOverride(newTree, command);

        case 'DETACH_PREFAB':
            return applyDetachPrefab(newTree, command);

        case 'BATCH':
            return applyBatch(tree, command);

        default: {
            const _exhaustive: never = command;
            return {
                success: false,
                snapshot: tree,
                inverse: { type: 'BATCH', commands: [] },
                warnings: [`Unknown command type: ${(command as any).type}`],
            };
        }
    }
}

// ==================== COMMAND IMPLEMENTATIONS ====================

function applyInsert(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'INSERT_NODE' }>
): CommandResult {
    const parent = findNodeById(tree, cmd.parentId);
    if (!parent) {
        return failure(tree, `Parent node "${cmd.parentId}" not found`);
    }

    if (!parent.children) parent.children = [];

    const newNode = cloneNodeWithNewIds(cmd.node);
    const insertIdx = Math.min(cmd.index, parent.children.length);
    parent.children.splice(insertIdx, 0, newNode);

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'REMOVE_NODE', nodeId: newNode.id },
    };
}

function applyRemove(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'REMOVE_NODE' }>
): CommandResult {
    if (tree.id === cmd.nodeId) {
        return failure(tree, 'Cannot remove root node');
    }

    const parent = getParentNode(tree, cmd.nodeId);
    if (!parent || !parent.children) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const index = parent.children.findIndex((c) => c.id === cmd.nodeId);
    if (index === -1) {
        return failure(tree, `Node "${cmd.nodeId}" not found in parent`);
    }

    const [removed] = parent.children.splice(index, 1);

    return {
        success: true,
        snapshot: tree,
        inverse: {
            type: 'INSERT_NODE',
            parentId: parent.id,
            index,
            node: removed,
        },
    };
}

function applyMove(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'MOVE_NODE' }>
): CommandResult {
    if (tree.id === cmd.nodeId) {
        return failure(tree, 'Cannot move root node');
    }

    // Prevent moving into own subtree
    const movedNode = findNodeById(tree, cmd.nodeId);
    if (movedNode && findNodeById(movedNode, cmd.newParentId)) {
        return failure(tree, 'Cannot move node into its own subtree');
    }

    const oldParent = getParentNode(tree, cmd.nodeId);
    if (!oldParent || !oldParent.children) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const oldIndex = oldParent.children.findIndex((c) => c.id === cmd.nodeId);
    if (oldIndex === -1) {
        return failure(tree, `Node "${cmd.nodeId}" not found in parent`);
    }

    const [node] = oldParent.children.splice(oldIndex, 1);

    const newParent = findNodeById(tree, cmd.newParentId);
    if (!newParent) {
        // Restore — move failed
        oldParent.children.splice(oldIndex, 0, node);
        return failure(tree, `Target parent "${cmd.newParentId}" not found`);
    }

    if (!newParent.children) newParent.children = [];
    const insertIdx = Math.min(cmd.newIndex, newParent.children.length);
    newParent.children.splice(insertIdx, 0, node);

    return {
        success: true,
        snapshot: tree,
        inverse: {
            type: 'MOVE_NODE',
            nodeId: cmd.nodeId,
            newParentId: oldParent.id,
            newIndex: oldIndex,
        },
    };
}

function applyUpdateProps(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'UPDATE_PROPS' }>
): CommandResult {
    const node = findNodeById(tree, cmd.nodeId);
    if (!node) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    // Save old props for inverse
    const oldProps: Partial<Record<string, unknown>> = {};
    for (const key of Object.keys(cmd.props)) {
        oldProps[key] = node.props[key];
    }

    Object.assign(node.props, cmd.props);

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'UPDATE_PROPS', nodeId: cmd.nodeId, props: oldProps },
    };
}

function applyUpdateBindings(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'UPDATE_BINDINGS' }>
): CommandResult {
    const node = findNodeById(tree, cmd.nodeId);
    if (!node) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const oldBindingMap = node.bindingMap ? { ...node.bindingMap } : {};
    node.bindingMap = cmd.bindingMap;

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'UPDATE_BINDINGS', nodeId: cmd.nodeId, bindingMap: oldBindingMap },
    };
}

function applyUpdateStyleTokens(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'UPDATE_STYLE_TOKENS' }>
): CommandResult {
    const node = findNodeById(tree, cmd.nodeId);
    if (!node) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const oldTokens: StyleTokenMap = node.styleTokens ? { ...node.styleTokens } : {};
    node.styleTokens = cmd.tokens;

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'UPDATE_STYLE_TOKENS', nodeId: cmd.nodeId, tokens: oldTokens },
    };
}

function applyUpdateStyleOverrides(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'UPDATE_STYLE_OVERRIDES' }>
): CommandResult {
    const node = findNodeById(tree, cmd.nodeId);
    if (!node) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const oldOverrides = node.styleOverrides ? { ...node.styleOverrides } : {} as ResponsiveStyleOverrides;
    node.styleOverrides = cmd.overrides;

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'UPDATE_STYLE_OVERRIDES', nodeId: cmd.nodeId, overrides: oldOverrides },
    };
}

function applyUpdateActions(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'UPDATE_ACTIONS' }>
): CommandResult {
    const node = findNodeById(tree, cmd.nodeId);
    if (!node) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const oldActionMap = node.actionMap ? { ...node.actionMap } : {};
    node.actionMap = cmd.actionMap;

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'UPDATE_ACTIONS', nodeId: cmd.nodeId, actionMap: oldActionMap },
    };
}

function applySetHidden(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'SET_HIDDEN' }>
): CommandResult {
    const node = findNodeById(tree, cmd.nodeId);
    if (!node) {
        return failure(tree, `Node "${cmd.nodeId}" not found`);
    }

    const oldHidden = node.hidden ?? false;
    node.hidden = cmd.hidden;

    return {
        success: true,
        snapshot: tree,
        inverse: { type: 'SET_HIDDEN', nodeId: cmd.nodeId, hidden: oldHidden },
    };
}

function applyUpdatePrefabOverride(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'UPDATE_PREFAB_OVERRIDE' }>
): CommandResult {
    const instanceNode = findNodeById(tree, cmd.instanceNodeId);
    if (!instanceNode) {
        return failure(tree, `Prefab instance "${cmd.instanceNodeId}" not found`);
    }

    if (instanceNode.type !== 'Prefab') {
        return failure(tree, `Node "${cmd.instanceNodeId}" is not a Prefab instance`);
    }

    // Get or initialize overrides
    const overrides = (instanceNode.props.overrides as PrefabOverrides) || {};
    const oldOverride = overrides[cmd.childId] ? { ...overrides[cmd.childId] } : {};

    // Merge the new override into the existing one
    overrides[cmd.childId] = {
        ...overrides[cmd.childId],
        ...cmd.override,
    };

    instanceNode.props.overrides = overrides;

    return {
        success: true,
        snapshot: tree,
        inverse: {
            type: 'UPDATE_PREFAB_OVERRIDE',
            instanceNodeId: cmd.instanceNodeId,
            childId: cmd.childId,
            override: oldOverride,
        },
    };
}

function applyDetachPrefab(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'DETACH_PREFAB' }>
): CommandResult {
    const parent = getParentNode(tree, cmd.instanceNodeId);
    if (!parent || !parent.children) {
        return failure(tree, `Prefab instance "${cmd.instanceNodeId}" not found`);
    }

    const index = parent.children.findIndex((c) => c.id === cmd.instanceNodeId);
    if (index === -1) {
        return failure(tree, `Prefab instance "${cmd.instanceNodeId}" not in parent`);
    }

    const instanceNode = parent.children[index];
    if (instanceNode.type !== 'Prefab') {
        return failure(tree, `Node "${cmd.instanceNodeId}" is not a Prefab instance`);
    }

    // Save the original Prefab node for inverse (re-insert)
    const originalNode = cloneNode(instanceNode);

    // Create a Container node to hold the detached children
    // The prefab's children would be resolved at render time; for detach we
    // convert the instance into a simple Container with the same ID
    const detachedContainer: StorefrontNode = {
        id: instanceNode.id,
        type: 'Container',
        props: {},
        styleOverrides: instanceNode.styleOverrides,
        styleTokens: instanceNode.styleTokens,
        children: instanceNode.children?.map(cloneNodeWithNewIds) ?? [],
    };

    // Replace the Prefab node with the detached Container
    parent.children[index] = detachedContainer;

    return {
        success: true,
        snapshot: tree,
        inverse: {
            type: 'BATCH',
            commands: [
                { type: 'REMOVE_NODE', nodeId: detachedContainer.id },
                { type: 'INSERT_NODE', parentId: parent.id, index, node: originalNode },
            ],
        },
    };
}

function applyBatch(
    tree: StorefrontNode,
    cmd: Extract<EditorCommand, { type: 'BATCH' }>
): CommandResult {
    let currentTree = tree;
    const inverses: EditorCommand[] = [];
    const warnings: string[] = [];

    for (const subCmd of cmd.commands) {
        const result = applyCommand(currentTree, subCmd);
        if (!result.success) {
            return {
                success: false,
                snapshot: tree, // Return original on failure
                inverse: { type: 'BATCH', commands: inverses.reverse() },
                warnings: [...warnings, ...(result.warnings ?? [])],
            };
        }
        currentTree = result.snapshot;
        inverses.push(result.inverse);
        if (result.warnings) warnings.push(...result.warnings);
    }

    return {
        success: true,
        snapshot: currentTree,
        inverse: { type: 'BATCH', commands: inverses.reverse() },
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

// ==================== HELPERS ====================

function failure(tree: StorefrontNode, error: string): CommandResult {
    return {
        success: false,
        snapshot: tree,
        inverse: { type: 'BATCH', commands: [] },
        warnings: [error],
    };
}

// ==================== GENERATE INVERSE ====================

/**
 * Generate an inverse command for a command, given the current tree state.
 * This is a convenience wrapper — applyCommand already returns inverses.
 */
export function generateInverse(
    tree: StorefrontNode,
    command: EditorCommand
): EditorCommand {
    const result = applyCommand(cloneNode(tree), command);
    return result.inverse;
}
