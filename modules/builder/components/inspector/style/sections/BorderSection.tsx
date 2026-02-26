import React from 'react';
import { ColorInput } from '../inputs/ColorInput';
import { SliderInput } from '../inputs/SliderInput'; // Using SliderInput for Radius
import { MeasureInput } from '../inputs/MeasureInput';
import { StylePropertyRow } from '../inputs/StylePropertyRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TokenPicker } from '../../TokenPicker';
import { DesignTokenMap } from '@/types/storefront-builder';

interface BorderSectionProps {
    values: Record<string, any>;
    overrides: Record<string, any>;
    tokens?: Record<string, string>;
    theme: DesignTokenMap;
    onChange: (property: string, value: any) => void;
    onTokenChange: (property: string, tokenPath: string) => void;
    onReset: (property: string) => void;
}

export function BorderSection({
    values,
    overrides,
    tokens = {},
    theme,
    onChange,
    onTokenChange,
    onReset
}: BorderSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Border</h3>

            {/* Radius */}
            <StylePropertyRow
                label="Radius"
                property="borderRadius"
                isModified={!!overrides.borderRadius}
                isOverridden={!!overrides.borderRadius}
                onReset={() => onReset('borderRadius')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="radii"
                        value={tokens.borderRadius}
                        onChange={(path) => onTokenChange('borderRadius', path)}
                    />
                }
            >
                <MeasureInput
                    value={values.borderRadius}
                    onChange={(v) => onChange('borderRadius', v)}
                />
            </StylePropertyRow>

            {/* Border Width */}
            <StylePropertyRow
                label="Width"
                property="borderWidth"
                isModified={!!overrides.borderWidth}
                isOverridden={!!overrides.borderWidth}
                onReset={() => onReset('borderWidth')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="spacing" // Using spacing for width often works
                        value={tokens.borderWidth}
                        onChange={(path) => onTokenChange('borderWidth', path)}
                    />
                }
            >
                <MeasureInput
                    value={values.borderWidth}
                    onChange={(v) => onChange('borderWidth', v)}
                />
            </StylePropertyRow>

            <div className="grid grid-cols-2 gap-4">
                {/* Border Style */}
                <StylePropertyRow
                    label="Style"
                    property="borderStyle"
                    isModified={!!overrides.borderStyle}
                    isOverridden={!!overrides.borderStyle}
                    onReset={() => onReset('borderStyle')}
                >
                    <Select
                        value={values.borderStyle || 'none'}
                        onValueChange={(v) => onChange('borderStyle', v)}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="solid">Solid</SelectItem>
                            <SelectItem value="dashed">Dashed</SelectItem>
                            <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                    </Select>
                </StylePropertyRow>

                {/* Color */}
                <StylePropertyRow
                    label="Color"
                    property="borderColor"
                    isModified={!!overrides.borderColor}
                    isOverridden={!!overrides.borderColor}
                    onReset={() => onReset('borderColor')}
                    action={
                        <TokenPicker
                            theme={theme}
                            category="colors"
                            value={tokens.borderColor}
                            onChange={(path) => onTokenChange('borderColor', path)}
                        />
                    }
                >
                    <ColorInput
                        value={values.borderColor}
                        onChange={(v) => onChange('borderColor', v)}
                    />
                </StylePropertyRow>
            </div>
        </div>
    );
}
