'use client';

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRuntimeContext } from '../runtime/context';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface FilterMenuProps {
    title?: string;
    style?: React.CSSProperties;
    className?: string;
}

export function FilterMenu({ title = 'Filters', style, className }: FilterMenuProps) {
    const { context } = useRuntimeContext();
    const router = useRouter();
    const facets = context.facets?.facets || [];
    const searchParams = context.route.searchParams;

    if (facets.length === 0) {
        return null;
    }

    const handleFilterChange = (code: string, value: string, checked: boolean) => {
        const currentParams = new URLSearchParams();

        // Reconstruct params from context
        Object.entries(searchParams).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                val.forEach(v => currentParams.append(key, v));
            } else {
                currentParams.append(key, val as string);
            }
        });

        // Update specific filter
        const currentValues = currentParams.getAll(code);
        const isSchemaFilter = code === 'schemaId';
        const nextValues = isSchemaFilter
            ? (checked ? [value] : [])
            : (checked
                ? (currentValues.includes(value) ? currentValues : [...currentValues, value])
                : currentValues.filter(v => v !== value));

        currentParams.delete(code);
        nextValues.forEach(v => currentParams.append(code, v));

        if (isSchemaFilter) {
            facets.forEach((facet) => {
                if (facet.code !== 'schemaId') {
                    currentParams.delete(facet.code);
                }
            });
        }

        // Reset page to 1
        currentParams.delete('page');

        const queryString = currentParams.toString();
        router.push(queryString ? `${context.route.pathname}?${queryString}` : context.route.pathname);
    };

    return (
        <div style={style} className={`space-y-6 ${className || ''}`}>
            {title && <h3 className="font-semibold text-lg">{title}</h3>}

            {facets.map((facet) => {
                const currentValues = (searchParams[facet.code] || []);
                const selectedValues = Array.isArray(currentValues) ? currentValues : [currentValues];

                return (
                    <div key={facet.id} className="space-y-3">
                        <h4 className="font-medium text-sm">{facet.name}</h4>
                        <div className="space-y-2">
                            {facet.values.map((val) => {
                                const isChecked = selectedValues.includes(val.value);
                                const displayLabel = val.label || val.value;
                                return (
                                    <label key={val.id} className="flex items-center gap-2 text-sm cursor-pointer group">
                                        <div className={`
                                            w-4 h-4 rounded border flex items-center justify-center transition-colors
                                            ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background group-hover:border-primary'}
                                        `}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isChecked}
                                                onChange={(e) => handleFilterChange(facet.code, val.value, e.target.checked)}
                                            />
                                            {isChecked && (
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                            {displayLabel}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface NavFilterMenuProps extends BaseComponentProps {
    label?: string;
}

export function NavFilterMenu({ label = 'Filters', style, className }: NavFilterMenuProps) {
    const { context } = useRuntimeContext();
    const router = useRouter();
    const facets = context.facets?.facets || [];
    const searchParams = context.route.searchParams;
    const slug = context.store?.slug;

    if (facets.length === 0) {
        return null;
    }

    const collectionPath = slug ? `/store/${slug}/collection` : '/collection';
    const reservedParams = new Set(['page', 'limit', 'q', 'category', 'schemaId']);
    const facetCodes = new Set(facets.map((f) => f.code));

    const buildParams = () => {
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, val]) => {
            if (key === 'page') return;
            if (!reservedParams.has(key) && !facetCodes.has(key)) return;
            if (Array.isArray(val)) {
                val.forEach((v) => params.append(key, v));
            } else if (val) {
                params.append(key, val as string);
            }
        });
        return params;
    };

    const toggleFilter = (code: string, value: string) => {
        const params = buildParams();
        const currentValues = params.getAll(code);
        const nextValues = code === 'schemaId'
            ? (currentValues.includes(value) ? [] : [value])
            : (currentValues.includes(value)
                ? currentValues.filter((v) => v !== value)
                : [...currentValues, value]);

        params.delete(code);
        nextValues.forEach((v) => params.append(code, v));

        if (code === 'schemaId') {
            facets.forEach((facet) => {
                if (facet.code !== 'schemaId') {
                    params.delete(facet.code);
                }
            });
        }
        const queryString = params.toString();
        router.push(queryString ? `${collectionPath}?${queryString}` : collectionPath);
    };

    const getSelectedValues = (code: string) => {
        const raw = searchParams[code];
        if (!raw) return [] as string[];
        return Array.isArray(raw) ? raw : [raw];
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label={label}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '9999px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        ...style,
                    }}
                    className={className}
                >
                    {label}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
                {facets.map((facet, index) => {
                    const selectedValues = getSelectedValues(facet.code);
                    return (
                        <React.Fragment key={facet.id}>
                            {index > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuLabel>{facet.name}</DropdownMenuLabel>
                            {facet.values.map((val) => {
                                const isActive = selectedValues.includes(val.value);
                                const displayLabel = val.label || val.value;
                                return (
                                    <DropdownMenuItem
                                        key={val.id}
                                        onSelect={() => toggleFilter(facet.code, val.value)}
                                        className={isActive ? 'bg-accent text-accent-foreground' : undefined}
                                    >
                                        <span style={{ flex: 1 }}>{displayLabel}</span>
                                        {val.count !== undefined && (
                                            <span className="text-muted-foreground text-xs">({val.count})</span>
                                        )}
                                        {isActive && <span className="text-xs">✓</span>}
                                    </DropdownMenuItem>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function registerFilterComponents() {
    registerComponent('filter-menu', FilterMenu, {
        type: 'filter-menu',
        displayName: 'Filter Menu',
        category: 'commerce',
        icon: 'filter',
        propsSchema: {
            title: { type: 'string', label: 'Title' }
        },
        constraints: {
            canHaveChildren: false
        },
        defaults: {
            props: {
                title: 'Filters'
            }
        }
    });

    registerComponent('NavFilterMenu', NavFilterMenu as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'NavFilterMenu',
        displayName: 'Filter Menu (Nav)',
        category: 'navigation',
        icon: 'Filter',
        propsSchema: {},
        controls: {
            label: { type: 'text', label: 'Label', defaultValue: 'Filters' },
        },
        constraints: {
            canHaveChildren: false,
        },
        defaults: {
            props: { label: 'Filters' },
            styles: {},
        },
    });
}
