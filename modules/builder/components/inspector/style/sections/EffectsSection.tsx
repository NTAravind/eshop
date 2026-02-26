import React from 'react';
import { SliderInput } from '../inputs/SliderInput';
import { StylePropertyRow } from '../inputs/StylePropertyRow';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TokenPicker } from '../../TokenPicker';
import { DesignTokenMap } from '@/types/storefront-builder';

interface EffectsSectionProps {
    values: Record<string, any>;
    overrides: Record<string, any>;
    tokens?: Record<string, string>;
    theme: DesignTokenMap;
    onChange: (property: string, value: any) => void;
    onTokenChange: (property: string, tokenPath: string) => void;
    onReset: (property: string) => void;
}

export function EffectsSection({
    values,
    overrides,
    tokens = {},
    theme,
    onChange,
    onTokenChange,
    onReset
}: EffectsSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Effects</h3>

            {/* Opacity */}
            <StylePropertyRow
                label="Opacity"
                property="opacity"
                isModified={!!overrides.opacity}
                isOverridden={!!overrides.opacity}
                onReset={() => onReset('opacity')}
            >
                <SliderInput
                    value={values.opacity !== undefined ? Number(values.opacity) : 1}
                    max={1}
                    step={0.01}
                    onChange={(v) => onChange('opacity', v)}
                />
            </StylePropertyRow>

            {/* Cursor */}
            <StylePropertyRow
                label="Cursor"
                property="cursor"
                isModified={!!overrides.cursor}
                isOverridden={!!overrides.cursor}
                onReset={() => onReset('cursor')}
            >
                <Select
                    value={values.cursor || 'auto'}
                    onValueChange={(v) => onChange('cursor', v)}
                >
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="pointer">Pointer</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="not-allowed">Not Allowed</SelectItem>
                        <SelectItem value="grab">Grab</SelectItem>
                    </SelectContent>
                </Select>
            </StylePropertyRow>

            {/* Box Shadow */}
            <StylePropertyRow
                label="Shadow"
                property="boxShadow"
                isModified={!!overrides.boxShadow}
                isOverridden={!!overrides.boxShadow}
                onReset={() => onReset('boxShadow')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="colors" // Often shadows use color tokens, though shadows are complex
                        value={tokens.boxShadow}
                        onChange={(path) => onTokenChange('boxShadow', path)}
                    />
                }
            >
                <Input
                    className="h-8 text-xs bg-muted/50"
                    value={values.boxShadow || ''}
                    onChange={(e) => onChange('boxShadow', e.target.value)}
                    placeholder="none"
                />
            </StylePropertyRow>
        </div>
    );
}
