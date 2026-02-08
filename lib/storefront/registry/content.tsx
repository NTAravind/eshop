/**
 * Content components for text, images, and basic UI elements
 */

'use client';

import React from 'react';
import NextLink from 'next/link';
import NextImage from 'next/image';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';

// ==================== Text ====================
interface TextProps extends BaseComponentProps {
    text?: string;
    as?: 'p' | 'span' | 'div';
}

function Text({ text, children, style, className, as: Component = 'p', ...rest }: TextProps) {
    return (
        <Component style={style} className={className} {...rest}>
            {text || children}
        </Component>
    );
}

// ==================== Heading ====================
interface HeadingProps extends BaseComponentProps {
    text?: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
}

function Heading({ text, children, style, className, level = 2, ...rest }: HeadingProps) {
    const fontSizes = { 1: '2.5rem', 2: '2rem', 3: '1.75rem', 4: '1.5rem', 5: '1.25rem', 6: '1rem' };
    const headingStyle = { fontSize: fontSizes[level], fontWeight: 600, ...style };

    switch (level) {
        case 1:
            return <h1 style={headingStyle} className={className} {...rest}>{text || children}</h1>;
        case 3:
            return <h3 style={headingStyle} className={className} {...rest}>{text || children}</h3>;
        case 4:
            return <h4 style={headingStyle} className={className} {...rest}>{text || children}</h4>;
        case 5:
            return <h5 style={headingStyle} className={className} {...rest}>{text || children}</h5>;
        case 6:
            return <h6 style={headingStyle} className={className} {...rest}>{text || children}</h6>;
        default:
            return <h2 style={headingStyle} className={className} {...rest}>{text || children}</h2>;
    }
}

// ==================== Image ====================
interface ImageProps extends BaseComponentProps {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
}

function Image({
    src,
    alt = '',
    width = 400,
    height = 400,
    fill = false,
    priority = false,
    style,
    className,
    ...rest
}: ImageProps) {
    if (!src) {
        return (
            <div
                style={{
                    width: fill ? '100%' : width,
                    height: fill ? '100%' : height,
                    backgroundColor: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...style,
                }}
                className={className}
            >
                <span style={{ color: 'var(--muted-foreground)' }}>No image</span>
            </div>
        );
    }

    if (fill) {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
                <NextImage
                    src={src}
                    alt={alt}
                    fill
                    priority={priority}
                    style={{ objectFit: 'cover' }}
                    className={className}
                />
            </div>
        );
    }

    return (
        <NextImage
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            style={style}
            className={className}
        />
    );
}

// ==================== Link ====================
interface LinkProps extends BaseComponentProps {
    href?: string;
    text?: string;
    external?: boolean;
}

function Link({
    href = '#',
    text,
    children,
    external = false,
    style,
    className,
    ...rest
}: LinkProps) {
    const content = text || children;

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)', textDecoration: 'underline', ...style }}
                className={className}
                {...rest}
            >
                {content}
            </a>
        );
    }

    return (
        <NextLink
            href={href}
            style={{ color: 'var(--primary)', textDecoration: 'underline', ...style }}
            className={className}
            {...rest}
        >
            {content}
        </NextLink>
    );
}

// ==================== Button ====================
interface ButtonProps extends BaseComponentProps {
    text?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit';
}

function Button({
    text,
    children,
    variant = 'default',
    size = 'md',
    disabled = false,
    type = 'button',
    style,
    className,
    onClick,
    ...rest
}: ButtonProps) {
    const sizeStyles = {
        sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
        md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
        lg: { padding: '1rem 2rem', fontSize: '1.125rem' },
    };

    const variantStyles = {
        default: {
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
        },
        outline: {
            backgroundColor: 'transparent',
            color: 'var(--primary)',
            border: '1px solid var(--border)',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
            border: 'none',
        },
        destructive: {
            backgroundColor: 'var(--destructive)',
            color: 'var(--destructive-foreground)',
            border: 'none',
        },
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            style={{
                ...sizeStyles[size],
                ...variantStyles[variant],
                borderRadius: 'var(--radius)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontWeight: 500,
                ...style,
            }}
            className={className}
            {...rest}
        >
            {text || children}
        </button>
    );
}

// ==================== Badge ====================
interface BadgeProps extends BaseComponentProps {
    text?: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function Badge({
    text,
    children,
    variant = 'default',
    style,
    className,
    ...rest
}: BadgeProps) {
    const variantStyles = {
        default: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
        secondary: { backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' },
        outline: { backgroundColor: 'transparent', border: '1px solid var(--border)' },
        destructive: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' },
    };

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                ...variantStyles[variant],
                ...style,
            }}
            className={className}
            {...rest}
        >
            {text || children}
        </span>
    );
}

// ==================== Icon ====================
interface IconProps extends BaseComponentProps {
    name?: string;
    size?: number;
}

function Icon({ name = 'circle', size = 24, style, className, ...rest }: IconProps) {
    // Placeholder for icon - in real implementation would use lucide-react
    return (
        <span
            style={{
                display: 'inline-flex',
                width: size,
                height: size,
                alignItems: 'center',
                justifyContent: 'center',
                ...style,
            }}
            className={className}
            {...rest}
        >
            ●
        </span>
    );
}

// Register all content components
export function registerContentComponents() {
    registerComponent('Text', Text as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Text',
        displayName: 'Text',
        category: 'content',
        icon: 'Type',
        propsSchema: {},
        controls: {
            text: { type: 'textarea', label: 'Content' },
            as: { type: 'select', label: 'HTML Tag', options: ['p', 'span', 'div'] },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { text: 'Lorem ipsum dolor sit amet' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Heading', Heading as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Heading',
        displayName: 'Heading',
        category: 'content',
        icon: 'Type',
        propsSchema: {},
        controls: {
            text: { type: 'textarea', label: 'Content' },
            level: { type: 'select', label: 'Level', options: ['1', '2', '3', '4', '5', '6'].map(v => ({ label: `H${v}`, value: v })) },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { text: 'Heading', level: 2 },
            styles: {},
            children: [],
        },
    });

    registerComponent('Image', Image as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Image',
        displayName: 'Image',
        category: 'content',
        icon: 'Image',
        propsSchema: {},
        controls: {
            src: { type: 'image', label: 'Source' },
            alt: { type: 'text', label: 'Alt Text' },
            width: { type: 'number', label: 'Width' },
            height: { type: 'number', label: 'Height' },
            fill: { type: 'boolean', label: 'Fill Container' },
            priority: { type: 'boolean', label: 'Priority Loading' },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: { width: 400, height: 400 },
            styles: {},
        },
    });

    registerComponent('Link', Link as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Link',
        displayName: 'Link',
        category: 'content',
        icon: 'Link',
        propsSchema: {},
        controls: {
            text: { type: 'text', label: 'Text' },
            href: { type: 'text', label: 'URL' },
            external: { type: 'boolean', label: 'External Link' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { href: '#', text: 'Link Text' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Button', Button as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Button',
        displayName: 'Button',
        category: 'content',
        icon: 'Box',
        propsSchema: {},
        controls: {
            text: { type: 'text', label: 'Label' },
            variant: { type: 'select', label: 'Variant', options: ['default', 'outline', 'ghost', 'destructive'] },
            size: { type: 'select', label: 'Size', options: ['sm', 'md', 'lg'] },
            disabled: { type: 'boolean', label: 'Disabled' },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { text: 'Button' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Badge', Badge as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Badge',
        displayName: 'Badge',
        category: 'content',
        icon: 'Tag',
        propsSchema: {},
        controls: {
            text: { type: 'text', label: 'Label' },
            variant: { type: 'select', label: 'Variant', options: ['default', 'secondary', 'outline', 'destructive'] },
        },
        constraints: { canHaveChildren: true },
        defaults: {
            props: { text: 'Badge' },
            styles: {},
            children: [],
        },
    });

    registerComponent('Icon', Icon as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'Icon',
        displayName: 'Icon',
        category: 'content',
        icon: 'Circle',
        propsSchema: {},
        controls: {
            name: { type: 'icon', label: 'Icon Name' },
            size: { type: 'number', label: 'Size' },
        },
        constraints: { canHaveChildren: false },
        defaults: {
            props: { name: 'circle', size: 24 },
            styles: {},
        },
    });
}
