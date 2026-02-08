'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const [snapValue, setSnapValue] = useState(value || '#000000');

    useEffect(() => {
        if (value) setSnapValue(value);
    }, [value]);

    const handleChange = (newValue: string) => {
        setSnapValue(newValue);
        onChange(newValue);
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="relative flex-shrink-0">
                <div
                    className="w-8 h-8 rounded-md border shadow-sm overflow-hidden relative"
                    style={{ backgroundColor: snapValue }}
                >
                    <input
                        type="color"
                        value={snapValue.startsWith('#') ? snapValue : '#000000'}
                        onChange={(e) => handleChange(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                </div>
            </div>
            <Input
                value={snapValue}
                onChange={(e) => handleChange(e.target.value)}
                className="font-mono text-xs flex-1"
                placeholder="#000000"
            />
        </div>
    );
}

// Simple HSL/RGB conversion could be added here if needed
