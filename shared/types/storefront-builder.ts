import type { CSSProperties } from 'react';

// ==================== CORE NODE TYPES ====================

/**
 * StorefrontNode - JSON tree node for documents
 */
export interface StorefrontNode {
    id: string;
    type: string;
    props: Record<string, unknown>;
    children?: StorefrontNode[];
    hidden?: boolean;
    locked?: boolean;
    // V1 legacy styles (deprecated but still supported for migration)
    /** @deprecated Use styleTokens + styleOverrides instead */
    styles?: StyleObject;
    /** @deprecated Use bindingMap instead */
    bindings?: Record<string, string>;
    // --- V2 Architecture fields ---
    /** Binding map: prop key → BindingExpr (replaces string bindings) */
    bindingMap?: Record<string, BindingExpr>;
    /** Design token references: CSS prop → token path */
    styleTokens?: StyleTokenMap;
    /** Inline style overrides (safe properties only, replaces styles) */
    styleOverrides?: ResponsiveStyleOverrides;
    /** Action pipeline map: event slot → ActionPipeline */
    actionMap?: Record<string, ActionPipeline>;
    /** Schema version of this node (for migration) */
    schemaVersion?: number;
}

/**
 * StyleObject - responsive styles with breakpoints and states
 */
export interface StyleObject {
    base?: CSSProperties;
    sm?: CSSProperties;  // >= 640px
    md?: CSSProperties;  // >= 768px
    lg?: CSSProperties;  // >= 1024px
    xl?: CSSProperties;  // >= 1280px
    hover?: CSSProperties;
    focus?: CSSProperties;
    active?: CSSProperties;
}

/**
 * Theme variables
 */
export interface ThemeVars {
    // Core colors
    background?: string;
    foreground?: string;
    card?: string;
    cardForeground?: string;
    popover?: string;
    popoverForeground?: string;
    primary?: string;
    primaryForeground?: string;
    secondary?: string;
    secondaryForeground?: string;
    muted?: string;
    mutedForeground?: string;
    accent?: string;
    accentForeground?: string;
    destructive?: string;
    destructiveForeground?: string;
    border?: string;
    input?: string;
    ring?: string;
    radius?: string;
    // Chart colors
    chart1?: string;
    chart2?: string;
    chart3?: string;
    chart4?: string;
    chart5?: string;
    // Additional custom vars
    [key: string]: string | undefined;
}

/**
 * Prefab Instance Props
 */
export interface PrefabInstanceProps {
    prefabKey: string;
    prefabVersion?: string;
    overrides?: PrefabOverrides;
    slotContent?: PrefabSlotContent;
}

/**
 * Prefab Slot Content — nodes injected into named slots of a prefab instance
 */
export interface PrefabSlotContent {
    [slotName: string]: StorefrontNode[];
}

/**
 * Prefab Override Map
 * Keyed by child node ID within the prefab
 */
export interface PrefabOverrides {
    [childId: string]: {
        props?: Record<string, unknown>;
        styleOverrides?: ResponsiveStyleOverrides;
        styleTokens?: StyleTokenMap;
        bindingMap?: Record<string, BindingExpr>;
        actionMap?: Record<string, ActionPipeline>;
        hidden?: boolean;
    };
}

// ==================== ACTION TYPES ====================

/**
 * Action IDs - all supported declarative actions
 */
export type ActionID =
    | 'ADD_TO_CART'
    | 'REMOVE_FROM_CART'
    | 'UPDATE_QUANTITY'
    | 'BUY_NOW'
    | 'SELECT_VARIANT'
    | 'APPLY_DISCOUNT'
    | 'SET_DELIVERY_MODE'
    | 'OPEN_CART_SIDEBAR'
    | 'GO_TO_CHECKOUT'
    | 'PLACE_ORDER'
    | 'NAVIGATE'
    | 'UPDATE_UI_STATE'
    | 'SUBMIT_FORM'
    | 'OAUTH_LOGIN'
    | 'opencartsidebar';

/**
 * ActionRef - declarative action reference
 */
export interface ActionRef {
    actionId: ActionID;
    payload?: Record<string, unknown>;
    payloadBindings?: Record<string, string>;
}

// ==================== RUNTIME CONTEXT TYPES ====================

/**
 * StoreContext - store data available at runtime
 */
export interface StoreContext {
    id: string;
    name: string;
    slug: string;
    currency: string;
    requirePhoneNumber?: boolean;
    logoUrl?: string;
    paymentMethods?: Record<string, boolean>;
}

/**
 * SettingsContext - storefront settings
 */
export interface SettingsContext {
    deliveryModes?: ('DELIVERY' | 'PICKUP')[];
    checkoutFields?: Record<string, FieldConfig>;
    profileFields?: Record<string, FieldConfig>;
}

export interface FieldConfig {
    required?: boolean;
    visible?: boolean;
    label?: string;
    defaultValue?: unknown;
    type?: string;
    description?: string;
}

/**
 * UserContext - authenticated user data
 */
export interface UserContext {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    image?: string;
}

/**
 * CartContext - shopping cart data
 */
export interface CartContext {
    id: string;
    items: CartItemContext[];
    subtotal: number;
    total: number;
    currency: string;
    itemCount: number;
}

export interface CartItemContext {
    id: string;
    variantId: string;
    quantity: number;
    product: ProductContext;
    variant: VariantContext;
    lineTotal: number;
}

/**
 * RouteContext - current route information
 */
export interface RouteContext {
    pathname: string;
    searchParams: Record<string, string | string[]>;
    params: Record<string, string>;
}

/**
 * UIState - client-side UI state
 */
export interface UIState {
    selectedVariantId?: string;
    deliveryMode?: 'DELIVERY' | 'PICKUP';
    activeFilters?: Record<string, string[]>;
    searchQuery?: string;
    cartSidebarOpen?: boolean;
}

/**
 * ProductContext - product data for bindings
 */
export interface ProductContext {
    id: string;
    name: string;
    description?: string;
    href?: string;
    image?: string; // Main image fallback
    images: ImageContext[];
    variants: VariantContext[];
    defaultVariant?: VariantContext;
    customData?: Record<string, unknown>;
    productSchemaId?: string;
    categoryId?: string;
}

export interface ImageContext {
    url: string;
    alt?: string;
    position: number;
}

export interface VariantContext {
    id: string;
    sku: string;
    price: number;
    stock: number;
    customData?: Record<string, unknown>;
    images: ImageContext[];
    isActive: boolean;
}

/**
 * CollectionContext - product listing data
 */
export interface CollectionContext {
    products: ProductContext[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * FacetsContext - filter facets
 */
export interface FacetsContext {
    facets: FacetContext[];
}

export interface FacetContext {
    id: string;
    code: string;
    name: string;
    values: FacetValueContext[];
    productSchemaId?: string;
}

export interface FacetValueContext {
    id: string;
    value: string;
    label?: string;
    count?: number;
}

/**
 * OrdersContext - user orders
 */
export interface OrdersContext {
    results: OrderContext[];
    total: number;
    page: number;
    pageSize: number;
}

export interface OrderContext {
    id: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    lines: OrderLineContext[];
}

export interface OrderLineContext {
    variantId: string;
    quantity: number;
    price: number;
    productSnapshot: Record<string, unknown>;
    variantSnapshot: Record<string, unknown>;
}

/**
 * RuntimeContext - all data available during render
 */
export interface RuntimeContext {
    store: StoreContext;
    settings: SettingsContext;
    user: UserContext | null;
    cart: CartContext | null;
    route: RouteContext;
    uiState: UIState;
    // Route-dependent data
    collection?: CollectionContext;
    facets?: FacetsContext;
    product?: ProductContext;
    selectedVariant?: VariantContext;
    similarProducts?: ProductContext[];
    orders?: OrdersContext;
    order?: OrderContext;
    /**
     * Available prefabs (key -> tree) for runtime composition
     */
    prefabs?: Record<string, StorefrontNode>;
}

// ==================== COMPONENT REGISTRY TYPES ====================

/**
 * Component category
 */
export type ComponentCategory =
    | 'layout'
    | 'navigation'
    | 'content'
    | 'commerce'
    | 'forms'
    | 'utility';

/**
 * Component constraints
 */
export interface ComponentConstraints {
    canHaveChildren: boolean;
    allowedChildren?: string[];  // Specific types allowed, undefined = all
    requiredChildren?: string[]; // Must contain these types
    maxChildren?: number;
}

/**
 * Component definition for registry
 */
export interface ComponentDefinition {
    type: string;
    displayName: string;
    category: ComponentCategory;
    icon?: string;  // Lucide icon name
    propsSchema: unknown;  // Zod schema
    controls?: Record<string, ControlDefinition>; // UI controls definition
    styleSchema?: unknown; // Optional style restrictions
    actionSlots?: string[]; // e.g., ['onClick', 'onSubmit']
    bindingHints?: Record<string, string>; // Suggested bindings
    constraints: ComponentConstraints;
    defaults: {
        props: Record<string, unknown>;
        styleOverrides?: ResponsiveStyleOverrides;
        bindingMap?: Record<string, BindingExpr>;
        actionMap?: Record<string, ActionPipeline>;
        children?: StorefrontNode[];
    };
}

export type ControlType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'icon' | 'style-select' | 'productSchema' | 'prefab';

export interface ControlDefinition {
    type: ControlType;
    label?: string;
    options?: { label: string; value: string }[] | string[];
    prefabType?: string; // e.g. 'productcard', 'cartsidebar'

    min?: number;
    max?: number;
    step?: number;
    defaultValue?: unknown;
    section?: string; // Grouping
}

// ==================== DOCUMENT TYPES ====================

/**
 * Document root with metadata
 */
export interface StorefrontDocumentRoot {
    id: string;
    storeId: string;
    kind: 'LAYOUT' | 'PAGE' | 'TEMPLATE' | 'PREFAB';
    key: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    layoutRefs?: string[];  // IDs of layout documents to wrap with
    tree: StorefrontNode;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// ==================== EDITOR TYPES ====================

/**
 * Editor mode
 */
export type EditorMode = 'edit' | 'preview';

/**
 * Device type for preview
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * Editor selection state
 */
export interface EditorSelection {
    nodeId: string | null;
    childNodeId?: string | null; // ID of the child node within a prefab instance
    path: number[];  // Path of indices to reach node
}

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
    tree: StorefrontNode;
    timestamp: number;
    description?: string;
}

// ==================== REPEATER SCOPE ====================

/**
 * Repeater scope - extra context variables inside repeaters
 */
export interface RepeaterScope {
    item: unknown;
    index: number;
}

/**
 * Combined context with optional repeater scope
 */
export interface BindingContext extends RuntimeContext {
    __scope?: RepeaterScope;
}

// ==================== V2 ARCHITECTURE TYPES ====================
// The following types support the redesigned architecture.
// They coexist with the legacy types above during incremental migration.

// -------------------- BINDING AST --------------------

/**
 * Serializable binding expression.
 * Replaces raw string paths with a typed AST.
 */
export type BindingExpr =
    | BindingPath
    | BindingLiteral
    | BindingConditional
    | BindingTransform
    | BindingFallback;

/** Direct context path lookup */
export interface BindingPath {
    kind: 'path';
    root: BindingRoot;
    segments: (string | number)[];
}

/** Literal / static value (for defaults) */
export interface BindingLiteral {
    kind: 'literal';
    value: string | number | boolean | null;
}

/** Conditional: if test is truthy, use consequent, else alternate */
export interface BindingConditional {
    kind: 'conditional';
    test: BindingExpr;
    consequent: BindingExpr;
    alternate: BindingExpr;
}

/** Transform: apply a named pure function to input */
export interface BindingTransform {
    kind: 'transform';
    transformId: string;
    input: BindingExpr;
    params?: Record<string, unknown>;
}

/** Fallback: try primary, fall back to secondary */
export interface BindingFallback {
    kind: 'fallback';
    primary: BindingExpr;
    fallback: BindingExpr;
}

/** All valid context roots for binding resolution */
export type BindingRoot =
    | 'store' | 'settings' | 'user' | 'cart' | 'route'
    | 'uiState' | 'collection' | 'facets' | 'product'
    | 'selectedVariant' | 'similarProducts' | 'orders'
    | 'item' | 'index'
    | 'pageData';

// -------------------- ACTION PIPELINE --------------------

/**
 * An ActionPipeline replaces a single ActionRef.
 * It is an ordered sequence of action steps with control flow.
 */
export interface ActionPipeline {
    id: string;
    steps: ActionStep[];
    onError?: 'stop' | 'continue' | 'rollback';
}

export interface ActionStep {
    id: string;
    actionId: string;
    payload?: Record<string, unknown>;
    payloadBindings?: Record<string, BindingExpr>;
    condition?: BindingExpr;
    await?: boolean;
}

/** Action contract in the registry */
export interface ActionContract {
    id: string;
    displayName: string;
    description: string;
    payloadSchema: unknown; // Zod schema at runtime
    bindableFields: string[];
    availability: 'client' | 'server' | 'both';
    requiredCapabilities?: string[];
    sideEffects: ('cart_mutation' | 'navigation' | 'ui_state' | 'api_call' | 'form_submit')[];
}

/** Structured result from pipeline dispatch */
export interface ActionResult {
    success: boolean;
    stepResults: StepResult[];
    error?: string;
}

export interface StepResult {
    actionId: string;
    success: boolean;
    data?: unknown;
    error?: string;
    durationMs: number;
}

// -------------------- STYLE TOKENS --------------------

/** Style token map: CSS property → design token path */
export interface StyleTokenMap {
    [cssProp: string]: string;
}

/** Responsive style overrides (safe properties only) */
export interface ResponsiveStyleOverrides {
    base?: SafeCSSProperties;
    sm?: SafeCSSProperties;
    md?: SafeCSSProperties;
    lg?: SafeCSSProperties;
    xl?: SafeCSSProperties;
    hover?: SafeCSSProperties;
    focus?: SafeCSSProperties;
    active?: SafeCSSProperties;
}

/** Safe CSS properties — a restricted subset */
export type SafeCSSProperties = Record<string, string | number>;

// -------------------- DESIGN TOKENS --------------------

/** Design token definitions for a theme */
export interface DesignTokenMap {
    colors: Record<string, string>;
    spacing: Record<string, string>;
    typography: Record<string, TypographyToken>;
    radii: Record<string, string>;
    shadows: Record<string, string>;
    custom?: Record<string, string>;
}

export interface TypographyToken {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing?: string;
}

// -------------------- COMPONENT CONTRACT --------------------

/**
 * ComponentContract — the V2 replacement for ComponentDefinition.
 * Declares the full contract for a registered component.
 */
export interface ComponentContract {
    type: string;
    displayName: string;
    category: ComponentCategory;
    icon?: string;
    contractVersion: number;
    propsSchema: unknown;
    /** Inspector controls — required. Empty Record means "use generic fallback" */
    controls: Record<string, ControlDefinition>;
    /** Binding slots: which props can be bound to data */
    bindingSlots: Record<string, BindingSlotDefinition>;
    /** Event slots: which events can trigger action pipelines */
    eventSlots: string[];
    constraints: ComponentConstraints;
    requiredCapabilities?: ComponentCapability[];
    renderMode: 'ssr' | 'csr' | 'hybrid';
    defaults: ComponentDefaults;
    /** Preview hints for the canvas (placeholder image, min-size, etc.) */
    previewHints?: PreviewHints;
}

export interface BindingSlotDefinition {
    expectedType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
    description?: string;
    suggestedPath?: string;
}

export interface PreviewHints {
    minWidth?: number;
    minHeight?: number;
    placeholderImage?: string;
    showPlaceholder?: boolean;
}

export type ComponentCapability =
    | 'cart' | 'user' | 'collection' | 'product'
    | 'orders' | 'facets' | 'checkout' | 'auth';

export interface ComponentDefaults {
    props: Record<string, unknown>;
    styleTokens?: StyleTokenMap;
    styleOverrides?: ResponsiveStyleOverrides;
    bindingMap?: Record<string, BindingExpr>;
    actionMap?: Record<string, ActionPipeline>;
    children?: StorefrontNode[];
}

// -------------------- PREFAB V2 --------------------

/** V2 Prefab definition with versioning and slots */
export interface PrefabDefinition {
    key: string;
    version: string;
    displayName: string;
    description?: string;
    category: ComponentCategory;
    tree: StorefrontNode;
    slots?: PrefabSlot[];
    overrideSchema?: PrefabOverrideSchema;
    changelog?: PrefabChangelogEntry[];
    maxRecursionDepth?: number;
}

export interface PrefabSlot {
    name: string;
    targetNodeId: string;
    allowedTypes?: string[];
    description?: string;
}

export interface PrefabOverrideSchema {
    allowedNodes: string[];
    allowedProps?: Record<string, string[]>;
    allowStyleOverrides?: Record<string, boolean>;
    allowBindingOverrides?: Record<string, boolean>;
    allowActionOverrides?: Record<string, boolean>;
}

export interface PrefabChangelogEntry {
    version: string;
    date: string;
    changes: string[];
}

// -------------------- ROUTING --------------------

/** Route manifest — maps URLs to pages for a store */
export interface RouteManifest {
    schemaVersion: number;
    routes: RouteEntry[];
    redirects?: RedirectEntry[];
    notFoundPage?: string;
}

export type RouteEntry = StaticRoute | DynamicRoute | TemplateRoute;

export interface StaticRoute {
    kind: 'static';
    path: string;
    pageKey: string;
    layoutKey?: string;
    dataProfileId?: string;
}

export interface DynamicRoute {
    kind: 'dynamic';
    pattern: string;
    pageKey: string;
    layoutKey?: string;
    dataProfileId: string;
}

export interface TemplateRoute {
    kind: 'template';
    pattern: string;
    templateRules: TemplateRule[];
    layoutKey?: string;
    dataProfileId: string;
}

export interface TemplateRule {
    priority: number;
    match: TemplateMatchCondition;
    templateKey: string;
}

export type TemplateMatchCondition =
    | { field: 'productType'; operator: 'eq' | 'in'; value: string | string[] }
    | { field: 'tag'; operator: 'contains' | 'in'; value: string | string[] }
    | { field: 'vendor'; operator: 'eq' | 'in'; value: string | string[] }
    | { field: 'categoryId'; operator: 'eq'; value: string }
    | { field: 'default'; operator: 'always' };

export interface RedirectEntry {
    from: string;
    to: string;
    permanent: boolean;
}

// -------------------- DATA PROFILE --------------------

/** Data profile — defines what data a page needs */
export interface DataProfile {
    id: string;
    displayName: string;
    sources: DataSource[];
}

export type DataSource =
    | CollectionByHandleSource
    | CollectionByTagSource
    | ProductByHandleSource
    | StaticPageSource
    | OrdersSource;

export interface CollectionByHandleSource {
    kind: 'CollectionByHandle';
    handleParam: string;
    contextKey: 'collection';
    pageSize?: number;
    includeFacets?: boolean;
}

export interface CollectionByTagSource {
    kind: 'CollectionByTag';
    tag: string;
    contextKey: 'collection';
    pageSize?: number;
}

export interface ProductByHandleSource {
    kind: 'ProductByHandle';
    handleParam: string;
    contextKey: 'product';
    includeSimilar?: boolean;
}

export interface StaticPageSource {
    kind: 'StaticPage';
}

export interface OrdersSource {
    kind: 'Orders';
    contextKey: 'orders';
    pageSize?: number;
}

// -------------------- PUBLISH SNAPSHOT --------------------

/** Immutable publish snapshot */
export interface PublishSnapshot {
    id: string;
    storeId: string;
    publishedAt: string;
    schemaVersion: number;
    environment: 'draft' | 'staged' | 'published';
    documents: PublishedDocument[];
    routeManifest: RouteManifest;
    dataProfiles: Record<string, DataProfile>;
    theme: ThemeDocument;
    prefabs: Record<string, PrefabDefinition>;
    registryVersion: string;
    validationReport: PublishValidationReport;
    previousSnapshotId?: string;
}

export interface PublishedDocument {
    kind: string;
    key: string;
    tree: StorefrontNode;
}

export interface ThemeDocument {
    tokens: DesignTokenMap;
    customFonts?: string[];
}

export interface PublishValidationReport {
    valid: boolean;
    timestamp: string;
    checks: PublishValidationCheck[];
}

export interface PublishValidationCheck {
    name: string;
    passed: boolean;
    details?: string;
}

// -------------------- EDITOR COMMAND --------------------

/** Editor command types for the command bus */
export type EditorCommand =
    | { type: 'INSERT_NODE'; parentId: string; index: number; node: StorefrontNode }
    | { type: 'REMOVE_NODE'; nodeId: string }
    | { type: 'MOVE_NODE'; nodeId: string; newParentId: string; newIndex: number }
    | { type: 'UPDATE_PROPS'; nodeId: string; props: Partial<Record<string, unknown>> }
    | { type: 'UPDATE_BINDINGS'; nodeId: string; bindingMap: Record<string, BindingExpr> }
    | { type: 'UPDATE_STYLE_TOKENS'; nodeId: string; tokens: StyleTokenMap }
    | { type: 'UPDATE_STYLE_OVERRIDES'; nodeId: string; overrides: ResponsiveStyleOverrides }
    | { type: 'UPDATE_ACTIONS'; nodeId: string; actionMap: Record<string, ActionPipeline> }
    | { type: 'SET_HIDDEN'; nodeId: string; hidden: boolean }
    | { type: 'UPDATE_PREFAB_OVERRIDE'; instanceNodeId: string; childId: string; override: Partial<PrefabOverrides[string]> }
    | { type: 'DETACH_PREFAB'; instanceNodeId: string }
    | { type: 'BATCH'; commands: EditorCommand[] };

export interface CommandResult {
    success: boolean;
    snapshot: StorefrontNode;
    inverse: EditorCommand;
    warnings?: string[];
}
