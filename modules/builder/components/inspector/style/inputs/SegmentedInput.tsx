import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/shared/utils';

export interface SegmentOption {
    value: string;
    label?: string;
    icon?: React.ElementType;
    tooltip?: string;
}

interface SegmentedInputProps {
    value?: string;
    onChange: (value: string) => void;
    options: SegmentOption[];
    className?: string;
}

export function SegmentedInput({
    value,
    onChange,
    options,
    className
}: SegmentedInputProps) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(val) => val && onChange(val)}
            className={cn("justify-start gap-1 p-0.5 bg-muted/40 rounded-md border", className)}
        >
            {options.map((opt) => (
                <ToggleGroupItem
                    key={opt.value}
                    value={opt.value}
                    className="h-6 w-7 px-0 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                    title={opt.tooltip || opt.label}
                >
                    {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                    {opt.label && !opt.icon && <span className="text-[10px] font-medium">{opt.label}</span>}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
