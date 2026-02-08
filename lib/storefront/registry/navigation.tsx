/**
 * Navigation components for header, navbar, breadcrumbs, etc.
 */

'use client';

import React from 'react';
import NextLink from 'next/link';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';

// ==================== Navbar ====================
import { useRuntimeContext } from '../runtime/context';

interface NavbarProps extends BaseComponentProps {
    storeName?: string;
    logoUrl?: string;
}

function Navbar({
    storeName = 'Store',
    logoUrl,
    children,
    style,
    className,
    ...rest
}: NavbarProps) {
    const { context } = useRuntimeContext();
    const slug = context.store.slug;
    const basePath = `/store/${slug}`;

    // Use store name from context if prop is default or missing
    const effectiveStoreName = (!storeName || storeName === 'Store') ? context.store.name : storeName;

    return (
        <nav
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            <NextLink href={basePath} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                {logoUrl ? (
                    <img src={logoUrl} alt={effectiveStoreName} style={{ height: '32px' }} />
                ) : (
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{effectiveStoreName}</span>
                )}
            </NextLink>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {children}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <NextLink href={`${basePath}/login`}>Account</NextLink>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    🛒
                </button>
            </div>
        </nav>
    );
}

// ==================== NavItem ====================
interface NavItemProps extends BaseComponentProps {
    href?: string;
    label?: string;
    active?: boolean;
}

function NavItem({
    href = '#',
    label,
    children,
    active = false,
    style,
    className,
    ...rest
}: NavItemProps) {
    const { context } = useRuntimeContext();
    const slug = context?.store?.slug;

    // Helper to resolve path
    const resolvePath = (path: string) => {
        if (path.startsWith('http')) return path;
        if (path.startsWith('#')) return path;
        if (!slug) return path; // Fallback

        // If already has /store/slug, leave it
        if (path.startsWith(`/store/${slug}`)) return path;

        // If starts with /, prepend store path
        if (path.startsWith('/')) {
            return `/store/${slug}${path}`;
        }
        return `/store/${slug}/${path}`;
    };

    const finalHref = resolvePath(href);

    return (
        <NextLink
            href={finalHref}
            style={{
                textDecoration: 'none',
                color: active ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: active ? 600 : 400,
                ...style,
            }}
            className={className}
            {...rest}
        >
            {label || children}
        </NextLink>
    );
}

// ==================== NavMenu ====================
interface NavMenuProps extends BaseComponentProps {
    items?: Array<{ label: string; href: string }>;
}

function NavMenu({ items = [], style, className, ...rest }: NavMenuProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {items.map((item, index) => (
                <NavItem key={index} href={item.href} label={item.label} />
            ))}
        </div>
    );
}

// ==================== Breadcrumb ====================
interface BreadcrumbProps extends BaseComponentProps {
    items?: Array<{ label: string; href?: string }>;
}

function Breadcrumb({ items = [], style, className, ...rest }: BreadcrumbProps) {
    const { context } = useRuntimeContext();
    const slug = context?.store?.slug;

    const resolvePath = (path?: string) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        if (path.startsWith('#')) return path;
        if (!slug) return path;
        if (path.startsWith(`/store/${slug}`)) return path;
        if (path.startsWith('/')) return `/store/${slug}${path}`;
        return `/store/${slug}/${path}`;
    };

    return (
        <nav
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span>/</span>}
                    {item.href ? (
                        <NextLink href={resolvePath(item.href) || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {item.label}
                        </NextLink>
                    ) : (
                        <span style={{ color: 'var(--foreground)' }}>{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}

// ==================== CollectionFilters ====================
interface FacetData {
    id: string;
    code: string;
    name: string;
    values: Array<{ id: string; value: string; count?: number }>;
}

interface CollectionFiltersProps extends BaseComponentProps {
    facets?: FacetData[];
    activeFilters?: Record<string, string[]>;
    onFilterChange?: (facetCode: string, values: string[]) => void;
}

function CollectionFilters({
    facets = [],
    activeFilters = {},
    onFilterChange,
    style,
    className,
    ...rest
}: CollectionFiltersProps) {
    const handleToggle = (facetCode: string, value: string) => {
        const current = activeFilters[facetCode] || [];
        const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        onFilterChange?.(facetCode, updated);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {facets.map((facet) => (
                <div key={facet.id}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{facet.name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {facet.values.map((value) => {
                            const isActive = activeFilters[facet.code]?.includes(value.value);
                            return (
                                <label
                                    key={value.id}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={() => handleToggle(facet.code, value.value)}
                                    />
                                    <span>{value.value}</span>
                                    {value.count !== undefined && (
                                        <span style={{ color: 'var(--muted-foreground)' }}>({value.count})</span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ==================== CollectionSort ====================
interface CollectionSortProps extends BaseComponentProps {
    value?: string;
    onChange?: (value: string) => void;
}

function CollectionSort({
    value = 'newest',
    onChange,
    style,
    className,
    ...rest
}: CollectionSortProps) {
    const options = [
        { value: 'newest', label: 'Newest' },
        { value: 'price-asc', label: 'Price: Low to High' },
        { value: 'price-desc', label: 'Price: High to Low' },
        { value: 'name-asc', label: 'Name: A-Z' },
    ];

    return (
        <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--background)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

// Register all navigation components
export function registerNavigationComponents() {
    registerComponent('Navbar', Navbar as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Navbar',
        displayName: 'Navbar',
        category: 'navigation',
        icon: 'Menu',
        propsSchema: {},
        controls: {
            storeName: { type: 'text', label: 'Store Name' },
            logoUrl: { type: 'image', label: 'Logo' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { storeName: 'My Store', logoUrl: '' },
            styles: {},
            children: [],
        },
    });

    registerComponent('NavItem', NavItem as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'NavItem',
        displayName: 'Link',
        category: 'navigation',
        icon: 'Link',
        propsSchema: {},
        controls: {
            label: { type: 'text', label: 'Label' },
            href: { type: 'text', label: 'URL' },
            active: { type: 'boolean', label: 'Active' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { label: 'Link', href: '#' },
            styles: {},
            children: [],
        },
    });

    registerComponent('NavMenu', NavMenu as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'NavMenu',
        displayName: 'Navigation Menu',
        category: 'navigation',
        icon: 'List',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {
                items: [
                    { label: 'Home', href: '/' },
                    { label: 'Products', href: '/products' },
                    { label: 'About', href: '/about' },
                ],
            },
            styles: {},
        },
    });

    registerComponent('Breadcrumb', Breadcrumb as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Breadcrumb',
        displayName: 'Breadcrumb',
        category: 'navigation',
        icon: 'ChevronsRight',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {
                items: [
                    { label: 'Home', href: '/' },
                    { label: 'Category', href: '#' },
                    { label: 'Product' },
                ],
            },
            styles: {},
        },
    });

    registerComponent('CollectionFilters', CollectionFilters as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CollectionFilters',
        displayName: 'Filters',
        category: 'navigation',
        icon: 'Filter',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('CollectionSort', CollectionSort as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CollectionSort',
        displayName: 'Sort',
        category: 'navigation',
        icon: 'ArrowUpDown',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });
}
