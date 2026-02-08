/**
 * Component registry for the storefront builder
 * Maps component types to their React implementations
 */

import type { ComponentType, ReactNode, CSSProperties } from 'react';

// Base props that all components receive
export interface BaseComponentProps {
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
    onClick?: () => void;
    'data-node-id'?: string;
}

// Component registry type
type ComponentRegistry = Map<string, ComponentType<BaseComponentProps & Record<string, unknown>>>;

import type { ComponentDefinition } from '@/types/storefront-builder';

// The registry
const registry: ComponentRegistry = new Map();
const definitions: Map<string, ComponentDefinition> = new Map();

/**
 * Register a component
 */
export function registerComponent(
    type: string,
    component: ComponentType<BaseComponentProps & Record<string, unknown>>,
    definition?: ComponentDefinition
) {
    registry.set(type, component);
    if (definition) {
        definitions.set(type, definition);
    }
}

/**
 * Get a component from the registry
 */
export function getComponent(
    type: string
): ComponentType<BaseComponentProps & Record<string, unknown>> | undefined {
    return registry.get(type);
}

/**
 * Get a component definition
 */
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
    return definitions.get(type);
}

/**
 * Get the full registry (components and definitions)
 */
export function getRegistry(): {
    components: Record<string, ComponentDefinition>;
    implementations: Record<string, ComponentType<BaseComponentProps & Record<string, unknown>>>;
} {
    return {
        components: Object.fromEntries(definitions),
        implementations: Object.fromEntries(registry),
    };
}

/**
 * Check if a component type is valid
 */
export function isValidComponent(type: string): boolean {
    return registry.has(type);
}

/**
 * Get all registered component types
 */
export function getComponentTypes(): string[] {
    return Array.from(registry.keys());
}
