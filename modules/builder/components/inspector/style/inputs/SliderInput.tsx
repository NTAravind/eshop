import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

interface SliderInputProps {
    value?: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    className?: string;
}

export function SliderInput({
    value = 0,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    unit,
    className
}: SliderInputProps) {
    const handleSliderChange = (vals: number[]) => {
        onChange(vals[0]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            onChange(Math.max(min, Math.min(max, val)));
        }
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <Slider
                value={[value]}
                onValueChange={handleSliderChange}
                min={min}
                max={max}
                step={step}
                className="flex-1"
            />
            <div className="relative w-14 shrink-0">
                <Input
                    type="number"
                    value={value}
                    onChange={handleInputChange}
                    className="h-7 text-xs px-2 pr-6 text-right"
                />
                {unit && (
                    <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground pointer-events-none">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}
