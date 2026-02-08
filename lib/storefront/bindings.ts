import type { BindingContext, RuntimeContext, RepeaterScope } from '@/types/storefront-builder';

/**
 * Forbidden keys that cannot be accessed via bindings (security)
 */
const FORBIDDEN_KEYS = new Set([
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
]);

/**
 * Valid binding path pattern
 * Allows: a.b.c, a.b[0].c, a[0].b[1].c
 * Disallows: function calls, expressions, ternaries
 */
const VALID_PATH_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+\])*$/;

/**
 * Parse a binding path into segments
 * "a.b[0].c" => ["a", "b", 0, "c"]
 */
function parsePath(path: string): (string | number)[] {
    const segments: (string | number)[] = [];
    let current = '';
    let i = 0;

    while (i < path.length) {
        const char = path[i];

        if (char === '.') {
            if (current) {
                segments.push(current);
                current = '';
            }
            i++;
        } else if (char === '[') {
            if (current) {
                segments.push(current);
                current = '';
            }
            i++;
            let indexStr = '';
            while (i < path.length && path[i] !== ']') {
                indexStr += path[i];
                i++;
            }
            if (path[i] === ']') {
                i++;
            }
            const index = parseInt(indexStr, 10);
            if (!isNaN(index)) {
                segments.push(index);
            }
        } else {
            current += char;
            i++;
        }
    }

    if (current) {
        segments.push(current);
    }

    return segments;
}

/**
 * Validate a binding path
 */
export function validateBindingPath(path: string): { valid: boolean; error?: string } {
    if (!path || typeof path !== 'string') {
        return { valid: false, error: 'Path must be a non-empty string' };
    }

    // Check against forbidden patterns
    const lowerPath = path.toLowerCase();
    for (const forbidden of FORBIDDEN_KEYS) {
        if (lowerPath.includes(forbidden.toLowerCase())) {
            return { valid: false, error: `Forbidden key: ${forbidden}` };
        }
    }

    // Check for function calls
    if (path.includes('(') || path.includes(')')) {
        return { valid: false, error: 'Function calls are not allowed' };
    }

    // Check for expressions
    if (path.includes('?') || path.includes(':') || path.includes('+') ||
        path.includes('-') || path.includes('*') || path.includes('/') ||
        path.includes('=') || path.includes('!') || path.includes('&') ||
        path.includes('|') || path.includes('<') || path.includes('>')) {
        return { valid: false, error: 'Expressions are not allowed' };
    }

    // Check against valid pattern
    if (!VALID_PATH_REGEX.test(path)) {
        return { valid: false, error: 'Invalid path format' };
    }

    return { valid: true };
}

/**
 * Safely walk an object using a path
 */
function walkObject(obj: unknown, segments: (string | number)[]): unknown {
    let current: unknown = obj;

    for (const segment of segments) {
        if (current === null || current === undefined) {
            return undefined;
        }

        // Check for forbidden keys
        if (typeof segment === 'string' && FORBIDDEN_KEYS.has(segment)) {
            return undefined;
        }

        if (typeof current !== 'object') {
            return undefined;
        }

        if (Array.isArray(current)) {
            if (typeof segment === 'number') {
                current = current[segment];
            } else {
                // Trying to access string key on array - unlikely to succeed but valid JS
                current = (current as unknown as Record<string, unknown>)[segment];
            }
        } else {
            current = (current as Record<string, unknown>)[String(segment)];
        }
    }

    return current;
}

/**
 * Resolve a binding path against the runtime context
 * Returns undefined for missing values (never throws)
 */
export function resolveBinding(path: string, context: RuntimeContext | BindingContext): unknown {
    // Validate path first
    const validation = validateBindingPath(path);
    if (!validation.valid) {
        return undefined;
    }

    // Parse path into segments
    const segments = parsePath(path);
    if (segments.length === 0) {
        return undefined;
    }

    // Get the root key
    const rootKey = segments[0] as string;
    const restSegments = segments.slice(1);

    // Check for repeater scope access (item, index)
    if (rootKey === 'item' && '__scope' in context && context.__scope) {
        const scope = context.__scope as RepeaterScope;
        if (restSegments.length === 0) {
            return scope.item;
        }
        return walkObject(scope.item, restSegments);
    }

    if (rootKey === 'index' && '__scope' in context && context.__scope) {
        const scope = context.__scope as RepeaterScope;
        if (restSegments.length === 0) {
            return scope.index;
        }
        return undefined; // index is a number, can't walk further
    }

    // Check standard context roots
    const contextRoots: Record<string, unknown> = {
        store: context.store,
        settings: context.settings,
        user: context.user,
        cart: context.cart,
        route: context.route,
        uiState: context.uiState,
        collection: context.collection,
        facets: context.facets,
        product: context.product,
        selectedVariant: context.selectedVariant,
        similarProducts: context.similarProducts,
        orders: context.orders,
    };

    const root = contextRoots[rootKey];
    if (root === undefined) {
        return undefined;
    }

    if (restSegments.length === 0) {
        return root;
    }

    return walkObject(root, restSegments);
}

/**
 * Resolve all bindings for a node's props
 */
export function resolveBindings(
    props: Record<string, unknown>,
    bindings: Record<string, string> | undefined,
    context: RuntimeContext | BindingContext
): Record<string, unknown> {
    if (!bindings || Object.keys(bindings).length === 0) {
        return props;
    }

    const resolved = { ...props };

    for (const [propKey, bindingPath] of Object.entries(bindings)) {
        const value = resolveBinding(bindingPath, context);
        if (value !== undefined) {
            resolved[propKey] = value;
        }
    }

    return resolved;
}

/**
 * Resolve payload bindings for an action
 */
export function resolvePayloadBindings(
    payload: Record<string, unknown> | undefined,
    payloadBindings: Record<string, string> | undefined,
    context: RuntimeContext | BindingContext
): Record<string, unknown> {
    const resolvedPayload = payload ? { ...payload } : {};

    if (payloadBindings) {
        for (const [key, path] of Object.entries(payloadBindings)) {
            const value = resolveBinding(path, context);
            if (value !== undefined) {
                resolvedPayload[key] = value;
            }
        }
    }

    return resolvedPayload;
}

/**
 * Generate binding path suggestions from a schema definition
 */
export function generateBindingPaths(
    schemaFields: Array<{ key?: string; name?: string }>,
    prefix: string = 'product.customData'
): string[] {
    return schemaFields.map(field => {
        const fieldKey = field.key ?? field.name;
        return `${prefix}.${fieldKey}`;
    });
}
