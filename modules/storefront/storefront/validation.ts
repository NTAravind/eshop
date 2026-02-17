import type { StorefrontNode, ValidationResult } from '@/types/storefront-builder';
import { validateBindingPath } from './bindings';
import { validateStyleObject } from './styles';

// Component types from registry (will be populated)
const VALID_COMPONENT_TYPES = new Set([
    // Layout
    'Container', 'Row', 'Column', 'Section', 'Grid', 'Flex', 'Spacer', 'Divider',
    // Navigation
    'Header', 'Footer', 'Navbar', 'NavItem', 'NavMenu', 'Breadcrumb', 'Link',
    // Content
    'Text', 'Heading', 'Image', 'Video', 'Icon', 'Badge', 'Avatar',
    // Commerce
    'ProductCard', 'ProductGrid', 'ProductDetails', 'VariantSelector', 'PriceDisplay',
    'AddToCartButton', 'BuyNowButton', 'QuantitySelector', 'CartSidebar', 'CartItem',
    'SimilarProducts', 'CollectionFilters', 'CollectionSort',
    // Auth
    'LoginForm', 'SignupForm', 'UserMenu', 'ProfileCard',
    // Checkout
    'CheckoutForm', 'DeliveryModeSelector', 'OrderSummary', 'PaymentMethods',
    // Orders
    'OrderList', 'OrderCard', 'OrderDetails', 'OrderTimeline',
    // Forms
    'Input', 'Select', 'Checkbox', 'RadioGroup', 'Textarea', 'Button', 'Form',
    // Utility
    'Repeater', 'Conditional', 'Slot', 'PrefabInstance',
]);

/**
 * Generate a unique node ID
 */
export function generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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

/**
 * Find a node by type in the tree
 */
export function findNodeByType(tree: StorefrontNode, type: string): StorefrontNode | null {
    if (tree.type === type) {
        return tree;
    }

    if (tree.children) {
        for (const child of tree.children) {
            const found = findNodeByType(child, type);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(tree: StorefrontNode, id: string): StorefrontNode | null {
    if (tree.id === id) {
        return tree;
    }

    if (tree.children) {
        for (const child of tree.children) {
            const found = findNodeById(child, id);
            if (found) {
                return found;
            }
        }
    }

    return null;
}

/**
 * Get the path to a node in the tree (array of indices)
 */
export function getNodePath(tree: StorefrontNode, id: string): number[] | null {
    if (tree.id === id) {
        return [];
    }

    if (tree.children) {
        for (let i = 0; i < tree.children.length; i++) {
            const childPath = getNodePath(tree.children[i], id);
            if (childPath !== null) {
                return [i, ...childPath];
            }
        }
    }

    return null;
}

/**
 * Get a node's parent
 */
export function getParentNode(tree: StorefrontNode, id: string): StorefrontNode | null {
    if (!tree.children) return null;

    for (const child of tree.children) {
        if (child.id === id) {
            return tree;
        }
        const found = getParentNode(child, id);
        if (found) return found;
    }

    return null;
}

/**
 * Deep clone a node tree
 */
export function cloneNode(node: StorefrontNode): StorefrontNode {
    return JSON.parse(JSON.stringify(node));
}

/**
 * Update a node in the tree (immutably)
 */
export function updateNode(
    tree: StorefrontNode,
    id: string,
    updater: (node: StorefrontNode) => StorefrontNode
): StorefrontNode {
    if (tree.id === id) {
        return updater(tree);
    }

    if (!tree.children) {
        return tree;
    }

    return {
        ...tree,
        children: tree.children.map(child => updateNode(child, id, updater)),
    };
}

/**
 * Delete a node from the tree (immutably)
 */
export function deleteNode(tree: StorefrontNode, id: string): StorefrontNode {
    if (tree.id === id) {
        throw new Error('Cannot delete root node');
    }

    if (!tree.children) {
        return tree;
    }

    return {
        ...tree,
        children: tree.children
            .filter(child => child.id !== id)
            .map(child => deleteNode(child, id)),
    };
}

/**
 * Insert a node as a child of another node (immutably)
 */
export function insertNode(
    tree: StorefrontNode,
    parentId: string,
    node: StorefrontNode,
    index?: number
): StorefrontNode {
    return updateNode(tree, parentId, (parent) => {
        const children = parent.children ? [...parent.children] : [];
        const insertIndex = index !== undefined ? index : children.length;
        children.splice(insertIndex, 0, node);
        return { ...parent, children };
    });
}

/**
 * Move a node within the tree (immutably)
 */
export function moveNode(
    tree: StorefrontNode,
    nodeId: string,
    newParentId: string,
    index?: number
): StorefrontNode {
    // Find the node to move
    const nodeToMove = findNodeById(tree, nodeId);
    if (!nodeToMove) {
        throw new Error(`Node ${nodeId} not found`);
    }

    // Remove from current position
    let newTree = deleteNode(tree, nodeId);

    // Insert at new position
    newTree = insertNode(newTree, newParentId, nodeToMove, index);

    return newTree;
}
