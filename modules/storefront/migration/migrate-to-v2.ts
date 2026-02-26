import { StorefrontNode } from '@/shared/types/storefront-builder';

// Helper interface extending StorefrontNode to ensure V1 properties are accessible
// even if they are removed from the main type later
interface LegacyStorefrontNode extends StorefrontNode {
    styles?: Record<string, any>;
}

/**
 * Migrates a node from V1 styles to V2 styleOverrides
 */
export function migrateNodeToV2(node: StorefrontNode): StorefrontNode {
    const legacyNode = node as LegacyStorefrontNode;

    // Already V2 - no migration needed
    if (node.styleOverrides || node.styleTokens) {
        return node;
    }

    // No styles at all - nothing to migrate
    if (!legacyNode.styles) {
        return node;
    }

    // Migrate V1 to V2
    const migratedNode: StorefrontNode = {
        ...node,
        styleOverrides: {},
    };

    // Migrate base styles
    if (legacyNode.styles.base) {
        migratedNode.styleOverrides!.base = { ...legacyNode.styles.base };
    }

    // Migrate state variants (hover, focus, active, etc.)
    const stateKeys = ['hover', 'focus', 'active', 'disabled', 'visited'];
    stateKeys.forEach(state => {
        if (legacyNode.styles?.[state]) {
            // Ensure styleOverrides exists
            if (!migratedNode.styleOverrides) migratedNode.styleOverrides = {};
            // Type assertion since we verified styleOverrides exists
            (migratedNode.styleOverrides as any)[state] = { ...legacyNode.styles[state] };
        }
    });

    // V1 didn't have responsive breakpoints usually, but if there are any custom ones from partial migrations
    const breakpointKeys = ['sm', 'md', 'lg', 'xl', '2xl'];
    breakpointKeys.forEach(bp => {
        if (legacyNode.styles?.[bp]) {
            if (!migratedNode.styleOverrides) migratedNode.styleOverrides = {};
            (migratedNode.styleOverrides as any)[bp] = { ...legacyNode.styles[bp] };
        }
    });

    // Remove V1 styles
    const { styles, ...cleanedNode } = migratedNode as LegacyStorefrontNode;

    // Recursively migrate children
    if (cleanedNode.children) {
        cleanedNode.children = cleanedNode.children.map(migrateNodeToV2);
    }

    return cleanedNode;
}

/**
 * Migrates an entire document tree to V2
 */
export function migrateDocumentToV2(tree: StorefrontNode): StorefrontNode {
    return migrateNodeToV2(tree);
}

/**
 * Checks if a node is using V1 styles
 */
export function isV1Node(node: StorefrontNode): boolean {
    const legacyNode = node as LegacyStorefrontNode;
    return !!legacyNode.styles && !node.styleOverrides && !node.styleTokens;
}

/**
 * Checks if an entire tree has any V1 nodes
 */
export function hasV1Nodes(tree: StorefrontNode): boolean {
    if (isV1Node(tree)) return true;
    if (tree.children) {
        return tree.children.some(hasV1Nodes);
    }
    return false;
}

/**
 * Extracts theme-able values from V1 styles and suggests token mappings
 * (Optional - for advanced migration with token extraction)
 */
export function extractTokenCandidates(node: StorefrontNode): Record<string, string> {
    const candidates: Record<string, string> = {};
    const legacyNode = node as LegacyStorefrontNode;

    if (!legacyNode.styles?.base) return candidates;

    const baseStyles = legacyNode.styles.base;

    // Common token-able properties
    const tokenMappings: Record<string, string> = {
        color: 'colors.',
        backgroundColor: 'colors.',
        borderColor: 'colors.',
        fontSize: 'fontSizes.',
        fontFamily: 'fonts.',
        padding: 'spacing.',
        margin: 'spacing.',
        gap: 'spacing.',
        borderRadius: 'radii.',
        boxShadow: 'shadows.',
        fontWeight: 'fontWeights.',
        lineHeight: 'lineHeights.',
        letterSpacing: 'letterSpacing.',
    };

    Object.entries(baseStyles).forEach(([prop, value]) => {
        if (tokenMappings[prop] && typeof value === 'string') {
            // Suggest a token path (you'll need to map actual values to tokens manually or with fuzzy matching)
            candidates[prop] = `${tokenMappings[prop]}${value}`;
        }
    });

    return candidates;
}
