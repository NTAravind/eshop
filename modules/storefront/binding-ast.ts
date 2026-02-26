/**
 * Binding AST System — V2 Architecture
 *
 * Provides a recursive evaluator for the BindingExpr AST,
 * a transform registry for named pure functions,
 * and migration utilities to convert legacy string bindings to AST.
 */

import type {
    BindingExpr,
    BindingPath,
    BindingRoot,
    BindingContext,
    RuntimeContext,
    StorefrontNode,
} from '@/types/storefront-builder';

// ==================== TRANSFORM REGISTRY ====================

type TransformFn = (input: unknown, params?: Record<string, unknown>) => unknown;

const transformRegistry = new Map<string, TransformFn>();

/**
 * Register a named transform function.
 */
export function registerTransform(id: string, fn: TransformFn): void {
    transformRegistry.set(id, fn);
}

/**
 * Get a registered transform by ID.
 */
export function getTransform(id: string): TransformFn | undefined {
    return transformRegistry.get(id);
}

// Built-in transforms
registerTransform('uppercase', (input) =>
    typeof input === 'string' ? input.toUpperCase() : input
);

registerTransform('lowercase', (input) =>
    typeof input === 'string' ? input.toLowerCase() : input
);

registerTransform('formatCurrency', (input, params) => {
    if (typeof input !== 'number') return input;
    const currency = (params?.currency as string) || 'USD';
    const locale = (params?.locale as string) || 'en-US';
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(input);
    } catch {
        return `${currency} ${input.toFixed(2)}`;
    }
});

registerTransform('pluralize', (input, params) => {
    if (typeof input !== 'number') return input;
    const singular = (params?.singular as string) || '';
    const plural = (params?.plural as string) || `${singular}s`;
    return input === 1 ? `${input} ${singular}` : `${input} ${plural}`;
});

registerTransform('truncate', (input, params) => {
    if (typeof input !== 'string') return input;
    const maxLength = (params?.maxLength as number) || 100;
    const suffix = (params?.suffix as string) || '…';
    return input.length > maxLength ? input.slice(0, maxLength) + suffix : input;
});

registerTransform('not', (input) => !input);

registerTransform('length', (input) => {
    if (Array.isArray(input)) return input.length;
    if (typeof input === 'string') return input.length;
    return 0;
});

registerTransform('gt', (input, params) => {
    if (typeof input !== 'number' || typeof params?.value !== 'number') return false;
    return input > params.value;
});

registerTransform('eq', (input, params) => input === params?.value);

registerTransform('default', (input, params) =>
    input !== undefined && input !== null ? input : params?.value
);

// ==================== AST RESOLVER ====================

/**
 * Walk an object by a list of segments (property keys or array indices).
 * Returns undefined if any segment fails to resolve.
 */
function walkObject(obj: unknown, segments: (string | number)[]): unknown {
    let current: unknown = obj;
    for (const seg of segments) {
        if (current === null || current === undefined) return undefined;
        if (typeof current === 'object') {
            current = (current as Record<string | number, unknown>)[seg];
        } else {
            return undefined;
        }
    }
    return current;
}

/**
 * Resolve a path binding expression against a context.
 */
function resolvePath(
    root: BindingRoot,
    segments: (string | number)[],
    ctx: BindingContext
): unknown {
    // Repeater/Custom scope (check explicit item/index first)
    if (root === 'item') {
        return walkObject(ctx.__scope?.item, segments);
    }
    if (root === 'index') {
        return segments.length === 0 ? ctx.__scope?.index : undefined;
    }

    // Check if the root exists in the local scope override
    if (ctx.__scope && root in ctx.__scope) {
        const scopedValue = (ctx.__scope as unknown as Record<string, unknown>)[root];
        return segments.length === 0 ? scopedValue : walkObject(scopedValue, segments);
    }

    // Standard global context roots
    const rootValue = (ctx as unknown as Record<string, unknown>)[root];
    return segments.length === 0 ? rootValue : walkObject(rootValue, segments);
}

/**
 * Recursively resolve a BindingExpr against a BindingContext.
 *
 * Supports all 5 expression kinds:
 * - path: direct context path lookup
 * - literal: static value
 * - conditional: if/then/else
 * - transform: apply a named function
 * - fallback: try primary, use fallback if null/undefined
 */
export function resolveBindingExpr(expr: BindingExpr, context: BindingContext): unknown {
    switch (expr.kind) {
        case 'path':
            return resolvePath(expr.root, expr.segments, context);

        case 'literal':
            return expr.value;

        case 'conditional': {
            const test = resolveBindingExpr(expr.test, context);
            return test
                ? resolveBindingExpr(expr.consequent, context)
                : resolveBindingExpr(expr.alternate, context);
        }

        case 'transform': {
            const input = resolveBindingExpr(expr.input, context);
            const transform = transformRegistry.get(expr.transformId);
            if (!transform) {
                console.warn(`[BindingAST] Unknown transform: ${expr.transformId}`);
                return input;
            }
            return transform(input, expr.params);
        }

        case 'fallback': {
            const primary = resolveBindingExpr(expr.primary, context);
            return primary !== undefined && primary !== null
                ? primary
                : resolveBindingExpr(expr.fallback, context);
        }

        default: {
            console.warn('[BindingAST] Unknown expression kind:', (expr as { kind: string }).kind);
            return undefined;
        }
    }
}

/**
 * Resolve all bindings in a bindingMap against a context.
 * Returns a Record of prop key → resolved value.
 */
export function resolveBindingMap(
    bindingMap: Record<string, BindingExpr>,
    context: BindingContext
): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [prop, expr] of Object.entries(bindingMap)) {
        const value = resolveBindingExpr(expr, context);
        if (value !== undefined) {
            resolved[prop] = value;
        }
    }
    return resolved;
}

// ==================== MIGRATION ====================

/** Forbidden keys that cannot appear in binding paths */
const FORBIDDEN_KEYS = new Set(['constructor', '__proto__', 'prototype']);

/**
 * Convert a legacy string binding path to a BindingPath AST node.
 *
 * Example: "store.name" → { kind: 'path', root: 'store', segments: ['name'] }
 * Example: "collection.products[0].name" → { kind: 'path', root: 'collection', segments: ['products', 0, 'name'] }
 */
export function migrateStringBinding(path: string): BindingPath {
    // Parse array access: "a[0].b" → ["a", "0", "b"]
    const normalized = path.replace(/\[(\d+)\]/g, '.$1');
    const parts = normalized.split('.');

    if (parts.length === 0 || !parts[0]) {
        return { kind: 'path', root: 'store', segments: [] };
    }

    const root = parts[0] as BindingRoot;
    const segments: (string | number)[] = parts.slice(1).map((seg) => {
        const num = parseInt(seg, 10);
        return !isNaN(num) && String(num) === seg ? num : seg;
    });

    return { kind: 'path', root, segments };
}

/**
 * Convert a BindingPath AST node to a string representation.
 */
export function stringifyBinding(expr: BindingExpr): string {
    if (expr.kind !== 'path') return '';

    let result = expr.root;
    for (const seg of expr.segments) {
        if (typeof seg === 'number') {
            result += `[${seg}]`;
        } else {
            result += `.${seg}`;
        }
    }
    return result;
}

/**
 * Migrate all string bindings in a StorefrontNode tree to bindingMap.
 * Does NOT remove the old `bindings` field (for backward compat).
 */
export function migrateNodeBindings(node: StorefrontNode): StorefrontNode {
    const bindingMap: Record<string, BindingExpr> = { ...node.bindingMap };

    // Migrate legacy string bindings
    const legacyNode = node as StorefrontNode & { bindings?: Record<string, string> };
    if (legacyNode.bindings && !node.bindingMap) {
        for (const [prop, path] of Object.entries(legacyNode.bindings)) {
            if (typeof path === 'string' && path.length > 0) {
                bindingMap[prop] = migrateStringBinding(path);
            }
        }
    }

    // Recurse into children
    const children = node.children?.map(migrateNodeBindings);

    return {
        ...node,
        bindingMap: Object.keys(bindingMap).length > 0 ? bindingMap : undefined,
        children,
    };
}

/**
 * Validate a BindingExpr for structural correctness.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateBindingExpr(
    expr: BindingExpr,
    depth: number = 0
): { valid: boolean; error?: string } {
    const MAX_DEPTH = 5;

    if (depth > MAX_DEPTH) {
        return { valid: false, error: `Binding AST exceeds max depth of ${MAX_DEPTH}` };
    }

    if (!expr || typeof expr !== 'object' || !('kind' in expr)) {
        return { valid: false, error: 'Invalid binding expression: missing kind' };
    }

    switch (expr.kind) {
        case 'path': {
            if (!expr.root || typeof expr.root !== 'string') {
                return { valid: false, error: 'Path binding must have a root' };
            }
            if (!Array.isArray(expr.segments)) {
                return { valid: false, error: 'Path binding must have segments array' };
            }
            // Check for forbidden keys
            for (const seg of expr.segments) {
                if (typeof seg === 'string' && FORBIDDEN_KEYS.has(seg)) {
                    return { valid: false, error: `Forbidden binding key: ${seg}` };
                }
            }
            return { valid: true };
        }

        case 'literal':
            return { valid: true };

        case 'conditional': {
            const testResult = validateBindingExpr(expr.test, depth + 1);
            if (!testResult.valid) return testResult;
            const consResult = validateBindingExpr(expr.consequent, depth + 1);
            if (!consResult.valid) return consResult;
            return validateBindingExpr(expr.alternate, depth + 1);
        }

        case 'transform': {
            if (!expr.transformId || typeof expr.transformId !== 'string') {
                return { valid: false, error: 'Transform must have a transformId' };
            }
            return validateBindingExpr(expr.input, depth + 1);
        }

        case 'fallback': {
            const primaryResult = validateBindingExpr(expr.primary, depth + 1);
            if (!primaryResult.valid) return primaryResult;
            return validateBindingExpr(expr.fallback, depth + 1);
        }

        default:
            return { valid: false, error: `Unknown binding expression kind: ${(expr as { kind: string }).kind}` };
    }
}
