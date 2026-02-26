/**
 * Token-First Styling System — V2 Architecture
 *
 * Resolves design tokens to CSS values by walking the theme's DesignTokenMap.
 * Supports responsive overrides, safe property filtering, and validation.
 */

import type { CSSProperties } from 'react';
import type {
    StyleTokenMap,
    ResponsiveStyleOverrides,
    DesignTokenMap,
    TypographyToken,
    SafeCSSProperties,
    StorefrontNode,
} from '@/types/storefront-builder';
import { isSafeProperty, filterSafeProperties } from './styles';

// ==================== BREAKPOINTS ====================

export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
type StateVariant = 'hover' | 'focus' | 'active';

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl'];

// ==================== TOKEN RESOLUTION ====================

/**
 * Resolve a dot-separated token path against a DesignTokenMap.
 *
 * Examples:
 *   "colors.primary"        → theme.colors.primary
 *   "spacing.md"            → theme.spacing.md
 *   "typography.heading.fontSize" → theme.typography.heading.fontSize
 */
export function resolveTokenPath(tokenPath: string, theme: DesignTokenMap): string | undefined {
    const parts = tokenPath.split('.');

    if (parts.length < 2) return undefined;

    const category = parts[0] as keyof DesignTokenMap;
    const bucket = theme[category];
    if (!bucket) return undefined;

    if (category === 'typography') {
        // Typography is a nested object: typography.heading → { fontFamily, fontSize, ... }
        const tokenName = parts[1];
        const typographyTokens = bucket as Record<string, TypographyToken>;
        const token = typographyTokens[tokenName];
        if (!token) return undefined;

        if (parts.length === 2) {
            // Return the full font shorthand?  No — caller should request specific sub-property
            return undefined;
        }
        const subProp = parts[2] as keyof TypographyToken;
        return token[subProp];
    }

    // Flat categories: colors.primary, spacing.md, radii.lg, shadows.md
    const tokenName = parts.slice(1).join('.');
    const flatBucket = bucket as Record<string, string>;
    return flatBucket[tokenName];
}

/**
 * Resolve a StyleTokenMap to CSSProperties using the theme.
 *
 * Input:    { backgroundColor: "colors.primary", padding: "spacing.md" }
 * Output:   { backgroundColor: "#3b82f6", padding: "1rem" }
 */
export function resolveTokenMap(
    tokens: StyleTokenMap,
    theme: DesignTokenMap
): CSSProperties {
    const resolved: CSSProperties = {};

    for (const [cssProp, tokenPath] of Object.entries(tokens)) {
        if (!isSafeProperty(cssProp)) continue;

        const value = resolveTokenPath(tokenPath, theme);
        if (value !== undefined) {
            (resolved as Record<string, unknown>)[cssProp] = value;
        }
    }

    return resolved;
}

/**
 * Resolve token-based styles + inline overrides for a given breakpoint.
 *
 * Priority (lowest → highest):
 * 1. Token-resolved base styles
 * 2. Inline override base styles
 * 3. Token + override for each breakpoint up to current
 */
export function resolveTokenStyles(
    tokens: StyleTokenMap | undefined,
    overrides: ResponsiveStyleOverrides | undefined,
    theme: DesignTokenMap,
    breakpoint: Breakpoint
): CSSProperties {
    if (!tokens && !overrides) return {};

    // 1. Resolve token base
    let resolved: CSSProperties = tokens ? resolveTokenMap(tokens, theme) : {};

    // 2. Apply responsive overrides up to current breakpoint
    if (overrides) {
        const breakpointIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
        for (let i = 0; i <= breakpointIndex; i++) {
            const bp = BREAKPOINT_ORDER[i];
            const bpOverrides = overrides[bp];
            if (bpOverrides) {
                const safe = filterSafeOverrides(bpOverrides);
                resolved = { ...resolved, ...safe };
            }
        }
    }

    return resolved;
}

/**
 * Get all style variants (base + hover/focus/active) from token system.
 */
export function resolveAllTokenStyles(
    tokens: StyleTokenMap | undefined,
    overrides: ResponsiveStyleOverrides | undefined,
    theme: DesignTokenMap,
    breakpoint: Breakpoint = 'base'
): {
    base: CSSProperties;
    hover: CSSProperties;
    focus: CSSProperties;
    active: CSSProperties;
} {
    return {
        base: resolveTokenStyles(tokens, overrides, theme, breakpoint),
        hover: overrides?.hover ? filterSafeOverrides(overrides.hover) : {},
        focus: overrides?.focus ? filterSafeOverrides(overrides.focus) : {},
        active: overrides?.active ? filterSafeOverrides(overrides.active) : {},
    };
}

// ==================== SAFE OVERRIDE FILTERING ====================

/**
 * Filter SafeCSSProperties to only include safe property names.
 */
export function filterSafeOverrides(overrides: SafeCSSProperties): CSSProperties {
    const safe: CSSProperties = {};
    for (const [key, value] of Object.entries(overrides)) {
        if (isSafeProperty(key) && value !== undefined) {
            (safe as Record<string, unknown>)[key] = value;
        }
    }
    return safe;
}

// ==================== DUAL-PATH NODE RESOLUTION ====================

/**
 * Resolve V2 style overrides WITHOUT theme token resolution.
 * This is used when theme tokens aren't available (e.g., in the builder editor).
 * It simply applies the raw styleOverrides as-is.
 */
export function resolveOverridesOnly(
    overrides: ResponsiveStyleOverrides | undefined,
    breakpoint: Breakpoint
): CSSProperties {
    if (!overrides) return {};

    const result: CSSProperties = {};
    const breakpointIndex = BREAKPOINT_ORDER.indexOf(breakpoint);

    // Apply overrides from base up to current breakpoint
    for (let i = 0; i <= breakpointIndex; i++) {
        const bp = BREAKPOINT_ORDER[i];
        const bpOverrides = overrides[bp as keyof ResponsiveStyleOverrides];
        if (bpOverrides) {
            const safe = filterSafeOverrides(bpOverrides);
            Object.assign(result, safe);
        }
    }

    return result;
}

/**
 * Resolve styles for a StorefrontNode, supporting both V1 and V2 formats.
 *
 * Priority:
 * 1. If node.styleTokens or node.styleOverrides exists (V2), use token resolution
 * 2. If node.styleOverrides exists but no theme, apply overrides directly
 * 3. Otherwise, fall back to node.styles (V1)
 */
export function resolveNodeStyles(
    node: StorefrontNode,
    theme: DesignTokenMap | undefined,
    breakpoint: Breakpoint
): CSSProperties {
    // V2: Token-based styles (if theme available)
    if ((node.styleTokens || node.styleOverrides) && theme) {
        return resolveTokenStyles(node.styleTokens, node.styleOverrides, theme, breakpoint);
    }

    // V2: Apply overrides directly even without theme (for builder)
    if (node.styleOverrides) {
        return resolveOverridesOnly(node.styleOverrides, breakpoint);
    }

    // No V2, return empty - caller should fall back to V1 styles
    return {};
}

/**
 * Get all style variants for a node (base + hover/focus/active).
 */
export function resolveAllNodeStyles(
    node: StorefrontNode,
    theme: DesignTokenMap | undefined,
    breakpoint: Breakpoint = 'base'
): {
    base: CSSProperties;
    hover: CSSProperties;
    focus: CSSProperties;
    active: CSSProperties;
} {
    // V2 with theme
    if ((node.styleTokens || node.styleOverrides) && theme) {
        return resolveAllTokenStyles(node.styleTokens, node.styleOverrides, theme, breakpoint);
    }

    // V2 without theme - apply overrides directly
    if (node.styleOverrides) {
        return {
            base: resolveOverridesOnly(node.styleOverrides, breakpoint),
            hover: node.styleOverrides.hover ? filterSafeOverrides(node.styleOverrides.hover) : {},
            focus: node.styleOverrides.focus ? filterSafeOverrides(node.styleOverrides.focus) : {},
            active: node.styleOverrides.active ? filterSafeOverrides(node.styleOverrides.active) : {},
        };
    }

    return { base: {}, hover: {}, focus: {}, active: {} };
}

// ==================== VALIDATION ====================

/**
 * Validate a StyleTokenMap against a theme — check that all referenced tokens exist.
 */
export function validateTokenMap(
    tokens: StyleTokenMap,
    theme: DesignTokenMap
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [cssProp, tokenPath] of Object.entries(tokens)) {
        // Check safe property
        if (!isSafeProperty(cssProp)) {
            errors.push(`Unsafe CSS property: "${cssProp}"`);
            continue;
        }

        // Check token exists
        const value = resolveTokenPath(tokenPath, theme);
        if (value === undefined) {
            errors.push(`Token not found: "${tokenPath}" (referenced by "${cssProp}")`);
        }
    }

    return { valid: errors.length === 0, errors };
}

// ==================== MIGRATION ====================

/**
 * Attempt to migrate a V1 StyleObject to V2 token refs, given a theme.
 * For each CSS value in the V1 styles, check if a matching token exists.
 * Falls back to inline overrides for values without token matches.
 */
export function migrateStyleToTokens(
    v1Styles: Record<string, CSSProperties | undefined>,
    theme: DesignTokenMap
): { tokens: StyleTokenMap; overrides: ResponsiveStyleOverrides } {
    const tokens: StyleTokenMap = {};
    const overrides: ResponsiveStyleOverrides = {};

    // Build a reverse map: CSS value → token path (for matching)
    const valueToTokenPath = new Map<string, string>();
    for (const [category, bucket] of Object.entries(theme)) {
        if (category === 'typography') continue; // Skip complex tokens
        if (category === 'custom') continue;
        for (const [name, value] of Object.entries(bucket as Record<string, string>)) {
            valueToTokenPath.set(value, `${category}.${name}`);
        }
    }

    // Process base styles
    const baseStyles = v1Styles['base'];
    if (baseStyles) {
        const unmatchedBase: SafeCSSProperties = {};
        for (const [prop, value] of Object.entries(baseStyles)) {
            if (!isSafeProperty(prop)) continue;
            const matchingToken = valueToTokenPath.get(String(value));
            if (matchingToken) {
                tokens[prop] = matchingToken;
            } else if (value !== undefined) {
                (unmatchedBase as Record<string, unknown>)[prop] = value;
            }
        }
        if (Object.keys(unmatchedBase).length > 0) {
            overrides.base = unmatchedBase;
        }
    }

    // Process responsive and state breakpoints as overrides
    const variants: (keyof ResponsiveStyleOverrides)[] = ['sm', 'md', 'lg', 'xl', 'hover', 'focus', 'active'];
    for (const variant of variants) {
        const variantStyles = v1Styles[variant];
        if (variantStyles) {
            const filtered: SafeCSSProperties = {};
            for (const [prop, value] of Object.entries(variantStyles)) {
                if (isSafeProperty(prop) && value !== undefined) {
                    (filtered as Record<string, unknown>)[prop] = value;
                }
            }
            if (Object.keys(filtered).length > 0) {
                (overrides as Record<string, SafeCSSProperties>)[variant] = filtered;
            }
        }
    }

    return { tokens, overrides };
}
