'use client';

import React, { useState } from 'react';
import type { BaseComponentProps } from '../';
import type { UserContext, FieldConfig } from '@/types/storefront-builder';

interface UserProfileFormProps extends BaseComponentProps {
    user?: UserContext | null;
    requirePhone?: boolean;
    profileFields?: Record<string, FieldConfig>;
    onSubmit?: (data: Record<string, unknown>) => void;
}

export function UserProfileForm({
    user,
    requirePhone = false,
    profileFields = {},
    onSubmit,
    style,
    className,
}: UserProfileFormProps) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        ...Object.fromEntries(
            Object.entries(profileFields).map(([key, field]) => [key, field.defaultValue || ''])
        ),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Call API to update profile
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

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (!user) {
        return (
            <div
                style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--muted-foreground)',
                    ...style,
                }}
                className={className}
            >
                Please sign in to view your profile
            </div>
        );
    }

    return (
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
            {/* User Avatar & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                {user.image ? (
                    <img
                        src={user.image}
                        alt={user.name || 'User'}
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
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Profile Settings</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        Update your personal information
                    </p>
                </div>
            </div>

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

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {/* Name */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>
                        Name
                    </label>
                    <input
                        type="text"
                        value={formData.name}
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
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
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
                            Phone Number {requirePhone && <span style={{ color: 'var(--destructive)' }}>*</span>}
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
        </form>
    );
}
