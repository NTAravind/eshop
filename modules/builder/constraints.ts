/**
 * Constraint checking for the storefront builder.
 *
 * Uses ComponentConstraints from the registry to validate whether
 * a node can be inserted or moved to a given parent.
 */

import { getComponentDefinition } from '@/modules/storefront/registry';

export interface ConstraintResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Check whether a child of the given type can be inserted into a parent of the given type.
 *
 * Rules (evaluated in order):
 * 1. Parent must allow children (`canHaveChildren`)
 * 2. If parent has `allowedChildren`, child type must be in the list
 * 3. If parent has `maxChildren`, current child count must be below the limit
 * 4. A node cannot be inserted inside itself (ancestry check done at call site)
 */
export function canInsert(
    parentType: string,
    childType: string,
    currentChildCount: number = 0
): ConstraintResult {
    const parentDef = getComponentDefinition(parentType);

    // If no definition exists (e.g., unknown types), allow by default to be non-breaking
    if (!parentDef) {
        return { allowed: true };
    }

    const { constraints } = parentDef;

    // Rule 1: Parent must accept children
    if (!constraints.canHaveChildren) {
        return {
            allowed: false,
            reason: `${parentDef.displayName} cannot have children`,
        };
    }

    // Rule 2: Allowed children whitelist
    if (constraints.allowedChildren && constraints.allowedChildren.length > 0) {
        if (!constraints.allowedChildren.includes(childType)) {
            return {
                allowed: false,
                reason: `${childType} is not allowed inside ${parentDef.displayName}`,
            };
        }
    }

    // Rule 3: Max children
    if (constraints.maxChildren !== undefined && currentChildCount >= constraints.maxChildren) {
        return {
            allowed: false,
            reason: `${parentDef.displayName} already has the maximum number of children (${constraints.maxChildren})`,
        };
    }

    return { allowed: true };
}

/**
 * Convenience: check if a node can be moved to a new parent.
 * Prevents moving a node inside itself by checking the ancestry.
 */
export function canMove(
    nodeId: string,
    nodeType: string,
    targetParentId: string,
    targetParentType: string,
    currentChildCount: number,
    isDescendant: (ancestorId: string, descendantId: string) => boolean
): ConstraintResult {
    // Can't move into itself
    if (nodeId === targetParentId) {
        return { allowed: false, reason: 'Cannot move a node inside itself' };
    }

    // Can't move into own descendant
    if (isDescendant(nodeId, targetParentId)) {
        return { allowed: false, reason: 'Cannot move a node inside its own descendant' };
    }

    return canInsert(targetParentType, nodeType, currentChildCount);
}
