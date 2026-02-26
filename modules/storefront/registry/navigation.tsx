/**
 * Navigation components for header, navbar, breadcrumbs, etc.
 */

'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';

// ==================== Navbar ====================
import { useRuntimeContext } from '../runtime/context';

interface NavbarProps extends BaseComponentProps {
    storeName?: string;
    logoUrl?: string;
    logoPlacement?: 'left' | 'center' | 'right';
    accountLabel?: string;
    cartLabel?: string;
}

function Navbar({
    storeName = 'Store',
    logoUrl,
    logoPlacement = 'left',
    accountLabel = 'Account',
    cartLabel,
    children,
    style,
    className,
    ...rest
}: NavbarProps) {
    const { context, dispatch } = useRuntimeContext();
    const slug = context.store.slug;
    const basePath = `/store/${slug}`;

    // Use store name from context if prop is default or missing
    const effectiveStoreName = (!storeName || storeName === 'Store') ? context.store.name : storeName;

    const Logo = (
        <NextLink href={basePath} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
            {logoUrl ? (
                <img src={logoUrl} alt={effectiveStoreName} style={{ height: '32px' }} />
            ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{effectiveStoreName}</span>
            )}
        </NextLink>
    );

    const Menu = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, justifyContent: logoPlacement === 'center' ? 'flex-start' : 'center' }}>
            {children}
        </div>
    );

    const Actions = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NextLink href={`${basePath}/login`}>{accountLabel}</NextLink>
            <button
                onClick={() => dispatch({ actionId: 'OPEN_CART_SIDEBAR', payload: { open: true } }, context)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                {cartLabel ? <span>{cartLabel}</span> : <span style={{ fontSize: '1.25rem' }}>🛒</span>}
            </button>
        </div>
    );

    return (
        <nav
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2rem',
                gap: '1rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {logoPlacement === 'left' && (
                <>
                    {Logo}
                    {Menu}
                    {Actions}
                </>
            )}
            {logoPlacement === 'center' && (
                <>
                    {Menu}
                    {Logo}
                    {Actions}
                </>
            )}
            {logoPlacement === 'right' && (
                <>
                    {Menu}
                    {Actions}
                    {Logo}
                </>
            )}
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
    productSchemaId?: string;
    values: Array<{ id: string; value: string; count?: number }>;
}

interface CollectionFiltersProps extends BaseComponentProps {
    facets?: FacetData[];
    activeFilters?: Record<string, string[]>;
    productSchemaId?: string;
    onFilterChange?: (facetCode: string, values: string[]) => void;
}

function CollectionFilters({
    facets = [],
    activeFilters = {},
    productSchemaId,
    onFilterChange,
    style,
    className,
    ...rest
}: CollectionFiltersProps) {
    const { context, setUIState } = useRuntimeContext();
    const router = useRouter();

    const searchParams = context?.route?.searchParams || {};
    const contextFacets = context?.facets?.facets || [];
    const effectiveFacets = facets.length > 0 ? facets : contextFacets;
    const displayFacets = productSchemaId ? effectiveFacets.filter((f) => !(f as any).productSchemaId || (f as any).productSchemaId === productSchemaId) : effectiveFacets;
    const filtersFromQuery: Record<string, string[]> = {};

    displayFacets.forEach((facet) => {
        const raw = searchParams[facet.code];
        if (!raw) return;
        filtersFromQuery[facet.code] = Array.isArray(raw) ? raw : [raw];
    });

    const effectiveFilters = (Object.keys(activeFilters).length > 0
        ? activeFilters
        : (Object.keys(filtersFromQuery).length > 0
            ? filtersFromQuery
            : (context?.uiState?.activeFilters || {})));

    const handleToggle = (facetCode: string, value: string) => {
        const current = effectiveFilters[facetCode] || [];
        const updated = facetCode === 'schemaId'
            ? (current.includes(value) ? [] : [value])
            : (current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value]);

        const nextFilters = {
            ...effectiveFilters,
            [facetCode]: updated,
        };

        setUIState('activeFilters', nextFilters);
        onFilterChange?.(facetCode, updated);

        const params = new URLSearchParams();
        const reservedParams = new Set(['page', 'limit', 'q', 'category', 'schemaId']);
        const facetCodes = new Set(displayFacets.map((f) => f.code));

        Object.entries(searchParams).forEach(([key, val]) => {
            if (key === 'page') return;
            if (!reservedParams.has(key) && !facetCodes.has(key)) return;
            if (Array.isArray(val)) {
                val.forEach((v) => params.append(key, v));
            } else if (val) {
                params.append(key, val as string);
            }
        });

        params.delete(facetCode);
        updated.forEach((v) => params.append(facetCode, v));

        if (facetCode === 'schemaId') {
            effectiveFacets.forEach((facet) => {
                if (facet.code !== 'schemaId') {
                    params.delete(facet.code);
                }
            });
        }

        const pathname = context?.route?.pathname || '/collection';
        const queryString = params.toString();
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
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
            {displayFacets.map((facet) => (
                <div key={facet.id}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{facet.name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {facet.values.map((value) => {
                            const isActive = effectiveFilters[facet.code]?.includes(value.value);
                            const displayLabel = (value as any).label || value.value;
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
                                    <span>{displayLabel}</span>
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
            logoPlacement: {
                type: 'select',
                label: 'Logo Position',
                options: [
                    { label: 'Left', value: 'left' },
                    { label: 'Center', value: 'center' },
                    { label: 'Right', value: 'right' }
                ]
            },
            accountLabel: { type: 'text', label: 'Account Label', defaultValue: 'Account' },
            cartLabel: { type: 'text', label: 'Cart Label' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { storeName: 'My Store', logoUrl: '', logoPlacement: 'left', accountLabel: 'Account' },
            styleOverrides: {},
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
            styleOverrides: {},
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
            styleOverrides: {},
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
            styleOverrides: {},
        },
    });

    registerComponent('CollectionFilters', CollectionFilters as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CollectionFilters',
        displayName: 'Collection Filters',
        category: 'navigation',
        icon: 'Filter',
        propsSchema: {
            productSchemaId: { type: 'productSchema', label: 'Filter by Product Type' },
        },
        controls: {
            productSchemaId: { type: 'productSchema', label: 'Filter by Product Type' },
        },
        actionSlots: ['onFilterChange'],
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styleOverrides: {},
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
            styleOverrides: {},
        },
    });
}
