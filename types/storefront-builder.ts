import type { CSSProperties } from 'react';

// ==================== CORE NODE TYPES ====================

/**
 * StorefrontNode - JSON tree node for documents
 */
export interface StorefrontNode {
    id: string;
    type: string;
    props: Record<string, unknown>;
    styles?: StyleObject;
    bindings?: Record<string, string>;
    actions?: Record<string, ActionRef>;
    children?: StorefrontNode[];
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

// ==================== ACTION TYPES ====================

/**
 * Action IDs - all supported declarative actions
 */
export type ActionID =
    | 'ADD_TO_CART'
    | 'REMOVE_FROM_CART'
    | 'UPDATE_QUANTITY'
    | 'BUY_NOW'
    | 'APPLY_COUPON'
    | 'REMOVE_COUPON'
    | 'GO_TO_CHECKOUT'
    | 'PLACE_ORDER'  // New action for checkout
    | 'UPDATE_UI_STATE'
    | 'SUBMIT_FORM';

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
    requirePhoneNumber: boolean;
    logoUrl?: string;
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
    images: ImageContext[];
    variants: VariantContext[];
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
}

export interface FacetValueContext {
    id: string;
    value: string;
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
        styles?: StyleObject;
        bindings?: Record<string, string>;
        actions?: Record<string, ActionRef>;
        children?: StorefrontNode[];
    };
}

export type ControlType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'icon' | 'style-select';

export interface ControlDefinition {
    type: ControlType;
    label?: string;
    options?: { label: string; value: string }[] | string[];
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
