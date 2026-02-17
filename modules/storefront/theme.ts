/**
 * Theme variable utilities
 * Provides consistent theme variable mapping across builder and runtime
 */

import type { ThemeVars } from '@/types/storefront-builder';

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Check if a value is in HSL component format (e.g., "222.2 47.4% 11.2%")
 */
function isHslComponents(value: string): boolean {
    return /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(value);
}

/**
 * Map theme variables to CSS custom properties
 * Converts camelCase keys to kebab-case and wraps HSL component values
 * 
 * @param themeVars - Theme variables object
 * @param scopeSelector - Optional scope selector (e.g., '.storefront-container' or '[data-store-id="abc"]')
 * @returns Object with CSS variable names as keys and formatted values
 */
export function mapThemeVarsToCss(
    themeVars: ThemeVars,
    scopeSelector?: string
): Record<string, string> {
    const cssVars: Record<string, string> = {};

    Object.entries(themeVars).forEach(([key, value]) => {
        if (!value) return;

        const varName = `--${toKebabCase(key)}`;
        const cssValue = isHslComponents(value) ? `hsl(${value})` : value;

        cssVars[varName] = cssValue;
    });

    return cssVars;
}

/**
 * Generate CSS style string from theme variables
 * 
 * @param themeVars - Theme variables object
 * @param scopeSelector - Scope selector (defaults to no scope, caller should provide '.storefront-container' or similar)
 * @returns CSS string ready to be injected via <style> tag
 */
export function generateThemeCssString(
    themeVars: ThemeVars,
    scopeSelector?: string
): string {
    const cssVars = mapThemeVarsToCss(themeVars);
    const cssLines = Object.entries(cssVars).map(
        ([varName, value]) => `${varName}: ${value};`
    );

    const selector = scopeSelector || '.storefront-container';
    return `${selector} { ${cssLines.join(' ')} }`;
}

/**
 * Generate inline style object from theme variables
 * For use with React's style prop
 * 
 * @param themeVars - Theme variables object
 * @returns React CSSProperties object
 */
export function generateThemeStyleObject(
    themeVars: ThemeVars
): React.CSSProperties {
    const cssVars = mapThemeVarsToCss(themeVars);
    return cssVars as React.CSSProperties;
}
