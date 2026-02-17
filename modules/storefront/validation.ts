import type { StorefrontNode, ValidationResult } from '@/types/storefront-builder';
import { validateBindingPath } from './bindings';
import { validateStyleObject } from './styles';

// Re-export tree utilities from the shared module so existing consumers don't break.
export {
    generateNodeId,
    findNodeById,
    findNodeByType,
    getNodePath,
    getNodeAtPath,
    getParentNode,
    cloneNode,
    cloneNodeWithNewIds,
    updateNodeImmutable as updateNode,
    deleteNodeImmutable as deleteNode,
    insertNodeImmutable as insertNode,
    moveNodeImmutable as moveNode,
} from '@/shared/utils/tree';

// Import locally for use inside this file
import { findNodeByType } from '@/shared/utils/tree';

// Component types from registry (will be populated)
const VALID_COMPONENT_TYPES = new Set([
    // Layout
    'Container', 'Row', 'Column', 'Section', 'Grid', 'Flex', 'Spacer', 'Divider', 'Header', 'Footer', 'Slot',
    // Navigation
    'Navbar', 'NavItem', 'NavMenu', 'Breadcrumb', 'Link', 'CollectionFilters', 'CollectionSort', 'NavFilterMenu',
    // Content
    'Text', 'Heading', 'Image', 'Video', 'Icon', 'Badge', 'Avatar',
    // Commerce
    'ProductCard', 'ProductGrid', 'ProductDetails', 'VariantSelector', 'PriceDisplay',
    'AddToCartButton', 'BuyNowButton', 'QuantitySelector', 'CartSidebar', 'CartItem', 'CartItemCard',
    'SimilarProducts',
    // Auth
    'LoginForm', 'SignupForm', 'UserMenu', 'ProfileCard', 'OAuthButtons', 'UserProfileForm',
    // Checkout
    'CheckoutForm', 'DeliveryModeSelector', 'OrderSummary', 'PaymentMethods', 'PlaceOrderButton',
    // Orders
    'OrderList', 'OrderCard', 'OrderDetails', 'OrderTimeline',
    // Forms
    'Input', 'Select', 'Checkbox', 'RadioGroup', 'Textarea', 'Button', 'Form',
    // Filters
    'filter-menu',
    // Utility
    'Repeater', 'Conditional', 'PrefabInstance',
]);

/**
 * Validate a single node
 */
function validateNode(
    node: StorefrontNode,
    path: string,
    errors: string[]
): void {
    // Check ID
    if (!node.id || typeof node.id !== 'string') {
        errors.push(`${path}: Node must have a valid string ID`);
    }

    // Check type
    if (!node.type || typeof node.type !== 'string') {
        errors.push(`${path}: Node must have a valid type`);
    } else if (!VALID_COMPONENT_TYPES.has(node.type)) {
        errors.push(`${path}: Unknown component type "${node.type}"`);
    }

    // Check props
    if (node.props && typeof node.props !== 'object') {
        errors.push(`${path}: Props must be an object`);
    }

    // Validate bindings
    if (node.bindings) {
        for (const [key, bindingPath] of Object.entries(node.bindings)) {
            if (typeof bindingPath !== 'string') {
                errors.push(`${path}.bindings.${key}: Binding must be a string path`);
                continue;
            }
            const validation = validateBindingPath(bindingPath);
            if (!validation.valid) {
                errors.push(`${path}.bindings.${key}: ${validation.error}`);
            }
        }
    }

    // Validate styles
    if (node.styles) {
        const styleValidation = validateStyleObject(node.styles);
        if (!styleValidation.valid) {
            for (const error of styleValidation.errors) {
                errors.push(`${path}.styles: ${error}`);
            }
        }
    }

    // Validate actions
    if (node.actions) {
        for (const [slot, action] of Object.entries(node.actions)) {
            if (!action.actionId || typeof action.actionId !== 'string') {
                errors.push(`${path}.actions.${slot}: Action must have a valid actionId`);
            }
            if (action.payloadBindings) {
                for (const [key, bp] of Object.entries(action.payloadBindings)) {
                    const validation = validateBindingPath(bp);
                    if (!validation.valid) {
                        errors.push(`${path}.actions.${slot}.payloadBindings.${key}: ${validation.error}`);
                    }
                }
            }
        }
    }

    // Validate children recursively
    if (node.children) {
        if (!Array.isArray(node.children)) {
            errors.push(`${path}.children: Children must be an array`);
        } else {
            node.children.forEach((child, index) => {
                validateNode(child, `${path}.children[${index}]`, errors);
            });
        }
    }
}

/**
 * Validate a document tree
 */
export function validateDocument(
    tree: StorefrontNode,
    kind?: 'LAYOUT' | 'PAGE' | 'TEMPLATE' | 'PREFAB'
): ValidationResult {
    const errors: string[] = [];

    // Basic tree validation
    if (!tree || typeof tree !== 'object') {
        return { valid: false, errors: ['Document tree must be an object'] };
    }

    // Validate root node
    validateNode(tree, 'root', errors);

    // Kind-specific validation
    if (kind === 'LAYOUT') {
        // Layout must have a Slot for page content
        const hasSlot = findNodeByType(tree, 'Slot');
        if (!hasSlot) {
            errors.push('Layout documents must contain a Slot component for page content');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
