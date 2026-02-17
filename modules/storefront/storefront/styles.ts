import type { CSSProperties } from 'react';
import type { StyleObject } from '@/types/storefront-builder';

/**
 * Safe CSS properties - only these can be set via the builder
 * This prevents XSS and ensures only visual styling is possible
 */
const SAFE_CSS_PROPERTIES = new Set([
    // Layout
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'overflow', 'overflowX', 'overflowY',
    // Flexbox
    'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignContent',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'order', 'gap',
    'rowGap', 'columnGap',
    // Grid
    'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow',
    'gridAutoFlow', 'gridAutoColumns', 'gridAutoRows', 'placeItems', 'placeContent',
    // Typography
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight',
    'letterSpacing', 'textAlign', 'textDecoration', 'textTransform',
    'whiteSpace', 'wordBreak', 'wordSpacing', 'textOverflow',
    // Colors
    'color', 'backgroundColor', 'opacity',
    // Borders
    'border', 'borderWidth', 'borderStyle', 'borderColor',
    'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius',
    'borderBottomLeftRadius', 'borderBottomRightRadius',
    // Shadow
    'boxShadow', 'textShadow',
    // Transform
    'transform', 'transformOrigin',
    // Transition
    'transition', 'transitionProperty', 'transitionDuration',
    'transitionTimingFunction', 'transitionDelay',
    // Visibility
    'visibility', 'zIndex',
    // Cursor
    'cursor', 'pointerEvents',
    // Object fit (for images)
    'objectFit', 'objectPosition',
    // Aspect ratio
    'aspectRatio',
    // Filter
    'filter', 'backdropFilter',
]);

/**
 * Check if a CSS property is safe to use
 */
export function isSafeProperty(property: string): boolean {
    return SAFE_CSS_PROPERTIES.has(property);
}

/**
 * Filter CSS properties to only include safe ones
 */
export function filterSafeProperties(styles: CSSProperties): CSSProperties {
    const safe: CSSProperties = {};

    for (const [key, value] of Object.entries(styles)) {
        if (isSafeProperty(key) && value !== undefined) {
            (safe as Record<string, unknown>)[key] = value;
        }
    }

    return safe;
}

/**
 * Validate a StyleObject
 */
export function validateStyleObject(styles: StyleObject): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const checkProperties = (props: CSSProperties | undefined, context: string) => {
        if (!props) return;

        for (const key of Object.keys(props)) {
            if (!isSafeProperty(key)) {
                errors.push(`Unsafe property "${key}" in ${context}`);
            }
        }
    };

    checkProperties(styles.base, 'base');
    checkProperties(styles.sm, 'sm');
    checkProperties(styles.md, 'md');
    checkProperties(styles.lg, 'lg');
    checkProperties(styles.xl, 'xl');
    checkProperties(styles.hover, 'hover');
    checkProperties(styles.focus, 'focus');
    checkProperties(styles.active, 'active');

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get the current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number): 'base' | 'sm' | 'md' | 'lg' | 'xl' {
    if (width >= 1280) return 'xl';
    if (width >= 1024) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 640) return 'sm';
    return 'base';
}

/**
 * Resolve styles for a specific breakpoint
 * Cascades from base -> sm -> md -> lg -> xl
 */
export function resolveStyles(
    styles: StyleObject | undefined,
    breakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl'
): CSSProperties {
    if (!styles) return {};

    const breakpoints: ('base' | 'sm' | 'md' | 'lg' | 'xl')[] = ['base', 'sm', 'md', 'lg', 'xl'];
    const breakpointIndex = breakpoints.indexOf(breakpoint);

    // Start with base and cascade up to current breakpoint
    let resolved: CSSProperties = {};

    for (let i = 0; i <= breakpointIndex; i++) {
        const bp = breakpoints[i];
        const bpStyles = styles[bp];
        if (bpStyles) {
            resolved = { ...resolved, ...filterSafeProperties(bpStyles) };
        }
    }

    return resolved;
}

/**
 * Get hover styles if defined
 */
export function getHoverStyles(styles: StyleObject | undefined): CSSProperties {
    if (!styles?.hover) return {};
    return filterSafeProperties(styles.hover);
}

/**
 * Get focus styles if defined
 */
export function getFocusStyles(styles: StyleObject | undefined): CSSProperties {
    if (!styles?.focus) return {};
    return filterSafeProperties(styles.focus);
}

/**
 * Get active styles if defined
 */
export function getActiveStyles(styles: StyleObject | undefined): CSSProperties {
    if (!styles?.active) return {};
    return filterSafeProperties(styles.active);
}

/**
 * Convert StyleObject to CSS-in-JS with all state variants
 * For use with components that support hover/focus states
 */
export function resolveAllStyles(
    styles: StyleObject | undefined,
    breakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl' = 'base'
): {
    base: CSSProperties;
    hover: CSSProperties;
    focus: CSSProperties;
    active: CSSProperties;
} {
    return {
        base: resolveStyles(styles, breakpoint),
        hover: getHoverStyles(styles),
        focus: getFocusStyles(styles),
        active: getActiveStyles(styles),
    };
}

/**
 * Merge multiple StyleObjects
 */
export function mergeStyles(...styleObjects: (StyleObject | undefined)[]): StyleObject {
    const merged: StyleObject = {};

    for (const styles of styleObjects) {
        if (!styles) continue;

        if (styles.base) merged.base = { ...merged.base, ...styles.base };
        if (styles.sm) merged.sm = { ...merged.sm, ...styles.sm };
        if (styles.md) merged.md = { ...merged.md, ...styles.md };
        if (styles.lg) merged.lg = { ...merged.lg, ...styles.lg };
        if (styles.xl) merged.xl = { ...merged.xl, ...styles.xl };
        if (styles.hover) merged.hover = { ...merged.hover, ...styles.hover };
        if (styles.focus) merged.focus = { ...merged.focus, ...styles.focus };
        if (styles.active) merged.active = { ...merged.active, ...styles.active };
    }

    return merged;
}
