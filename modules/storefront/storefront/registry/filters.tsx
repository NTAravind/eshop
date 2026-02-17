'use client';

import React from 'react';
import { useRuntimeContext } from '../runtime/context';
import { useRouter } from 'next/navigation';

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
        if (checked) {
            if (!currentValues.includes(value)) {
                currentParams.append(code, value);
            }
        } else {
            const newValues = currentValues.filter(v => v !== value);
            currentParams.delete(code);
            newValues.forEach(v => currentParams.append(code, v));
        }

        // Reset page to 1
        currentParams.delete('page');

        router.push(`${context.route.pathname}?${currentParams.toString()}`);
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
                                            {val.value}
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

import { registerComponent } from './index';

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
}
