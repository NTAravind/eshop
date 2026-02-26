'use client';

import React, { useState, createContext, useContext } from 'react';
import type { BaseComponentProps } from '../';
import type { UserContext, FieldConfig } from '@/types/storefront-builder';

// ==================== Context Definitions ====================
interface UserProfileContextType {
    formData: Record<string, string | number | boolean>;
    handleChange: (field: string, value: string | number | boolean) => void;
    isSubmitting: boolean;
    user?: UserContext | null;
}

export const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function useUserProfileContext() {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfileContext must be used within a UserProfileForm');
    }
    return context;
}

interface UserProfileFormProps extends BaseComponentProps {
    user?: UserContext | null;
    requirePhone?: boolean;
    profileFields?: Record<string, FieldConfig>;
    onSubmit?: (data: Record<string, unknown>) => void;
    heading?: string;
    subheading?: string;
    nameLabel?: string;
    emailLabel?: string;
    phoneLabel?: string;
    addressHeading?: string;
    saveLabel?: string;
    children?: React.ReactNode;
}

export function UserProfileForm({
    user,
    requirePhone = false,
    profileFields = {},
    onSubmit,
    heading = 'Profile Settings',
    subheading = 'Update your personal information',
    nameLabel = 'Name',
    emailLabel = 'Email',
    phoneLabel = 'Phone Number',
    addressHeading = 'Address',
    saveLabel = 'Save Changes',
    style,
    className,
    children,
}: UserProfileFormProps) {
    const isGuest = !user;
    const effectiveUser: UserContext = user || {
        id: 'guest',
        email: 'guest@example.com',
        name: 'Guest User',
        phone: '',
    };

    const [formData, setFormData] = useState<Record<string, string | number | boolean>>({
        name: effectiveUser.name || '',
        email: effectiveUser.email || '',
        phone: effectiveUser.phone || '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        ...Object.fromEntries(
            Object.entries(profileFields).map(([key, field]) => [key, (field.defaultValue as string) || ''])
        ),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            if (isGuest) {
                setMessage({ type: 'error', text: 'Please sign in to update your profile.' });
                return;
            }

            const response = await fetch('/api/customer/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            onSubmit?.(formData);
        } catch (error) {
            console.error('Profile update error:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: string, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const hasChildren = React.Children.count(children) > 0;

    return (
        <UserProfileContext.Provider value={{ formData, handleChange, isSubmitting, user }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    padding: '1.5rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--card)',
                    ...style,
                }}
                className={className}
            >
                {/* Guest notice */}
                {isGuest && (
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            marginBottom: '1.25rem',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--muted)',
                            color: 'var(--muted-foreground)',
                            fontSize: '0.9rem',
                        }}
                    >
                        You are viewing a preview. Sign in to save changes.
                    </div>
                )}

                {/* Message */}
                {message && (
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            marginBottom: '1.5rem',
                            borderRadius: 'var(--radius)',
                            backgroundColor: message.type === 'success' ? 'var(--primary)' : 'var(--destructive)',
                            color: message.type === 'success' ? 'var(--primary-foreground)' : 'var(--destructive-foreground)',
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {hasChildren ? (
                    children
                ) : (
                    <>
                        {/* Fallback to Monolithic Rendering */}
                        {/* User Avatar & Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={effectiveUser.name || 'User'}
                                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                    }}
                                >
                                    👤
                                </div>
                            )}
                            <div>
                                <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{heading}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                    {subheading}
                                </p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                    {nameLabel}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name as string}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        backgroundColor: 'var(--background)',
                                        color: 'var(--foreground)',
                                    }}
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                    {emailLabel}
                                </label>
                                <input
                                    type="email"
                                    value={formData.email as string}
                                    readOnly
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        backgroundColor: 'var(--muted)',
                                        color: 'var(--muted-foreground)',
                                        cursor: 'not-allowed',
                                    }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                    Email cannot be changed
                                </p>
                            </div>

                            {/* Phone */}
                            {requirePhone && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                        {phoneLabel} {requirePhone && <span style={{ color: 'var(--destructive)' }}>*</span>}
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone as string}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        required={requirePhone}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Custom Profile Fields */}
                            {Object.entries(profileFields).map(([key, field]) => (
                                <div key={key}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                                        {field.label || key}
                                        {field.required && <span style={{ color: 'var(--destructive)' }}>*</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={formData[key] as string}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            required={field.required}
                                            rows={3}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)',
                                                resize: 'vertical',
                                            }}
                                        />
                                    ) : (
                                        <input
                                            type={field.type || 'text'}
                                            value={formData[key] as string}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            required={field.required}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                    )}
                                    {field.description && (
                                        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                                            {field.description}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Addresses */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ fontWeight: 600 }}>{addressHeading}</label>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Shipping / Billing</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Address line 1"
                                        value={formData.addressLine1 as string}
                                        onChange={(e) => handleChange('addressLine1', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)',
                                        }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Address line 2 (optional)"
                                        value={formData.addressLine2 as string}
                                        onChange={(e) => handleChange('addressLine2', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)',
                                        }}
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.city as string}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="State / Region"
                                            value={formData.state as string}
                                            onChange={(e) => handleChange('state', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Postal code"
                                            value={formData.postalCode as string}
                                            onChange={(e) => handleChange('postalCode', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Country"
                                            value={formData.country as string}
                                            onChange={(e) => handleChange('country', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                backgroundColor: 'var(--background)',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                marginTop: '1.5rem',
                                padding: '0.75rem',
                                backgroundColor: 'var(--primary)',
                                color: 'var(--primary-foreground)',
                                border: 'none',
                                borderRadius: 'var(--radius)',
                                fontWeight: 500,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.6 : 1,
                            }}
                        >
                            {isSubmitting ? 'Saving...' : saveLabel}
                        </button>
                    </>
                )}
            </form>
        </UserProfileContext.Provider>
    );
}
