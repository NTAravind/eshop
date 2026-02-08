/**
 * Initialize all components in the registry
 * This must be called before rendering any storefront pages
 */

'use client';

import { registerLayoutComponents } from './layout';
import { registerContentComponents } from './content';
import { registerCommerceComponents } from './commerce';
import { registerNavigationComponents } from './navigation';
import { registerFormComponents } from './forms';
import { registerFilterComponents } from './filters';

let initialized = false;

export function initializeRegistry() {
    if (initialized) return;

    registerLayoutComponents();
    registerContentComponents();
    registerCommerceComponents();
    registerNavigationComponents();
    registerFormComponents();
    registerFilterComponents();

    initialized = true;
}

// Re-export all component types and utilities
export * from './index';
