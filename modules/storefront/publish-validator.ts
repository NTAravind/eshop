/**
 * Publish Validator — V2 Architecture
 *
 * Validates a storefront document tree before publishing.
 * Checks for structural integrity, binding safety, action validity,
 * and completeness.
 */

import type {
    StorefrontNode,
    BindingExpr,
    ActionPipeline,
    StyleTokenMap,
    DesignTokenMap,
    RouteManifest,
    PublishSnapshot,
} from '@/types/storefront-builder';
import { validateBindingExpr } from './binding-ast';
import { validateTokenMap } from './tokens';

// ==================== TYPES ====================

export interface ValidationResult {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    stats: DocumentStats;
}

export interface ValidationIssue {
    level: 'error' | 'warning';
    code: string;
    message: string;
    nodeId?: string;
    path?: string;
}

export interface DocumentStats {
    nodeCount: number;
    maxDepth: number;
    bindingCount: number;
    actionCount: number;
    tokenRefCount: number;
}

// ==================== LIMITS ====================

const LIMITS = {
    MAX_DEPTH: 20,
    MAX_NODE_COUNT: 2000,
    MAX_CHILDREN_PER_NODE: 100,
    MAX_REPEATER_LIMIT: 50,
    MAX_BINDING_DEPTH: 5,
};

// ==================== VALIDATE DOCUMENT ====================

/**
 * Validate an entire document tree for publish readiness.
 */
export function validateDocument(
    tree: StorefrontNode,
    theme?: DesignTokenMap
): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const stats: DocumentStats = {
        nodeCount: 0,
        maxDepth: 0,
        bindingCount: 0,
        actionCount: 0,
        tokenRefCount: 0,
    };

    validateNode(tree, 0, errors, warnings, stats, theme);

    // Global checks
    if (stats.nodeCount > LIMITS.MAX_NODE_COUNT) {
        errors.push({
            level: 'error',
            code: 'DOC_TOO_LARGE',
            message: `Document has ${stats.nodeCount} nodes (limit: ${LIMITS.MAX_NODE_COUNT})`,
        });
    }

    if (stats.maxDepth > LIMITS.MAX_DEPTH) {
        warnings.push({
            level: 'warning',
            code: 'DOC_TOO_DEEP',
            message: `Document nesting depth is ${stats.maxDepth} (recommended: ≤${LIMITS.MAX_DEPTH})`,
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats,
    };
}

// ==================== NODE VALIDATION ====================

function validateNode(
    node: StorefrontNode,
    depth: number,
    errors: ValidationIssue[],
    warnings: ValidationIssue[],
    stats: DocumentStats,
    theme?: DesignTokenMap
): void {
    stats.nodeCount++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    // Node ID check
    if (!node.id || typeof node.id !== 'string') {
        errors.push({
            level: 'error',
            code: 'MISSING_NODE_ID',
            message: 'Node is missing an id',
        });
    }

    // Node type check
    if (!node.type || typeof node.type !== 'string') {
        errors.push({
            level: 'error',
            code: 'MISSING_NODE_TYPE',
            message: `Node "${node.id}" is missing a type`,
            nodeId: node.id,
        });
    }

    // V2 binding validation
    if (node.bindingMap) {
        for (const [key, expr] of Object.entries(node.bindingMap)) {
            stats.bindingCount++;
            const result = validateBindingExpr(expr);
            if (!result.valid) {
                errors.push({
                    level: 'error',
                    code: 'INVALID_BINDING',
                    message: `Invalid binding "${key}" on node "${node.id}": ${result.error}`,
                    nodeId: node.id,
                });
            }
        }
    }

    // V1 binding validation (count only)
    // V1 binding validation (count only) - REMOVED

    // V2 style token validation
    if (node.styleTokens && theme) {
        const tokenResult = validateTokenMap(node.styleTokens, theme);
        stats.tokenRefCount += Object.keys(node.styleTokens).length;
        if (!tokenResult.valid) {
            for (const err of tokenResult.errors) {
                warnings.push({
                    level: 'warning',
                    code: 'INVALID_TOKEN_REF',
                    message: `Token issue on node "${node.id}": ${err}`,
                    nodeId: node.id,
                });
            }
        }
    }

    // V2 action pipeline validation
    if (node.actionMap) {
        for (const [event, pipeline] of Object.entries(node.actionMap)) {
            stats.actionCount++;
            validatePipeline(pipeline, node.id, event, errors, warnings);
        }
    }

    // V1 action validation (count only)
    // V1 action validation (count only) - REMOVED

    // Repeater checks
    if (node.type === 'Repeater') {
        const limit = (node.props?.limit as number) || 0;
        if (limit > LIMITS.MAX_REPEATER_LIMIT) {
            warnings.push({
                level: 'warning',
                code: 'REPEATER_LIMIT_HIGH',
                message: `Repeater "${node.id}" has limit ${limit} (recommended: ≤${LIMITS.MAX_REPEATER_LIMIT})`,
                nodeId: node.id,
            });
        }
    }

    // Children checks
    if (node.children) {
        if (node.children.length > LIMITS.MAX_CHILDREN_PER_NODE) {
            warnings.push({
                level: 'warning',
                code: 'TOO_MANY_CHILDREN',
                message: `Node "${node.id}" has ${node.children.length} children (limit: ${LIMITS.MAX_CHILDREN_PER_NODE})`,
                nodeId: node.id,
            });
        }

        // Check for duplicate IDs
        const childIds = new Set<string>();
        for (const child of node.children) {
            if (childIds.has(child.id)) {
                errors.push({
                    level: 'error',
                    code: 'DUPLICATE_NODE_ID',
                    message: `Duplicate node ID "${child.id}" found under "${node.id}"`,
                    nodeId: node.id,
                });
            }
            childIds.add(child.id);
            validateNode(child, depth + 1, errors, warnings, stats, theme);
        }
    }
}

// ==================== PIPELINE VALIDATION ====================

function validatePipeline(
    pipeline: ActionPipeline,
    nodeId: string,
    event: string,
    errors: ValidationIssue[],
    warnings: ValidationIssue[]
): void {
    if (!pipeline.id) {
        errors.push({
            level: 'error',
            code: 'PIPELINE_MISSING_ID',
            message: `Action pipeline for "${event}" on node "${nodeId}" is missing an id`,
            nodeId,
        });
    }

    if (!pipeline.steps || pipeline.steps.length === 0) {
        warnings.push({
            level: 'warning',
            code: 'PIPELINE_EMPTY',
            message: `Action pipeline "${event}" on node "${nodeId}" has no steps`,
            nodeId,
        });
    }

    for (const step of pipeline.steps) {
        if (!step.actionId) {
            errors.push({
                level: 'error',
                code: 'STEP_MISSING_ACTION',
                message: `Pipeline step in "${event}" on node "${nodeId}" is missing actionId`,
                nodeId,
            });
        }

        // Validate step conditions
        if (step.condition) {
            const result = validateBindingExpr(step.condition);
            if (!result.valid) {
                errors.push({
                    level: 'error',
                    code: 'INVALID_STEP_CONDITION',
                    message: `Invalid condition in pipeline "${event}" step "${step.actionId}": ${result.error}`,
                    nodeId,
                });
            }
        }

        // Validate step payload bindings
        if (step.payloadBindings) {
            for (const [key, expr] of Object.entries(step.payloadBindings)) {
                const result = validateBindingExpr(expr);
                if (!result.valid) {
                    errors.push({
                        level: 'error',
                        code: 'INVALID_STEP_BINDING',
                        message: `Invalid payload binding "${key}" in pipeline step "${step.actionId}": ${result.error}`,
                        nodeId,
                    });
                }
            }
        }
    }
}

// ==================== ROUTE VALIDATION ====================

/**
 * Validate a RouteManifest for completeness.
 */
export function validateRouteManifest(
    manifest: RouteManifest,
    availableDocumentKeys: Set<string>
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const route of manifest.routes) {
        const docKey = route.kind === 'template'
            ? undefined // Template routes resolve dynamically
            : route.pageKey;

        if (docKey && !availableDocumentKeys.has(docKey)) {
            errors.push(`Route "${route.kind === 'static' ? route.path : route.pattern}" references missing document "${docKey}"`);
        }
    }

    return { valid: errors.length === 0, errors };
}
