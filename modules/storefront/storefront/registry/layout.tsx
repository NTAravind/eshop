/**
 * Layout primitive components for the storefront
 * These are basic building blocks for layout construction
 */

'use client';

import React from 'react';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';
import { cn } from '@/lib/utils';

// ==================== Container ====================
interface ContainerProps extends BaseComponentProps {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

function Container({ children, style, className, maxWidth = 'xl', ...rest }: ContainerProps) {
    const maxWidthClassMap = {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full',
    };

    return (
        <div
            className={cn(
                'w-full mx-auto px-4',
                maxWidthClassMap[maxWidth],
                className
            )}
            style={style}
            {...rest}
        >
            {children}
        </div>
    );
}

// ==================== Section ====================
interface SectionProps extends BaseComponentProps {
    as?: 'section' | 'div' | 'article' | 'main' | 'aside';
}

function Section({ children, style, className, as: Component = 'section', ...rest }: SectionProps) {
    return (
        <Component style={style} className={className} {...rest}>
            {children}
        </Component>
    );
}

// ==================== Row ====================
interface RowProps extends BaseComponentProps {
    gap?: string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: boolean;
}

function Row({
    children,
    style,
    className,
    gap = '1rem',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    ...rest
}: RowProps) {
    const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    const justifyMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        between: 'space-between',
        around: 'space-around',
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                gap,
                alignItems: alignMap[align],
                justifyContent: justifyMap[justify],
                flexWrap: wrap ? 'wrap' : 'nowrap',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {children}
        </div>
    );
}

// ==================== Column ====================
interface ColumnProps extends BaseComponentProps {
    gap?: string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

function Column({
    children,
    style,
    className,
    gap = '1rem',
    align = 'stretch',
    justify = 'start',
    ...rest
}: ColumnProps) {
    const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    const justifyMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        between: 'space-between',
        around: 'space-around',
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap,
                alignItems: alignMap[align],
                justifyContent: justifyMap[justify],
                ...style,
            }}
            className={className}
            {...rest}
        >
            {children}
        </div>
    );
}

// ==================== Grid ====================
interface GridProps extends BaseComponentProps {
    columns?: number | string;
    gap?: string;
}

function Grid({ children, style, className, columns = 3, gap = '1rem', ...rest }: GridProps) {
    const templateColumns = typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: templateColumns,
                gap,
                ...style,
            }}
            className={className}
            {...rest}
        >
            {children}
        </div>
    );
}

// ==================== Flex ====================
interface FlexProps extends BaseComponentProps {
    direction?: 'row' | 'column';
    gap?: string;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: boolean;
}

function Flex({
    children,
    style,
    className,
    direction = 'row',
    gap = '0',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    ...rest
}: FlexProps) {
    const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
    const justifyMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        between: 'space-between',
        around: 'space-around',
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction,
                gap,
                alignItems: alignMap[align],
                justifyContent: justifyMap[justify],
                flexWrap: wrap ? 'wrap' : 'nowrap',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {children}
        </div>
    );
}

// ==================== Spacer ====================
interface SpacerProps extends BaseComponentProps {
    size?: string;
}

function Spacer({ style, size = '1rem', ...rest }: SpacerProps) {
    return (
        <div
            style={{
                height: size,
                width: size,
                flexShrink: 0,
                ...style,
            }}
            {...rest}
        />
    );
}

// ==================== Divider ====================
interface DividerProps extends BaseComponentProps {
    orientation?: 'horizontal' | 'vertical';
}

function Divider({ style, className, orientation = 'horizontal', ...rest }: DividerProps) {
    const isHorizontal = orientation === 'horizontal';

    return (
        <hr
            style={{
                border: 'none',
                backgroundColor: 'var(--border)',
                ...(isHorizontal
                    ? { height: '1px', width: '100%' }
                    : { width: '1px', height: '100%', alignSelf: 'stretch' }),
                ...style,
            }}
            className={className}
            {...rest}
        />
    );
}

// ==================== Slot ====================
// Slot is a placeholder component used in layouts
function Slot({ children, ...rest }: BaseComponentProps) {
    return <>{children}</>;
}

// ==================== Header ====================
function Header({ children, style, className, ...rest }: BaseComponentProps) {
    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backgroundColor: 'var(--background)',
                borderBottom: '1px solid var(--border)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {children}
        </header>
    );
}

// ==================== Footer ====================
interface FooterProps extends BaseComponentProps {
    copyright?: string;
    storeName?: string;
}

function Footer({ children, style, className, copyright, storeName, ...rest }: FooterProps) {
    return (
        <footer
            style={{
                padding: '2rem',
                backgroundColor: 'var(--muted)',
                borderTop: '1px solid var(--border)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {children}
            {copyright && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                    {copyright.replace('Your Store', storeName || 'Your Store')}
                </p>
            )}
        </footer>
    );
}

// Register all layout components
export function registerLayoutComponents() {
    registerComponent('Container', Container as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Container',
        displayName: 'Container',
        category: 'layout',
        icon: 'Box',
        propsSchema: {},
        controls: {
            maxWidth: {
                type: 'select',
                label: 'Max Width',
                options: ['sm', 'md', 'lg', 'xl', '2xl', 'full']
            },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { maxWidth: 'xl' },
            styles: { base: { padding: '1rem' } },
            children: [],
        },
    });

    registerComponent('Section', Section as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Section',
        displayName: 'Section',
        category: 'layout',
        icon: 'LayoutTemplate',
        propsSchema: {},
        controls: {
            as: {
                type: 'select',
                label: 'HTML Tag',
                options: ['section', 'div', 'article', 'main', 'aside']
            },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { as: 'section' },
            styles: { base: { padding: '2rem 0' } },
            children: [],
        },
    });

    registerComponent('Row', Row as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Row',
        displayName: 'Row',
        category: 'layout',
        icon: 'Rows',
        propsSchema: {},
        controls: {
            gap: { type: 'text', label: 'Gap' },
            align: {
                type: 'select',
                label: 'Align Items',
                options: ['start', 'center', 'end', 'stretch']
            },
            justify: {
                type: 'select',
                label: 'Justify Content',
                options: ['start', 'center', 'end', 'between', 'around']
            },
            wrap: { type: 'boolean', label: 'Wrap' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { gap: '1rem', align: 'stretch', justify: 'start' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Column', Column as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Column',
        displayName: 'Column',
        category: 'layout',
        icon: 'Columns',
        propsSchema: {},
        controls: {
            gap: { type: 'text', label: 'Gap' },
            align: {
                type: 'select',
                label: 'Align Items',
                options: ['start', 'center', 'end', 'stretch']
            },
            justify: {
                type: 'select',
                label: 'Justify Content',
                options: ['start', 'center', 'end', 'between', 'around']
            },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { gap: '1rem', align: 'stretch', justify: 'start' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Grid', Grid as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Grid',
        displayName: 'Grid',
        category: 'layout',
        icon: 'Grid3X3',
        propsSchema: {},
        controls: {
            columns: { type: 'number', label: 'Columns', defaultValue: 3, min: 1, max: 12 },
            gap: { type: 'text', label: 'Gap' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { columns: 3, gap: '1rem' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Flex', Flex as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Flex',
        displayName: 'Flex',
        category: 'layout',
        icon: 'Layout',
        propsSchema: {},
        controls: {
            direction: {
                type: 'select',
                label: 'Direction',
                options: ['row', 'column']
            },
            gap: { type: 'text', label: 'Gap' },
            align: {
                type: 'select',
                label: 'Align Items',
                options: ['start', 'center', 'end', 'stretch']
            },
            justify: {
                type: 'select',
                label: 'Justify Content',
                options: ['start', 'center', 'end', 'between', 'around']
            },
            wrap: { type: 'boolean', label: 'Wrap' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { direction: 'row', gap: '1rem' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Spacer', Spacer as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Spacer',
        displayName: 'Spacer',
        category: 'layout',
        icon: 'Maximize',
        propsSchema: {},
        controls: {
            size: { type: 'text', label: 'Size' },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: { size: '1rem' },
            styles: {},
        },
    });

    registerComponent('Divider', Divider as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Divider',
        displayName: 'Divider',
        category: 'layout',
        icon: 'Minus',
        propsSchema: {},
        controls: {
            orientation: {
                type: 'select',
                label: 'Orientation',
                options: ['horizontal', 'vertical']
            },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: { orientation: 'horizontal' },
            styles: { base: { margin: '1rem 0' } },
        },
    });

    registerComponent('Header', Header as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Header',
        displayName: 'Header',
        category: 'layout',
        icon: 'PanelTop',
        propsSchema: {},
        constraints: { canHaveChildren: true },
        defaults: {
            props: {},
            styles: { base: { height: '64px' } },
            children: [],
        },
    });

    registerComponent('Footer', Footer as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Footer',
        displayName: 'Footer',
        category: 'layout',
        icon: 'PanelBottom',
        propsSchema: {},
        controls: {
            copyright: { type: 'text', label: 'Copyright Text' },
            storeName: { type: 'text', label: 'Store Name Override' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { copyright: '© 2024 Your Store. All rights reserved.' },
            styles: { base: { padding: '2rem' } },
            children: [],
        },
    });
}
