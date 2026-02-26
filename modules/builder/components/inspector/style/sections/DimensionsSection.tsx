import React from 'react';
import { MeasureInput } from '../inputs/MeasureInput';
import { StylePropertyRow } from '../inputs/StylePropertyRow';
import { TokenPicker } from '../../TokenPicker';
import { Separator } from '@/components/ui/separator';
import { DesignTokenMap } from '@/types/storefront-builder';

interface DimensionsSectionProps {
    values: Record<string, any>;
    overrides: Record<string, any>;
    tokens?: Record<string, string>;
    theme: DesignTokenMap;
    onChange: (property: string, value: any) => void;
    onTokenChange: (property: string, tokenPath: string) => void;
    onReset: (property: string) => void;
}

export function DimensionsSection({
    values,
    overrides,
    tokens = {},
    theme,
    onChange,
    onTokenChange,
    onReset
}: DimensionsSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Dimensions</h3>

            <div className="grid grid-cols-2 gap-4">
                <StylePropertyRow
                    label="Width"
                    property="width"
                    isModified={!!overrides.width}
                    isOverridden={!!overrides.width}
                    onReset={() => onReset('width')}
                >
                    <MeasureInput
                        value={values.width}
                        onChange={(v) => onChange('width', v)}
                    />
                </StylePropertyRow>

                <StylePropertyRow
                    label="Height"
                    property="height"
                    isModified={!!overrides.height}
                    isOverridden={!!overrides.height}
                    onReset={() => onReset('height')}
                >
                    <MeasureInput
                        value={values.height}
                        onChange={(v) => onChange('height', v)}
                    />
                </StylePropertyRow>
            </div>

            <Separator />

            {/* Padding */}
            <StylePropertyRow
                label="Padding"
                property="padding"
                isModified={!!overrides.padding}
                isOverridden={!!overrides.padding}
                onReset={() => onReset('padding')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="spacing"
                        value={tokens.padding}
                        onChange={(path) => onTokenChange('padding', path)}
                    />
                }
            >
                <MeasureInput
                    value={values.padding}
                    onChange={(v) => onChange('padding', v)}
                    placeholder="All sides"
                />
            </StylePropertyRow>

            {/* Margin */}
            <StylePropertyRow
                label="Margin"
                property="margin"
                isModified={!!overrides.margin}
                isOverridden={!!overrides.margin}
                onReset={() => onReset('margin')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="spacing"
                        value={tokens.margin}
                        onChange={(path) => onTokenChange('margin', path)}
                    />
                }
            >
                <MeasureInput
                    value={values.margin}
                    onChange={(v) => onChange('margin', v)}
                    placeholder="All sides"
                />
            </StylePropertyRow>

            <div className="grid grid-cols-2 gap-4">
                <StylePropertyRow
                    label="Min W"
                    property="minWidth"
                    isModified={!!overrides.minWidth}
                    isOverridden={!!overrides.minWidth}
                    onReset={() => onReset('minWidth')}
                >
                    <MeasureInput
                        value={values.minWidth}
                        onChange={(v) => onChange('minWidth', v)}
                    />
                </StylePropertyRow>
                <StylePropertyRow
                    label="Min H"
                    property="minHeight"
                    isModified={!!overrides.minHeight}
                    isOverridden={!!overrides.minHeight}
                    onReset={() => onReset('minHeight')}
                >
                    <MeasureInput
                        value={values.minHeight}
                        onChange={(v) => onChange('minHeight', v)}
                    />
                </StylePropertyRow>
            </div>
        </div>
    );
}
