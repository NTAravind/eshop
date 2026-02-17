/**
 * Route Resolver — V2 Architecture
 *
 * Resolves incoming URL paths to page documents using a RouteManifest.
 * Supports static pages, parameterized routes, and template selection rules.
 */

import type {
    RouteManifest,
    RouteEntry,
    StaticRoute,
    DynamicRoute,
    TemplateRoute,
    TemplateRule,
    TemplateMatchCondition,
    RedirectEntry,
} from '@/types/storefront-builder';

// ==================== TYPES ====================

export interface ResolvedRoute {
    /** The matched route entry */
    entry: RouteEntry;
    /** Extracted URL parameters */
    params: Record<string, string>;
    /** The data profile to load, if any */
    dataProfileId?: string;
    /** For template routes: resolved template key */
    resolvedTemplateKey?: string;
}

export interface ResolvedRedirect {
    to: string;
    permanent: boolean;
}

// ==================== ROUTE MATCHING ====================

/**
 * Resolve a URL path against a RouteManifest.
 *
 * Matching priority:
 * 1. Redirects (checked first)
 * 2. Exact static match (e.g. "/cart" → pageKey)
 * 3. Dynamic route match (e.g. "/collections/:handle")
 * 4. Template route match (e.g. "/products/:slug")
 *
 * Returns null if no route matches.
 */
export function resolveRoute(
    manifest: RouteManifest,
    path: string
): ResolvedRoute | null {
    const normalizedPath = normalizePath(path);

    // 1. Static routes — exact match
    for (const route of manifest.routes) {
        if (route.kind === 'static' && route.path === normalizedPath) {
            return {
                entry: route,
                params: {},
                dataProfileId: route.dataProfileId,
            };
        }
    }

    // 2. Dynamic routes — pattern match
    for (const route of manifest.routes) {
        if (route.kind === 'dynamic') {
            const match = matchPattern(route.pattern, normalizedPath);
            if (match) {
                return {
                    entry: route,
                    params: match.params,
                    dataProfileId: route.dataProfileId,
                };
            }
        }
    }

    // 3. Template routes — pattern match with template selection
    for (const route of manifest.routes) {
        if (route.kind === 'template') {
            const match = matchPattern(route.pattern, normalizedPath);
            if (match) {
                return {
                    entry: route,
                    params: match.params,
                    dataProfileId: route.dataProfileId,
                };
            }
        }
    }

    return null;
}

/**
 * Check for redirects before route resolution.
 */
export function resolveRedirect(
    manifest: RouteManifest,
    path: string
): ResolvedRedirect | null {
    if (!manifest.redirects) return null;
    const normalizedPath = normalizePath(path);

    for (const redirect of manifest.redirects) {
        if (redirect.from === normalizedPath) {
            return { to: redirect.to, permanent: redirect.permanent };
        }
    }
    return null;
}

// ==================== PATTERN MATCHING ====================

/**
 * Match a route pattern against a path.
 *
 * Patterns:
 * - Static segments: "about" matches "about"
 * - Parameters: ":slug" matches any segment → { slug: "value" }
 * - Catch-all: "*" matches rest of path
 */
function matchPattern(
    pattern: string,
    path: string
): { params: Record<string, string> } | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
        const seg = patternParts[i];

        if (seg === '*') {
            params['*'] = pathParts.slice(i).join('/');
            return { params };
        }

        if (i >= pathParts.length) return null;

        if (seg.startsWith(':')) {
            params[seg.slice(1)] = pathParts[i];
            continue;
        }

        if (seg !== pathParts[i]) return null;
    }

    if (patternParts.length !== pathParts.length && !patternParts.includes('*')) {
        return null;
    }

    return { params };
}

// ==================== TEMPLATE SELECTION ====================

/**
 * Select the best template for a product based on TemplateRules.
 * Rules are sorted by priority (ascending) and evaluated in order.
 * The first matching rule wins. Returns null if no rule matches.
 */
export function resolveTemplate(
    rules: TemplateRule[],
    product: Record<string, unknown>
): string | null {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);

    for (const rule of sorted) {
        if (matchCondition(rule.match, product)) {
            return rule.templateKey;
        }
    }

    return null;
}

/**
 * Evaluate a TemplateMatchCondition against product data.
 */
function matchCondition(
    condition: TemplateMatchCondition,
    product: Record<string, unknown>
): boolean {
    // Default always matches
    if (condition.field === 'default' && condition.operator === 'always') {
        return true;
    }

    const fieldValue = product[condition.field];
    if (fieldValue === undefined) return false;

    switch (condition.operator) {
        case 'eq':
            return String(fieldValue) === String(condition.value);

        case 'in':
            if (Array.isArray(condition.value)) {
                return condition.value.includes(String(fieldValue));
            }
            return false;

        case 'contains':
            if (Array.isArray(fieldValue)) {
                return fieldValue.includes(String(condition.value));
            }
            if (typeof fieldValue === 'string') {
                return fieldValue.includes(String(condition.value));
            }
            return false;

        default:
            return false;
    }
}

// ==================== UTILITIES ====================

function normalizePath(path: string): string {
    let p = path.replace(/\/+/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
}
