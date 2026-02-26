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

import type { ComponentDefinition, ComponentContract } from '@/types/storefront-builder';

// The registry
const registry: ComponentRegistry = new Map();
const definitions: Map<string, ComponentDefinition> = new Map();
const contracts: Map<string, ComponentContract> = new Map();

/**
 * Register a component (V1 — ComponentDefinition)
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
 * Register a component with a V2 contract.
 * Validates and defaults required contract fields.
 */
export function registerComponentV2(
    type: string,
    component: ComponentType<BaseComponentProps & Record<string, unknown>>,
    contract: ComponentContract
) {
    // Validate and default required fields
    if (!contract.controls) contract.controls = {};
    if (!contract.bindingSlots) contract.bindingSlots = {};
    if (!contract.eventSlots) contract.eventSlots = [];

    registry.set(type, component);
    contracts.set(type, contract);
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
 * Get a component definition (V1)
 */
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
    return definitions.get(type);
}

/**
 * Get a component contract (V2)
 */
export function getComponentContract(type: string): ComponentContract | undefined {
    return contracts.get(type);
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
 * Get the full contract registry (V2)
 */
export function getContractRegistry(): Map<string, ComponentContract> {
    return contracts;
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
