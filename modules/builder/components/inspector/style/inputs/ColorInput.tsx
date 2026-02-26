import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';
import { Palette, X } from 'lucide-react';

interface ColorInputProps {
    value?: string;
    tokenName?: string;
    onChange: (value: string) => void;
    onDetachToken?: () => void;
    className?: string;
}

export function ColorInput({
    value,
    tokenName,
    onChange,
    onDetachToken,
    className
}: ColorInputProps) {
    const isToken = !!tokenName;
    const displayValue = isToken ? tokenName : (value || 'transparent');

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Swatch / Token Indicator */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "w-full justify-start h-7 px-2 gap-2 font-normal text-xs overflow-hidden",
                            isToken && "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        )}
                    >
                        <div
                            className="w-3 h-3 rounded-full border shadow-sm shrink-0"
                            style={{ backgroundColor: value || 'transparent' }}
                        />
                        <span className="truncate flex-1 text-left">
                            {displayValue}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Color Picker</Label>
                            {isToken && onDetachToken && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-[10px] text-destructive hover:bg-destructive/10"
                                    onClick={onDetachToken}
                                >
                                    Detach Token
                                </Button>
                            )}
                        </div>

                        {/* Simple Hex Input + Color Input Combination */}
                        <div className="flex gap-2">
                            <div className="relative w-8 h-8 rounded border overflow-hidden shrink-0">
                                <input
                                    type="color"
                                    value={value || '#000000'}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="absolute inset-[-4px] w-[200%] h-[200%] p-0 cursor-pointer border-0"
                                />
                            </div>
                            <Input
                                value={value || ''}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-8 text-xs font-mono"
                                placeholder="#000000"
                            />
                        </div>

                        {/* Common Presets (Mock for now) */}
                        <div className="grid grid-cols-6 gap-1 mt-2">
                            {['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', 'transparent'].map(c => (
                                <button
                                    key={c}
                                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                                    style={{ backgroundColor: c }}
                                    onClick={() => onChange(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* If token attached, show separate detach button for quick access */}
            {isToken && onDetachToken && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={onDetachToken}
                    title="Detach Token"
                >
                    <X className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}
