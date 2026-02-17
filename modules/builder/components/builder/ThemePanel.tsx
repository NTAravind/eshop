'use client';

import React from 'react';
import { useEditorStore } from '@/lib/builder/editor-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { hexToHsl, hslToHex } from '@/lib/color-utils';
import type { ThemeVars } from '@/types/storefront-builder';

export function ThemePanel() {
    const theme = useEditorStore((state) => state.theme);
    const updateTheme = useEditorStore((state) => state.updateTheme);

    const handleColorChange = (key: keyof ThemeVars, hexValue: string) => {
        // Convert hex back to space-separated HSL
        // Note: our utility returns "H S% L%" format
        const hslValue = hexToHsl(hexValue);
        updateTheme({ [key]: hslValue });
    };

    const ColorInput = ({ label, variable }: { label: string; variable: keyof ThemeVars }) => {
        const value = theme[variable] || '';
        // Convert "H S% L%" to Hex for input
        const hex = React.useMemo(() => {
            // Handle case where value might be missing or invalid
            if (!value) return '#000000';
            // If value is already hex (shouldn't be, but robust check)
            if (value.startsWith('#')) return value;
            return hslToHex(value);
        }, [value]);

        return (
            <div className="flex items-center justify-between py-2">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Input
                            type="color"
                            value={hex}
                            onChange={(e) => handleColorChange(variable, e.target.value)}
                            className="h-8 w-12 p-0 border-0 overflow-hidden rounded-md cursor-pointer"
                        />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                        {hex}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="mb-4 text-sm font-medium">Theme Settings</h3>
                    <Accordion type="multiple" defaultValue={['base', 'primary']} className="w-full">
                        <AccordionItem value="base">
                            <AccordionTrigger>Base Colors</AccordionTrigger>
                            <AccordionContent className="space-y-1">
                                <ColorInput label="Background" variable="background" />
                                <ColorInput label="Foreground" variable="foreground" />
                                <ColorInput label="Card" variable="card" />
                                <ColorInput label="Card Foreground" variable="cardForeground" />
                                <ColorInput label="Popover" variable="popover" />
                                <ColorInput label="Popover Foreground" variable="popoverForeground" />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="primary">
                            <AccordionTrigger>Brand Colors</AccordionTrigger>
                            <AccordionContent className="space-y-1">
                                <ColorInput label="Primary" variable="primary" />
                                <ColorInput label="Primary Foreground" variable="primaryForeground" />
                                <ColorInput label="Secondary" variable="secondary" />
                                <ColorInput label="Secondary Foreground" variable="secondaryForeground" />
                                <ColorInput label="Accent" variable="accent" />
                                <ColorInput label="Accent Foreground" variable="accentForeground" />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="ui">
                            <AccordionTrigger>UI Elements</AccordionTrigger>
                            <AccordionContent className="space-y-1">
                                <ColorInput label="Muted" variable="muted" />
                                <ColorInput label="Muted Foreground" variable="mutedForeground" />
                                <ColorInput label="Border" variable="border" />
                                <ColorInput label="Input" variable="input" />
                                <ColorInput label="Ring" variable="ring" />
                                <ColorInput label="Destructive" variable="destructive" />
                                <ColorInput label="Destructive Offset" variable="destructiveForeground" />
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="radius">
                            <AccordionTrigger>Layout</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Border Radius</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={theme.radius || '0.5rem'}
                                            onChange={(e) => updateTheme({ radius: e.target.value })}
                                            className="font-mono text-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Use rem unit for scaling (e.g., 0.5rem)
                                    </p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </ScrollArea>
    );
}
