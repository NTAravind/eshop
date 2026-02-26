# 🚀 Migrate Storefront Builder to V2 Style System Only

## Goal

**Remove all V1 style system support and standardize on V2 architecture.**

This means:
- ✅ All nodes use `styleTokens` + `styleOverrides` (V2)
- ❌ No nodes use `styles` (V1)
- ✅ Renderer only reads V2
- ✅ Inspector only writes V2
- ✅ Canvas overlay only reads V2

---

## Why V2 is Better

### V1 (Legacy) Problems
```typescript
styles: {
    base: { width: '100px', color: 'red' },
    hover: { color: 'blue' }
}
```

❌ No theme token support
❌ No responsive breakpoints (sm, md, lg, xl)
❌ Limited state variants
❌ Mixes tokens and raw values

### V2 (Modern) Benefits
```typescript
// Token references
styleTokens: {
    color: 'colors.primary.500',
    backgroundColor: 'colors.gray.100'
}

// Inline overrides with full CSS
styleOverrides: {
    base: { width: '200px', padding: '16px' },
    hover: { transform: 'scale(1.05)' },
    sm: { width: '100%' },    // Responsive
    md: { width: '50%' },
    lg: { width: '33.333%' }
}
```

✅ Theme tokens for consistency
✅ Responsive breakpoints (mobile-first)
✅ State variants (hover, focus, active, disabled)
✅ Clear separation: tokens vs overrides

---

## Migration Strategy

### Phase 1: Create Migration Utility
### Phase 2: Migrate All Existing Nodes
### Phase 3: Remove V1 Support from Renderer
### Phase 4: Remove V1 Support from Inspector
### Phase 5: Remove V1 Support from Canvas
### Phase 6: Clean Up Types

---

## Phase 1: Migration Utility

**File:** `modules/storefront/migration/migrate-to-v2.ts`

```typescript
import { StorefrontNode } from '@/shared/types/storefront-builder';

/**
 * Migrates a node from V1 styles to V2 styleOverrides
 */
export function migrateNodeToV2(node: StorefrontNode): StorefrontNode {
    // Already V2 - no migration needed
    if (node.styleOverrides || node.styleTokens) {
        return node;
    }
    
    // No styles at all - nothing to migrate
    if (!node.styles) {
        return node;
    }
    
    // Migrate V1 to V2
    const migratedNode: StorefrontNode = {
        ...node,
        styleOverrides: {},
    };
    
    // Migrate base styles
    if (node.styles.base) {
        migratedNode.styleOverrides!.base = { ...node.styles.base };
    }
    
    // Migrate state variants (hover, focus, active, etc.)
    const stateKeys = ['hover', 'focus', 'active', 'disabled', 'visited'];
    stateKeys.forEach(state => {
        if (node.styles[state]) {
            migratedNode.styleOverrides![state] = { ...node.styles[state] };
        }
    });
    
    // V1 didn't have responsive breakpoints, but if there are any custom ones
    const breakpointKeys = ['sm', 'md', 'lg', 'xl', '2xl'];
    breakpointKeys.forEach(bp => {
        if (node.styles[bp]) {
            migratedNode.styleOverrides![bp] = { ...node.styles[bp] };
        }
    });
    
    // Remove V1 styles
    delete migratedNode.styles;
    
    // Recursively migrate children
    if (node.children) {
        migratedNode.children = node.children.map(migrateNodeToV2);
    }
    
    return migratedNode;
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
    return !!node.styles && !node.styleOverrides && !node.styleTokens;
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
    
    if (!node.styles?.base) return candidates;
    
    const baseStyles = node.styles.base;
    
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
            // Suggest a token path (you'll need to map actual values to tokens)
            candidates[prop] = `${tokenMappings[prop]}${value}`;
        }
    });
    
    return candidates;
}
```

---

## Phase 2: Migrate All Existing Nodes

### Option A: Migrate on Document Load

**File:** `modules/builder/editor-store.ts`

```typescript
import { migrateDocumentToV2, hasV1Nodes } from '@/modules/storefront/migration/migrate-to-v2';

const useEditorStore = create<EditorState>((set, get) => ({
    // ... existing state
    
    loadDocument: async (documentId: string) => {
        // Fetch document from database
        const doc = await fetchDocument(documentId);
        
        let tree = doc.tree;
        
        // Check if migration needed
        if (hasV1Nodes(tree)) {
            console.log('📦 Migrating document to V2...');
            tree = migrateDocumentToV2(tree);
            
            // Optionally: Auto-save migrated version
            await saveDocument(documentId, tree);
            console.log('✅ Document migrated to V2');
        }
        
        set({ 
            documentId,
            tree,
            // ... other state
        });
    },
}));
```

### Option B: One-Time Batch Migration Script

**File:** `scripts/migrate-all-documents-to-v2.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { migrateDocumentToV2, hasV1Nodes } from '@/modules/storefront/migration/migrate-to-v2';

async function migrateAllDocuments() {
    console.log('🚀 Starting V2 migration...');
    
    // Fetch all storefront documents
    const documents = await prisma.storefrontDocument.findMany({
        where: {
            status: { in: ['DRAFT', 'PUBLISHED'] }
        }
    });
    
    console.log(`📄 Found ${documents.length} documents to check`);
    
    let migratedCount = 0;
    let alreadyV2Count = 0;
    
    for (const doc of documents) {
        const tree = doc.tree as any; // Your tree type
        
        // Check if needs migration
        if (hasV1Nodes(tree)) {
            console.log(`  Migrating: ${doc.kind}/${doc.key}...`);
            
            const migratedTree = migrateDocumentToV2(tree);
            
            // Update in database
            await prisma.storefrontDocument.update({
                where: { id: doc.id },
                data: { 
                    tree: migratedTree,
                    updatedAt: new Date()
                }
            });
            
            migratedCount++;
        } else {
            alreadyV2Count++;
        }
    }
    
    console.log(`✅ Migration complete!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Already V2: ${alreadyV2Count}`);
}

// Run it
migrateAllDocuments()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    });
```

**To run:**
```bash
npx tsx scripts/migrate-all-documents-to-v2.ts
```

---

## Phase 3: Remove V1 Support from Renderer

**File:** `modules/storefront/runtime/renderer.tsx`

### Before (Supporting Both V1 and V2)
```typescript
function resolveNodeStyles(node: StorefrontNode, theme?: DesignTokenMap) {
    const resolved: CSSProperties = {};
    
    // V2: styleTokens
    if (node.styleTokens && theme) {
        Object.entries(node.styleTokens).forEach(([key, tokenPath]) => {
            resolved[key] = resolveToken(tokenPath, theme);
        });
    }
    
    // V2: styleOverrides
    if (node.styleOverrides?.base) {
        Object.assign(resolved, node.styleOverrides.base);
    }
    
    // V1: FALLBACK (REMOVE THIS)
    if (!node.styleOverrides && node.styles?.base) {
        Object.assign(resolved, node.styles.base);
    }
    
    return resolved;
}
```

### After (V2 Only)
```typescript
import { DesignTokenMap, ResponsiveStyleOverrides, StyleTokenMap } from '@/shared/types/storefront-builder';

/**
 * Resolves node styles using V2 system only
 */
export function resolveNodeStyles(
    node: StorefrontNode, 
    theme: DesignTokenMap,
    breakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl' = 'base'
): CSSProperties {
    const resolved: CSSProperties = {};
    
    // 1. Resolve token references from theme
    if (node.styleTokens && theme) {
        Object.entries(node.styleTokens).forEach(([cssProperty, tokenPath]) => {
            const value = resolveTokenPath(tokenPath, theme);
            if (value !== undefined) {
                resolved[cssProperty] = value;
            }
        });
    }
    
    // 2. Apply base overrides (highest priority)
    if (node.styleOverrides?.base) {
        Object.assign(resolved, node.styleOverrides.base);
    }
    
    // 3. Apply responsive overrides for current breakpoint
    if (breakpoint !== 'base' && node.styleOverrides?.[breakpoint]) {
        Object.assign(resolved, node.styleOverrides[breakpoint]);
    }
    
    // Note: State variants (hover, focus) are handled by CSS pseudo-selectors
    
    return resolved;
}

/**
 * Resolves a token path like "colors.primary.500" from theme
 */
function resolveTokenPath(path: string, theme: DesignTokenMap): any {
    const segments = path.split('.');
    let current: any = theme;
    
    for (const segment of segments) {
        if (current && typeof current === 'object' && segment in current) {
            current = current[segment];
        } else {
            console.warn(`Token path not found: ${path}`);
            return undefined;
        }
    }
    
    return current;
}

/**
 * Generates CSS class with state variants (hover, focus, etc.)
 */
export function generateStateStyles(
    node: StorefrontNode,
    theme: DesignTokenMap
): string {
    if (!node.styleOverrides) return '';
    
    const styles: string[] = [];
    const nodeClass = `node-${node.id}`;
    
    // Base styles (already applied inline)
    
    // Hover styles
    if (node.styleOverrides.hover) {
        const hoverCSS = objectToCSS(node.styleOverrides.hover);
        styles.push(`.${nodeClass}:hover { ${hoverCSS} }`);
    }
    
    // Focus styles
    if (node.styleOverrides.focus) {
        const focusCSS = objectToCSS(node.styleOverrides.focus);
        styles.push(`.${nodeClass}:focus { ${focusCSS} }`);
    }
    
    // Active styles
    if (node.styleOverrides.active) {
        const activeCSS = objectToCSS(node.styleOverrides.active);
        styles.push(`.${nodeClass}:active { ${activeCSS} }`);
    }
    
    // Disabled styles
    if (node.styleOverrides.disabled) {
        const disabledCSS = objectToCSS(node.styleOverrides.disabled);
        styles.push(`.${nodeClass}:disabled { ${disabledCSS} }`);
    }
    
    return styles.join('\n');
}

function objectToCSS(obj: Record<string, any>): string {
    return Object.entries(obj)
        .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const cssKey = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
            return `${cssKey}: ${value};`;
        })
        .join(' ');
}
```

### Update Component Renderer

```typescript
// In your component renderer
const ComponentWrapper = ({ node, children }: { node: StorefrontNode; children?: React.ReactNode }) => {
    const theme = useTheme(); // Get theme from context
    const [breakpoint, setBreakpoint] = useState<'base' | 'sm' | 'md' | 'lg' | 'xl'>('base');
    
    // Responsive breakpoint detection
    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;
            if (width >= 1280) setBreakpoint('xl');
            else if (width >= 1024) setBreakpoint('lg');
            else if (width >= 768) setBreakpoint('md');
            else if (width >= 640) setBreakpoint('sm');
            else setBreakpoint('base');
        };
        
        updateBreakpoint();
        window.addEventListener('resize', updateBreakpoint);
        return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);
    
    // Resolve styles for current breakpoint
    const resolvedStyles = resolveNodeStyles(node, theme, breakpoint);
    
    // Generate state styles (hover, focus, etc.)
    const stateStyles = generateStateStyles(node, theme);
    
    return (
        <>
            {stateStyles && <style>{stateStyles}</style>}
            <div 
                className={`node-${node.id}`}
                style={resolvedStyles}
                data-node-id={node.id}
            >
                {children}
            </div>
        </>
    );
};
```

---

## Phase 4: Remove V1 Support from Inspector

**File:** `modules/builder/components/inspector/StylePanel.tsx`

### Before (Supporting V1)
```typescript
const handleStyleUpdate = (property: string, value: any) => {
    // Check if V1 or V2
    if (node.styleOverrides || node.styleTokens) {
        // V2 update
        updateNode(nodeId, {
            styleOverrides: {
                ...node.styleOverrides,
                base: { ...node.styleOverrides?.base, [property]: value }
            }
        });
    } else {
        // V1 update (REMOVE THIS)
        updateNode(nodeId, {
            styles: {
                ...node.styles,
                base: { ...node.styles?.base, [property]: value }
            }
        });
    }
};
```

### After (V2 Only)
```typescript
/**
 * Updates a style property in V2 format
 */
const handleStyleUpdate = (
    property: string, 
    value: any,
    layer: 'base' | 'sm' | 'md' | 'lg' | 'xl' | 'hover' | 'focus' | 'active' | 'disabled' = 'base'
) => {
    const node = findNodeById(tree, nodeId);
    if (!node) return;
    
    // Always write to V2 styleOverrides
    const updates: Partial<StorefrontNode> = {
        styleOverrides: {
            ...(node.styleOverrides || {}),
            [layer]: {
                ...(node.styleOverrides?.[layer] || {}),
                [property]: value
            }
        }
    };
    
    updateNode(nodeId, updates);
};

/**
 * Updates a style token reference
 */
const handleTokenUpdate = (property: string, tokenPath: string) => {
    const node = findNodeById(tree, nodeId);
    if (!node) return;
    
    updateNode(nodeId, {
        styleTokens: {
            ...(node.styleTokens || {}),
            [property]: tokenPath
        }
    });
};

/**
 * Switches a property from override to token (or vice versa)
 */
const toggleTokenMode = (property: string, useToken: boolean) => {
    const node = findNodeById(tree, nodeId);
    if (!node) return;
    
    if (useToken) {
        // Remove from overrides, add to tokens
        const newOverrides = { ...node.styleOverrides };
        if (newOverrides.base) {
            delete newOverrides.base[property];
        }
        
        updateNode(nodeId, {
            styleOverrides: newOverrides,
            styleTokens: {
                ...(node.styleTokens || {}),
                [property]: 'colors.primary.500' // Default token
            }
        });
    } else {
        // Remove from tokens, add to overrides
        const newTokens = { ...node.styleTokens };
        delete newTokens[property];
        
        updateNode(nodeId, {
            styleTokens: newTokens,
            styleOverrides: {
                ...(node.styleOverrides || {}),
                base: {
                    ...(node.styleOverrides?.base || {}),
                    [property]: '' // Default override value
                }
            }
        });
    }
};
```

### Add Responsive Layer Selector

```typescript
const StylePanel = () => {
    const [activeLayer, setActiveLayer] = useState<'base' | 'sm' | 'md' | 'lg' | 'xl'>('base');
    
    return (
        <div>
            {/* Layer selector */}
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => setActiveLayer('base')}
                    className={activeLayer === 'base' ? 'active' : ''}
                >
                    📱 Base
                </button>
                <button 
                    onClick={() => setActiveLayer('sm')}
                    className={activeLayer === 'sm' ? 'active' : ''}
                >
                    📱 SM (640px+)
                </button>
                <button 
                    onClick={() => setActiveLayer('md')}
                    className={activeLayer === 'md' ? 'active' : ''}
                >
                    💻 MD (768px+)
                </button>
                <button 
                    onClick={() => setActiveLayer('lg')}
                    className={activeLayer === 'lg' ? 'active' : ''}
                >
                    🖥️ LG (1024px+)
                </button>
                <button 
                    onClick={() => setActiveLayer('xl')}
                    className={activeLayer === 'xl' ? 'active' : ''}
                >
                    🖥️ XL (1280px+)
                </button>
            </div>
            
            {/* Style controls */}
            <StyleControls 
                layer={activeLayer}
                onUpdate={(prop, value) => handleStyleUpdate(prop, value, activeLayer)}
            />
        </div>
    );
};
```

---

## Phase 5: Remove V1 Support from Canvas

**File:** `modules/builder/components/Canvas.tsx` and `SelectionOverlay.tsx`

### Before (Reading V1)
```typescript
const getNodePosition = (node: StorefrontNode) => {
    // Read from V1 or V2
    const styles = node.styleOverrides?.base || node.styles?.base || {};
    return {
        left: parseFloat(styles.left || '0'),
        top: parseFloat(styles.top || '0')
    };
};
```

### After (V2 Only)
```typescript
const getNodePosition = (node: StorefrontNode) => {
    // Only read from V2
    const styles = node.styleOverrides?.base || {};
    return {
        left: parseFloat(styles.left || '0'),
        top: parseFloat(styles.top || '0'),
        width: parseFloat(styles.width || 'auto'),
        height: parseFloat(styles.height || 'auto')
    };
};

const updateNodePosition = (nodeId: string, left: number, top: number) => {
    const node = findNodeById(tree, nodeId);
    if (!node) return;
    
    updateNode(nodeId, {
        styleOverrides: {
            ...(node.styleOverrides || {}),
            base: {
                ...(node.styleOverrides?.base || {}),
                position: 'absolute',
                left: `${left}px`,
                top: `${top}px`
            }
        }
    });
};
```

---

## Phase 6: Clean Up Types

**File:** `shared/types/storefront-builder.ts`

### Before (Supporting V1)
```typescript
interface StorefrontNode {
    id: string;
    type: string;
    props: Record<string, unknown>;
    
    // V2 (new)
    styleTokens?: StyleTokenMap;
    styleOverrides?: ResponsiveStyleOverrides;
    bindingMap?: Record<string, BindingExpr>;
    actionMap?: Record<string, ActionPipeline>;
    
    // V1 (deprecated) - REMOVE THESE
    styles?: StyleObject;
    bindings?: Record<string, string>;
    actions?: Record<string, ActionRef>;
    
    children?: StorefrontNode[];
    hidden?: boolean;
    locked?: boolean;
}
```

### After (V2 Only)
```typescript
interface StorefrontNode {
    id: string;
    type: string;
    props: Record<string, unknown>;
    
    // V2 Style System
    styleTokens?: StyleTokenMap;          // Theme token references
    styleOverrides?: ResponsiveStyleOverrides; // Inline CSS overrides
    
    // V2 Data System
    bindingMap?: Record<string, BindingExpr>;  // Data bindings (AST)
    actionMap?: Record<string, ActionPipeline>; // Action sequences
    
    // Tree structure
    children?: StorefrontNode[];
    hidden?: boolean;
    locked?: boolean;
}

// Fully defined V2 types
interface StyleTokenMap {
    [cssProperty: string]: string; // e.g., { color: 'colors.primary.500' }
}

interface ResponsiveStyleOverrides {
    // Responsive breakpoints (mobile-first)
    base?: CSSProperties;
    sm?: CSSProperties;   // >= 640px
    md?: CSSProperties;   // >= 768px
    lg?: CSSProperties;   // >= 1024px
    xl?: CSSProperties;   // >= 1280px
    '2xl'?: CSSProperties; // >= 1536px
    
    // State variants
    hover?: CSSProperties;
    focus?: CSSProperties;
    active?: CSSProperties;
    disabled?: CSSProperties;
    visited?: CSSProperties;
    checked?: CSSProperties;
    
    // Print media
    print?: CSSProperties;
}
```

---

## Testing Checklist

After migration, test these scenarios:

### ✅ Test 1: Load Migrated Document
1. Open a document that was migrated
2. All components should render correctly
3. No console errors about missing styles

### ✅ Test 2: Edit Styles
1. Select a component
2. Change background color
3. Canvas updates immediately
4. Inspector shows correct value

### ✅ Test 3: Responsive Styles
1. Select a component
2. Switch to SM breakpoint
3. Change padding
4. Canvas shows different padding at 640px+

### ✅ Test 4: Hover States
1. Select a button
2. Go to "Hover" layer in Inspector
3. Change hover color
4. Preview mode shows hover effect

### ✅ Test 5: Theme Tokens
1. Select a component
2. Set color to token: `colors.primary.500`
3. Change theme primary color
4. Component color updates

### ✅ Test 6: Drag & Resize
1. Select a box
2. Drag to new position
3. Position updates in styleOverrides.base
4. Resize works correctly

### ✅ Test 7: Undo/Redo
1. Make several style changes
2. Undo all changes
3. All changes revert correctly
4. Redo works

---

## Rollback Plan

If something breaks:

### 1. Backup Your Database
```bash
# Before migration
pg_dump yourdb > backup_before_v2_migration.sql
```

### 2. Temporarily Support Both
Keep V1 reading in renderer but only write V2:
```typescript
// Renderer reads both (during transition)
const styles = node.styleOverrides?.base || node.styles?.base || {};

// Inspector only writes V2
updateNode(nodeId, { styleOverrides: {...} });
```

### 3. Restore from Backup
```bash
# If needed
psql yourdb < backup_before_v2_migration.sql
```

---

## Performance Improvements

V2 enables these optimizations:

### 1. Theme Token Caching
```typescript
const tokenCache = new Map<string, any>();

function resolveToken(path: string, theme: DesignTokenMap) {
    if (tokenCache.has(path)) {
        return tokenCache.get(path);
    }
    const value = resolveTokenPath(path, theme);
    tokenCache.set(path, value);
    return value;
}
```

### 2. CSS-in-JS with Style Injection
Instead of inline styles, generate CSS classes:
```typescript
// Generate once per node type
const styleSheet = document.createElement('style');
styleSheet.textContent = generateNodeCSS(node, theme);
document.head.appendChild(styleSheet);
```

### 3. Responsive Style Caching
Cache resolved styles per breakpoint:
```typescript
const styleCache = useMemo(() => ({
    base: resolveNodeStyles(node, theme, 'base'),
    sm: resolveNodeStyles(node, theme, 'sm'),
    md: resolveNodeStyles(node, theme, 'md'),
}), [node, theme]);
```

---

## Summary

**What You're Removing:**
- ❌ `styles` property (V1)
- ❌ `bindings` property (V1 string paths)
- ❌ `actions` property (V1 action refs)
- ❌ All V1 fallback code in renderer
- ❌ All V1 migration logic in Inspector

**What You're Keeping:**
- ✅ `styleTokens` (theme references)
- ✅ `styleOverrides` (inline CSS with responsive + state)
- ✅ `bindingMap` (AST-based data bindings)
- ✅ `actionMap` (action pipelines)

**Benefits:**
- 🚀 Cleaner codebase (no dual system)
- 🎨 Better theme support
- 📱 Full responsive design
- ⚡ Faster rendering (no fallback checks)
- 🔧 Easier to maintain

---

## Next Steps

1. ✅ Create migration utility (Phase 1)
2. ✅ Run batch migration on all documents (Phase 2)
3. ✅ Update renderer to V2 only (Phase 3)
4. ✅ Update Inspector to V2 only (Phase 4)
5. ✅ Update Canvas to V2 only (Phase 5)
6. ✅ Clean up TypeScript types (Phase 6)
7. ✅ Test everything
8. ✅ Deploy to production

Estimated time: **4-6 hours** (including testing)

Good luck! 🚀
