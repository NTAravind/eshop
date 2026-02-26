import React from 'react';
import { ColorInput } from '../inputs/ColorInput';
import { StylePropertyRow } from '../inputs/StylePropertyRow';
import { Input } from '@/components/ui/input';
import { TokenPicker } from '../../TokenPicker';
import { DesignTokenMap } from '@/types/storefront-builder';

interface BackgroundSectionProps {
    values: Record<string, any>;
    overrides: Record<string, any>;
    tokens?: Record<string, string>;
    theme: DesignTokenMap;
    onChange: (property: string, value: any) => void;
    onTokenChange: (property: string, tokenPath: string) => void;
    onReset: (property: string) => void;
}

export function BackgroundSection({
    values,
    overrides,
    tokens = {},
    theme,
    onChange,
    onTokenChange,
    onReset
}: BackgroundSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Background</h3>

            {/* Background Color */}
            <StylePropertyRow
                label="Color"
                property="backgroundColor"
                isModified={!!overrides.backgroundColor}
                isOverridden={!!overrides.backgroundColor}
                onReset={() => onReset('backgroundColor')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="colors"
                        value={tokens.backgroundColor}
                        onChange={(path) => onTokenChange('backgroundColor', path)}
                    />
                }
            >
                <ColorInput
                    value={values.backgroundColor}
                    onChange={(v) => onChange('backgroundColor', v)}
                />
            </StylePropertyRow>

            {/* Background Image */}
            <StylePropertyRow
                label="Image URL"
                property="backgroundImage"
                isModified={!!overrides.backgroundImage}
                isOverridden={!!overrides.backgroundImage}
                onReset={() => onReset('backgroundImage')}
            >
                <div className="flex w-full items-center gap-2">
                    <Input
                        className="h-8 text-xs bg-muted/50"
                        value={values.backgroundImage ? values.backgroundImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '') : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            onChange('backgroundImage', val ? `url('${val}')` : undefined);
                        }}
                        placeholder="https://..."
                    />
                </div>
            </StylePropertyRow>

            {values.backgroundImage && (
                <div className="grid grid-cols-2 gap-4">
                    <StylePropertyRow
                        label="Size"
                        property="backgroundSize"
                        onReset={() => onReset('backgroundSize')}
                    >
                        <Input
                            className="h-8 text-xs bg-muted/50"
                            value={values.backgroundSize || ''}
                            onChange={(e) => onChange('backgroundSize', e.target.value)}
                            placeholder="cover"
                        />
                    </StylePropertyRow>
                    <StylePropertyRow
                        label="Position"
                        property="backgroundPosition"
                        onReset={() => onReset('backgroundPosition')}
                    >
                        <Input
                            className="h-8 text-xs bg-muted/50"
                            value={values.backgroundPosition || ''}
                            onChange={(e) => onChange('backgroundPosition', e.target.value)}
                            placeholder="center"
                        />
                    </StylePropertyRow>
                </div>
            )}
        </div>
    );
}
