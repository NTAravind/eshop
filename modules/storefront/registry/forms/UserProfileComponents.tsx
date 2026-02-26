'use client';

import React from 'react';
import { useUserProfileContext } from './UserProfileForm';
import { BaseComponentProps } from '../';

// ==================== ProfileSection ====================
export function ProfileSection({
    children,
    style,
    className,
    ...rest
}: BaseComponentProps) {
    return (
        <div
            style={style}
            className={`mb-6 ${className || ''}`}
            {...rest}
        >
            {children}
        </div>
    );
}

// ==================== ProfileLabel ====================
interface ProfileLabelProps extends BaseComponentProps {
    text?: string;
    htmlFor?: string; // Optional, usually mapped from context or parent
}

export function ProfileLabel({
    text = 'Label',
    style,
    className,
    ...rest
}: ProfileLabelProps) {
    return (
        <label
            style={style}
            className={`block mb-2 font-medium text-sm ${className || ''}`}
            {...rest}
        >
            {text}
        </label>
    );
}

// ==================== ProfileInput ====================
interface ProfileInputProps extends BaseComponentProps {
    fieldName: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    readOnly?: boolean;
}

export function ProfileInput({
    fieldName,
    type = 'text',
    placeholder,
    required,
    readOnly,
    style,
    className,
    ...rest
}: ProfileInputProps) {
    const { formData, handleChange } = useUserProfileContext();
    const value = formData[fieldName] || '';

    // Handle nested fields if necessary, or just flat keys
    // For now assuming flat keys in formData based on UserProfileForm logic

    return (
        <input
            type={type}
            value={value as string}
            onChange={(e) => !readOnly && handleChange?.(fieldName, e.target.value)}
            placeholder={placeholder}
            required={required}
            readOnly={readOnly}
            disabled={readOnly}
            style={style}
            className={`w-full p-3 border border-border rounded-[var(--radius)] ${readOnly ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-background text-foreground'} ${className || ''}`}
            {...rest}
        />
    );
}

// ==================== ProfileSubmitButton ====================
interface ProfileSubmitButtonProps extends BaseComponentProps {
    label?: string;
    children?: React.ReactNode;
}

export function ProfileSubmitButton({
    label = 'Save Changes',
    children,
    style,
    className,
    ...rest
}: ProfileSubmitButtonProps) {
    const { isSubmitting } = useUserProfileContext();

    return (
        <button
            type="submit"
            disabled={isSubmitting}
            style={{
                opacity: isSubmitting ? 0.6 : 1,
                ...style,
            }}
            className={className || `w-full mt-6 p-3 bg-primary text-primary-foreground border-none rounded-[var(--radius)] font-medium ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            {...rest}
        >
            {children || (isSubmitting ? 'Saving...' : label)}
        </button>
    );
}
