'use client';

/**
 * Tweakcn-style Theme Editor
 * Full-screen dialog for visually customizing the shadcn/ui theme.
 * Provides: color palette editing, radius, preset selector, and live component preview.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Palette,
    RotateCcw,
    Download,
    Upload,
    Check,
    Copy,
    Sun,
    Moon,
    Sparkles,
    SlidersHorizontal,
} from 'lucide-react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { themePresets, type ThemePreset } from '@/modules/builder/theme-presets';
import { hslToHex, hexToHsl } from '@/shared/utils/color-utils';
import type { ThemeVars } from '@/types/storefront-builder';
import { cn } from '@/shared/utils';

interface TweakcnThemeEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApply?: () => Promise<void>;
}

// ─── Color token groups for the editor ───────────────────────────
const colorGroups = [
    {
        label: 'Base',
        tokens: [
            { key: 'background', label: 'Background' },
            { key: 'foreground', label: 'Foreground' },
        ],
    },
    {
        label: 'Primary',
        tokens: [
            { key: 'primary', label: 'Primary' },
            { key: 'primaryForeground', label: 'Primary FG' },
        ],
    },
    {
        label: 'Secondary',
        tokens: [
            { key: 'secondary', label: 'Secondary' },
            { key: 'secondaryForeground', label: 'Secondary FG' },
        ],
    },
    {
        label: 'Card',
        tokens: [
            { key: 'card', label: 'Card' },
            { key: 'cardForeground', label: 'Card FG' },
        ],
    },
    {
        label: 'Muted',
        tokens: [
            { key: 'muted', label: 'Muted' },
            { key: 'mutedForeground', label: 'Muted FG' },
        ],
    },
    {
        label: 'Accent',
        tokens: [
            { key: 'accent', label: 'Accent' },
            { key: 'accentForeground', label: 'Accent FG' },
        ],
    },
    {
        label: 'Destructive',
        tokens: [
            { key: 'destructive', label: 'Destructive' },
            { key: 'destructiveForeground', label: 'Destructive FG' },
        ],
    },
    {
        label: 'Borders & Input',
        tokens: [
            { key: 'border', label: 'Border' },
            { key: 'input', label: 'Input' },
            { key: 'ring', label: 'Ring' },
        ],
    },
    {
        label: 'Popover',
        tokens: [
            { key: 'popover', label: 'Popover' },
            { key: 'popoverForeground', label: 'Popover FG' },
        ],
    },
    {
        label: 'Charts',
        tokens: [
            { key: 'chart1', label: 'Chart 1' },
            { key: 'chart2', label: 'Chart 2' },
            { key: 'chart3', label: 'Chart 3' },
            { key: 'chart4', label: 'Chart 4' },
            { key: 'chart5', label: 'Chart 5' },
        ],
    },
];

// ─── Radius presets ──────────────────────────────────────────────
const radiusOptions = [
    { label: '0', value: '0' },
    { label: '0.3', value: '0.3rem' },
    { label: '0.5', value: '0.5rem' },
    { label: '0.75', value: '0.75rem' },
    { label: '1.0', value: '1rem' },
];

// ─── Color Swatch Picker ────────────────────────────────────────
function ColorSwatch({
    label,
    hslValue,
    onChange,
}: {
    label: string;
    hslValue: string;
    onChange: (hsl: string) => void;
}) {
    const hexValue = useMemo(() => hslToHex(hslValue || '0 0% 0%'), [hslValue]);

    const handleColorChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newHex = e.target.value;
            const newHsl = hexToHsl(newHex);
            onChange(newHsl);
        },
        [onChange]
    );

    return (
        <div className="flex items-center gap-3 group">
            <div className="relative">
                <input
                    type="color"
                    value={hexValue}
                    onChange={handleColorChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                    className="w-8 h-8 rounded-md border border-border shadow-sm cursor-pointer transition-transform group-hover:scale-110"
                    style={{ backgroundColor: hexValue }}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{label}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{hexValue}</p>
            </div>
        </div>
    );
}

// ─── Live Component Preview Panel ────────────────────────────────
function LivePreview({ theme }: { theme: ThemeVars }) {
    const previewStyle = useMemo(() => {
        const vars: Record<string, string> = {};
        Object.entries(theme).forEach(([key, value]) => {
            if (!value) return;
            const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            const isHsl = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(value);
            vars[`--${kebab}`] = isHsl ? value : value;
        });
        return vars as React.CSSProperties;
    }, [theme]);

    return (
        <div className="rounded-lg border overflow-hidden" style={previewStyle}>
            {/* Header simulation */}
            <div className="p-4 border-b" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Store Preview</span>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                            Primary
                        </div>
                        <div className="px-3 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                            Secondary
                        </div>
                    </div>
                </div>
            </div>

            {/* Card simulation */}
            <div className="p-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <div className="rounded-lg border p-4 space-y-3" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <h3 className="text-sm font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>Product Card</h3>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        A sample card showing how your theme looks.
                    </p>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 rounded-md text-xs font-medium" style={{
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            borderRadius: 'var(--radius)',
                        }}>
                            Add to Cart
                        </div>
                        <div className="px-3 py-1.5 rounded-md text-xs font-medium border" style={{
                            backgroundColor: 'transparent',
                            color: 'hsl(var(--foreground))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}>
                            Details
                        </div>
                        <div className="px-3 py-1.5 rounded-md text-xs font-medium" style={{
                            backgroundColor: 'hsl(var(--destructive))',
                            color: 'hsl(var(--destructive-foreground))',
                            borderRadius: 'var(--radius)',
                        }}>
                            Delete
                        </div>
                    </div>
                </div>

                {/* Input simulation */}
                <div className="mt-3 space-y-2">
                    <div className="rounded-md border px-3 py-2 text-xs" style={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--input))',
                        color: 'hsl(var(--foreground))',
                        borderRadius: 'var(--radius)',
                    }}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Search products...</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                            backgroundColor: 'hsl(var(--accent))',
                            color: 'hsl(var(--accent-foreground))',
                        }}>
                            Badge
                        </div>
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                            backgroundColor: 'hsl(var(--muted))',
                            color: 'hsl(var(--muted-foreground))',
                        }}>
                            Muted
                        </div>
                    </div>
                </div>

                {/* Chart color swatches */}
                <div className="mt-3 flex gap-1">
                    {['chart1', 'chart2', 'chart3', 'chart4', 'chart5'].map((key) => (
                        <div
                            key={key}
                            className="flex-1 h-4 rounded-sm first:rounded-l-md last:rounded-r-md"
                            style={{ backgroundColor: `hsl(${theme[key as keyof ThemeVars] || '0 0% 50%'})` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════
// Main Editor Component
// ═════════════════════════════════════════════════════════════════
export function TweakcnThemeEditor({ open, onOpenChange, onApply }: TweakcnThemeEditorProps) {
    const theme = useEditorStore((s) => s.theme);
    const setTheme = useEditorStore((s) => s.setTheme);
    const updateTheme = useEditorStore((s) => s.updateTheme);

    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Apply a preset
    const applyPreset = useCallback(
        (preset: ThemePreset) => {
            setTheme(preset.theme);
            setActivePreset(preset.id);
        },
        [setTheme]
    );

    // Update a single color token
    const updateColor = useCallback(
        (key: string, hsl: string) => {
            updateTheme({ [key]: hsl } as Partial<ThemeVars>);
            setActivePreset(null); // custom once edited
        },
        [updateTheme]
    );

    // Update radius
    const updateRadius = useCallback(
        (value: string) => {
            updateTheme({ radius: value });
            setActivePreset(null);
        },
        [updateTheme]
    );

    // Export theme as JSON
    const exportTheme = useCallback(() => {
        const json = JSON.stringify(theme, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'theme.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [theme]);

    // Import theme from JSON
    const importTheme = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const imported = JSON.parse(text) as ThemeVars;
                setTheme(imported);
                setActivePreset(null);
            } catch {
                console.error('Invalid theme JSON file');
            }
        };
        input.click();
    }, [setTheme]);

    // Copy CSS variables
    const copyCssVars = useCallback(() => {
        const lines = Object.entries(theme)
            .filter(([, v]) => v)
            .map(([key, value]) => {
                const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
                return `  --${kebab}: ${value};`;
            });
        const css = `:root {\n${lines.join('\n')}\n}`;
        navigator.clipboard.writeText(css);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [theme]);

    // Parse current radius for slider
    const currentRadiusNum = useMemo(() => {
        const r = parseFloat(theme.radius || '0.5');
        return isNaN(r) ? 0.5 : r;
    }, [theme.radius]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:!max-w-[95vw] !w-[95vw] h-[90vh] p-0 gap-0 flex flex-col">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-primary" />
                            <DialogTitle className="text-lg">Theme Editor</DialogTitle>
                            {activePreset && (
                                <Badge variant="secondary" className="text-xs">
                                    {themePresets.find((p) => p.id === activePreset)?.name}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={copyCssVars} className="gap-1.5">
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copied!' : 'Copy CSS'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={exportTheme} className="gap-1.5">
                                <Download className="h-3.5 w-3.5" />
                                Export
                            </Button>
                            <Button variant="ghost" size="sm" onClick={importTheme} className="gap-1.5">
                                <Upload className="h-3.5 w-3.5" />
                                Import
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* ─── Left: Controls ─────────────────────────────── */}
                    <div className="w-[55%] border-r flex flex-col overflow-hidden">
                        <Tabs defaultValue="presets" className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="mx-4 mt-3 grid grid-cols-2">
                                <TabsTrigger value="presets" className="gap-1.5 text-xs">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Presets
                                </TabsTrigger>
                                <TabsTrigger value="customize" className="gap-1.5 text-xs">
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Customize
                                </TabsTrigger>
                            </TabsList>

                            {/* Presets Tab */}
                            <TabsContent value="presets" className="flex-1 overflow-hidden mt-0">
                                <ScrollArea className="h-full">
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {themePresets.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => applyPreset(preset)}
                                                className={cn(
                                                    'relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-md',
                                                    activePreset === preset.id
                                                        ? 'border-primary shadow-md'
                                                        : 'border-border hover:border-muted-foreground/30'
                                                )}
                                            >
                                                {activePreset === preset.id && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-primary-foreground" />
                                                    </div>
                                                )}
                                                {/* Color swatches */}
                                                <div className="flex gap-1 mb-2">
                                                    {Object.values(preset.preview).map((color, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-6 h-6 rounded-full border border-black/10"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs font-semibold">{preset.name}</p>
                                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                                    {preset.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* Customize Tab */}
                            <TabsContent value="customize" className="flex-1 overflow-hidden mt-0">
                                <ScrollArea className="h-full">
                                    <div className="p-4 space-y-5">
                                        {/* Radius */}
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Border Radius
                                            </Label>
                                            <div className="mt-2 flex items-center gap-3">
                                                <Slider
                                                    value={[currentRadiusNum]}
                                                    min={0}
                                                    max={1.5}
                                                    step={0.05}
                                                    onValueChange={([v]) => updateRadius(`${v}rem`)}
                                                    className="flex-1"
                                                />
                                                <span className="text-xs font-mono w-12 text-right text-muted-foreground">
                                                    {currentRadiusNum.toFixed(2)}rem
                                                </span>
                                            </div>
                                            <div className="mt-2 flex gap-1.5">
                                                {radiusOptions.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateRadius(opt.value)}
                                                        className={cn(
                                                            'px-2 py-1 text-[10px] rounded border transition-colors',
                                                            theme.radius === opt.value
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'border-border hover:bg-muted'
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Color Groups */}
                                        {colorGroups.map((group) => (
                                            <div key={group.label}>
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    {group.label}
                                                </Label>
                                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                                                    {group.tokens.map((token) => (
                                                        <ColorSwatch
                                                            key={token.key}
                                                            label={token.label}
                                                            hslValue={theme[token.key as keyof ThemeVars] || '0 0% 0%'}
                                                            onChange={(hsl) => updateColor(token.key, hsl)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* ─── Right: Live Preview ──────────────────────────── */}
                    <div className="w-[45%] flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b shrink-0">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Live Preview
                            </h3>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-4">
                                <LivePreview theme={theme} />

                                {/* Additional component previews */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Color Palette
                                    </p>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {[
                                            { key: 'background', label: 'BG' },
                                            { key: 'foreground', label: 'FG' },
                                            { key: 'primary', label: 'Pri' },
                                            { key: 'secondary', label: 'Sec' },
                                            { key: 'accent', label: 'Acc' },
                                            { key: 'muted', label: 'Mut' },
                                            { key: 'destructive', label: 'Des' },
                                            { key: 'border', label: 'Brd' },
                                            { key: 'card', label: 'Crd' },
                                            { key: 'ring', label: 'Rng' },
                                        ].map(({ key, label }) => (
                                            <div key={key} className="text-center">
                                                <div
                                                    className="w-full aspect-square rounded-md border border-black/10 mb-1"
                                                    style={{
                                                        backgroundColor: `hsl(${theme[key as keyof ThemeVars] || '0 0% 50%'})`,
                                                    }}
                                                />
                                                <span className="text-[9px] text-muted-foreground">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Radius preview */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Radius Preview
                                    </p>
                                    <div className="flex gap-2">
                                        {[
                                            { w: 'w-10 h-10', label: 'SM' },
                                            { w: 'w-14 h-10', label: 'MD' },
                                            { w: 'w-20 h-10', label: 'LG' },
                                        ].map(({ w, label }) => (
                                            <div key={label} className="text-center">
                                                <div
                                                    className={cn(w, 'border-2 mx-auto')}
                                                    style={{
                                                        borderColor: `hsl(${theme.primary || '0 0% 0%'})`,
                                                        borderRadius: theme.radius || '0.5rem',
                                                    }}
                                                />
                                                <span className="text-[9px] text-muted-foreground mt-1 block">{label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* ─── Footer: Apply Theme ───────────────────────────── */}
                <div className="border-t px-6 py-3 shrink-0 flex items-center justify-between bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                        Apply saves the theme to the database for all pages.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={isSaving}
                            onClick={async () => {
                                if (onApply) {
                                    setIsSaving(true);
                                    try {
                                        await onApply();
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                                onOpenChange(false);
                            }}
                            className="gap-1.5"
                        >
                            {isSaving ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Check className="h-3.5 w-3.5" />
                                    Apply Theme
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
