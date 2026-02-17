/**
 * Forms and checkout components
 */

'use client';

import React from 'react';
import type { BaseComponentProps } from './index';
import { registerComponent } from './index';
import type { CartItemContext, FieldConfig, UserContext } from '@/types/storefront-builder';
import { OAuthButtons } from './forms/OAuthButtons';
import { UserProfileForm } from './forms/UserProfileForm';

// ==================== LoginForm ====================
interface LoginFormProps extends BaseComponentProps {
    onSubmit?: () => void;
}

function LoginForm({ style, className, onSubmit, ...rest }: LoginFormProps) {
    return (
        <div
            style={{
                padding: '2rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>
                Sign In
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                    <input
                        type="email"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--background)',
                        }}
                        placeholder="you@example.com"
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                    <input
                        type="password"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--background)',
                        }}
                        placeholder="••••••••"
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    Sign In
                </button>
            </form>
        </div>
    );
}

// ==================== DeliveryModeSelector ====================
interface DeliveryModeSelectorProps extends BaseComponentProps {
    modes?: ('DELIVERY' | 'PICKUP')[];
    selected?: 'DELIVERY' | 'PICKUP';
    onChange?: (mode: 'DELIVERY' | 'PICKUP') => void;
}

function DeliveryModeSelector({
    modes = ['DELIVERY', 'PICKUP'],
    selected = 'DELIVERY',
    onChange,
    style,
    className,
    ...rest
}: DeliveryModeSelectorProps) {
    return (
        <div
            style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {modes.map((mode) => (
                <button
                    key={mode}
                    onClick={() => onChange?.(mode)}
                    style={{
                        flex: 1,
                        padding: '1rem',
                        border: selected === mode ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: selected === mode ? 'var(--primary)' : 'transparent',
                        color: selected === mode ? 'var(--primary-foreground)' : 'var(--foreground)',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    {mode === 'DELIVERY' ? '🚚 Delivery' : '🏪 Pickup'}
                </button>
            ))}
        </div>
    );
}

// ==================== CheckoutForm ====================
interface CheckoutFormProps extends BaseComponentProps {
    fields?: Record<string, FieldConfig>;
    user?: UserContext | null;
    requirePhone?: boolean;
    onSubmit?: () => void;
}

function CheckoutForm({
    fields = {},
    user,
    requirePhone = false,
    style,
    className,
    onSubmit,
    ...rest
}: CheckoutFormProps) {
    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 500,
    };

    return (
        <form
            id="checkout-form"
            onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
            style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {/* Contact Information */}
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={labelStyle as any}>Full Name *</label>
                    <input
                        type="text"
                        name="fullName"
                        defaultValue={user?.name || ''}
                        required
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle as any}>Email *</label>
                    <input
                        type="email"
                        name="email"
                        defaultValue={user?.email || ''}
                        required
                        style={inputStyle}
                    />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle as any}>
                        Phone {requirePhone && <span style={{ color: 'var(--destructive)' }}>*</span>}
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        defaultValue={user?.phone || ''}
                        required={requirePhone}
                        style={inputStyle}
                    />
                </div>
            </div>

            {/* Shipping Address */}
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', marginTop: '1.5rem' }}>Shipping Address</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle as any}>Street Address *</label>
                    <input
                        type="text"
                        name="shippingStreet"
                        required
                        placeholder="123 Main St, Apt 4B"
                        style={inputStyle}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle as any}>City *</label>
                        <input
                            type="text"
                            name="shippingCity"
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle as any}>State/Province *</label>
                        <input
                            type="text"
                            name="shippingState"
                            required
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle as any}>Postal Code *</label>
                        <input
                            type="text"
                            name="shippingPostal"
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle as any}>Country *</label>
                        <input
                            type="text"
                            name="shippingCountry"
                            required
                            defaultValue="India"
                            style={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Billing Address Toggle */}
            <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="sameAsBilling" defaultChecked />
                    <span>Billing address same as shipping</span>
                </label>
            </div>
        </form>
    );
}

// ==================== OrderSummary ====================
interface OrderSummaryProps extends BaseComponentProps {
    items?: CartItemContext[];
    subtotal?: number;
    total?: number;
    currency?: string;
}

function OrderSummary({
    items = [],
    subtotal = 0,
    total = 0,
    currency = 'USD',
    style,
    className,
    ...rest
}: OrderSummaryProps) {
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });

    return (
        <div
            style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Order Summary</h3>
            {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>{formatter.format(item.lineTotal)}</span>
                </div>
            ))}
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatter.format(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.5rem' }}>
                <span>Total</span>
                <span>{formatter.format(total)}</span>
            </div>
        </div>
    );
}

// ==================== PaymentMethods ====================
function PaymentMethods({ style, className, ...rest }: BaseComponentProps) {
    return (
        <div
            style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: '1.5rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Payment Method</h3>
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input type="radio" id="cod" name="payment" value="COD" defaultChecked />
                    <label htmlFor="cod" style={{ fontWeight: 500, cursor: 'pointer' }}>
                        💵 Cash on Delivery
                    </label>
                </div>
                <p style={{ marginTop: '0.5rem', marginLeft: '1.75rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                    Pay with cash when your order is delivered
                </p>
            </div>
        </div>
    );
}

// ==================== PlaceOrderButton ====================
interface PlaceOrderButtonProps extends BaseComponentProps {
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
}

function PlaceOrderButton({
    disabled = false,
    loading = false,
    onClick,
    style,
    className,
    ...rest
}: PlaceOrderButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: disabled || loading ? 'var(--muted)' : 'var(--primary)',
                color: disabled || loading ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: disabled || loading ? 0.6 : 1,
                ...style,
            }}
            className={className}
            {...rest}
        >
            {loading ? '⏳ Processing Order...' : '🛒 Place Order'}
        </button>
    );
}


// ==================== OrderList ====================
interface OrderData {
    id: string;
    status: string;
    total: number;
    createdAt: string;
}

interface OrderListProps extends BaseComponentProps {
    orders?: OrderData[];
    currency?: string;
}

function OrderList({
    orders = [],
    currency = 'USD',
    style,
    className,
    ...rest
}: OrderListProps) {
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency });

    if (orders.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)', ...style }} className={className} {...rest}>
                No orders yet
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                ...style,
            }}
            className={className}
            {...rest}
        >
            {orders.map((order) => (
                <div
                    key={order.id}
                    style={{
                        padding: '1rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <p style={{ fontWeight: 600 }}>Order #{order.id.slice(0, 8)}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 600 }}>{formatter.format(order.total)}</p>
                        <span
                            style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: order.status === 'COMPLETED' ? 'var(--primary)' : 'var(--muted)',
                                color: order.status === 'COMPLETED' ? 'var(--primary-foreground)' : 'var(--foreground)',
                            }}
                        >
                            {order.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ==================== ProfileCard ====================
interface ProfileCardProps extends BaseComponentProps {
    user?: UserContext | null;
    fields?: Record<string, FieldConfig>;
}

function ProfileCard({
    user,
    fields = {},
    style,
    className,
    ...rest
}: ProfileCardProps) {
    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', ...style }} className={className} {...rest}>
                Please sign in to view your profile
            </div>
        );
    }

    return (
        <div
            style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                ...style,
            }}
            className={className}
            {...rest}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                {user.image ? (
                    <img src={user.image} alt={user.name || 'User'} style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        👤
                    </div>
                )}
                <div>
                    <h3 style={{ fontWeight: 600 }}>{user.name || 'User'}</h3>
                    <p style={{ color: 'var(--muted-foreground)' }}>{user.email}</p>
                </div>
            </div>
            <button
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'var(--destructive)',
                    color: 'var(--destructive-foreground)',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                }}
            >
                Sign Out
            </button>
        </div>
    );
}

// Register all form components
export function registerFormComponents() {
    registerComponent('OAuthButtons', OAuthButtons as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'OAuthButtons',
        displayName: 'OAuth Login',
        category: 'forms',
        icon: 'Key',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { providers: ['google', 'instagram'] },
            styles: {},
        },
    });

    registerComponent('LoginForm', LoginForm as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'LoginForm',
        displayName: 'Login Form',
        category: 'forms',
        icon: 'User',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('DeliveryModeSelector', DeliveryModeSelector as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'DeliveryModeSelector',
        displayName: 'Delivery Mode',
        category: 'forms',
        icon: 'Truck',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { modes: ['DELIVERY', 'PICKUP'] },
            styles: {},
        },
    });

    registerComponent('CheckoutForm', CheckoutForm as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'CheckoutForm',
        displayName: 'Checkout Form',
        category: 'forms',
        icon: 'ClipboardList',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: { requirePhone: true },
            styles: {},
        },
    });

    registerComponent('OrderSummary', OrderSummary as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'OrderSummary',
        displayName: 'Order Summary',
        category: 'forms',
        icon: 'Receipt',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('PaymentMethods', PaymentMethods as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'PaymentMethods',
        displayName: 'Payment Methods',
        category: 'forms',
        icon: 'CreditCard',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('PlaceOrderButton', PlaceOrderButton as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'PlaceOrderButton',
        displayName: 'Place Order Button',
        category: 'forms',
        icon: 'ShoppingCart',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('OrderList', OrderList as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'OrderList',
        displayName: 'Order List',
        category: 'forms',
        icon: 'List',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('ProfileCard', ProfileCard as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'ProfileCard',
        displayName: 'Profile Card',
        category: 'forms',
        icon: 'User',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });

    registerComponent('UserProfileForm', UserProfileForm as React.ComponentType<BaseComponentProps & Record<string, unknown>>, {
        type: 'UserProfileForm',
        displayName: 'Profile Form',
        category: 'forms',
        icon: 'UserCog',
        propsSchema: {},
        constraints: { canHaveChildren: false },
        defaults: {
            props: {},
            styles: {},
        },
    });
}
