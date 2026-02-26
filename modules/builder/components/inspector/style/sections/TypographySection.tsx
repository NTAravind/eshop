import React from 'react';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Bold,
    Italic,
    Underline
} from 'lucide-react';
import { MeasureInput } from '../inputs/MeasureInput';
import { ColorInput } from '../inputs/ColorInput';
import { SegmentedInput } from '../inputs/SegmentedInput';
import { StylePropertyRow } from '../inputs/StylePropertyRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TokenPicker } from '../../TokenPicker';
import { DesignTokenMap } from '@/types/storefront-builder';

interface TypographySectionProps {
    values: Record<string, any>;
    overrides: Record<string, any>;
    tokens?: Record<string, string>;
    theme: DesignTokenMap;
    onChange: (property: string, value: any) => void;
    onTokenChange: (property: string, tokenPath: string) => void;
    onReset: (property: string) => void;
}

export function TypographySection({
    values,
    overrides,
    tokens = {},
    theme,
    onChange,
    onTokenChange,
    onReset
}: TypographySectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Typography</h3>

            {/* Font Family */}
            <StylePropertyRow
                label="Font"
                property="fontFamily"
                isModified={!!overrides.fontFamily}
                isOverridden={!!overrides.fontFamily}
                onReset={() => onReset('fontFamily')}
            >
                <div className="w-full">
                    <Select
                        value={values.fontFamily || ''}
                        onValueChange={(v) => onChange('fontFamily', v)}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="System" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sans-serif">Sans Serif</SelectItem>
                            <SelectItem value="serif">Serif</SelectItem>
                            <SelectItem value="mono">Monospace</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </StylePropertyRow>

            <div className="grid grid-cols-2 gap-4">
                {/* Font Size */}
                <StylePropertyRow
                    label="Size"
                    property="fontSize"
                    isModified={!!overrides.fontSize}
                    isOverridden={!!overrides.fontSize}
                    onReset={() => onReset('fontSize')}
                >
                    <MeasureInput
                        value={values.fontSize}
                        onChange={(v) => onChange('fontSize', v)}
                    />
                </StylePropertyRow>

                {/* Font Weight */}
                <StylePropertyRow
                    label="Weight"
                    property="fontWeight"
                    isModified={!!overrides.fontWeight}
                    isOverridden={!!overrides.fontWeight}
                    onReset={() => onReset('fontWeight')}
                >
                    <Select
                        value={String(values.fontWeight || '400')}
                        onValueChange={(v) => onChange('fontWeight', v)}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">Thin</SelectItem>
                            <SelectItem value="300">Light</SelectItem>
                            <SelectItem value="400">Normal</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semibold</SelectItem>
                            <SelectItem value="700">Bold</SelectItem>
                            <SelectItem value="900">Black</SelectItem>
                        </SelectContent>
                    </Select>
                </StylePropertyRow>
            </div>

            {/* Color */}
            <StylePropertyRow
                label="Color"
                property="color"
                isModified={!!overrides.color}
                isOverridden={!!overrides.color}
                onReset={() => onReset('color')}
                action={
                    <TokenPicker
                        theme={theme}
                        category="colors"
                        value={tokens.color}
                        onChange={(path) => onTokenChange('color', path)}
                    />
                }
            >
                <ColorInput
                    value={values.color}
                    onChange={(v) => onChange('color', v)}
                />
            </StylePropertyRow>

            {/* Alignment */}
            <StylePropertyRow
                label="Align"
                property="textAlign"
                isModified={!!overrides.textAlign}
                isOverridden={!!overrides.textAlign}
                onReset={() => onReset('textAlign')}
            >
                <SegmentedInput
                    value={values.textAlign || 'left'}
                    onChange={(v) => onChange('textAlign', v)}
                    options={[
                        { value: 'left', icon: AlignLeft, label: 'Left' },
                        { value: 'center', icon: AlignCenter, label: 'Center' },
                        { value: 'right', icon: AlignRight, label: 'Right' },
                        { value: 'justify', icon: AlignJustify, label: 'Justify' },
                    ]}
                />
            </StylePropertyRow>

            <div className="grid grid-cols-2 gap-4">
                {/* Line Height */}
                <StylePropertyRow
                    label="Height"
                    property="lineHeight"
                    isModified={!!overrides.lineHeight}
                    isOverridden={!!overrides.lineHeight}
                    onReset={() => onReset('lineHeight')}
                >
                    <MeasureInput
                        value={values.lineHeight}
                        onChange={(v) => onChange('lineHeight', v)}
                    />
                </StylePropertyRow>

                {/* Letter Spacing */}
                <StylePropertyRow
                    label="Spacing"
                    property="letterSpacing"
                    isModified={!!overrides.letterSpacing}
                    isOverridden={!!overrides.letterSpacing}
                    onReset={() => onReset('letterSpacing')}
                >
                    <MeasureInput
                        value={values.letterSpacing}
                        onChange={(v) => onChange('letterSpacing', v)}
                    />
                </StylePropertyRow>
            </div>
        </div>
    );
}
