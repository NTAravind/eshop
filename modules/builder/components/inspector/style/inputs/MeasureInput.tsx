import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';

interface MeasureInputProps {
    value?: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    min?: number;
    max?: number;
}

const UNITS = ['px', '%', 'em', 'rem', 'vh', 'vw', 'fr', 'auto'];

export function MeasureInput({
    value,
    onChange,
    placeholder,
    className,
    min,
    max
}: MeasureInputProps) {
    // Parse initial value into number and unit
    const parseValue = (val: string | number | undefined) => {
        if (val === undefined || val === null) return { num: '', unit: 'px' };
        if (typeof val === 'number') return { num: val.toString(), unit: 'px' };

        const strVal = val.toString();
        if (strVal === 'auto') return { num: 'auto', unit: 'auto' };

        const match = strVal.match(/^([\d.-]+)([a-z%]+)$/);
        if (match) {
            return { num: match[1], unit: match[2] };
        }
        return { num: strVal, unit: 'px' }; // Default fallback
    };

    const [localState, setLocalState] = useState(parseValue(value));

    useEffect(() => {
        setLocalState(parseValue(value));
    }, [value]);

    const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNum = e.target.value;
        setLocalState(prev => ({ ...prev, num: newNum }));

        if (newNum === '' || newNum === '-') {
            onChange(''); // Or keep previous? undefined?
            return;
        }

        if (localState.unit === 'auto') {
            // changing number in auto mode switches to px
            onChange(`${newNum}px`);
        } else {
            onChange(`${newNum}${localState.unit}`);
        }
    };

    const handleUnitChange = (newUnit: string) => {
        if (newUnit === 'auto') {
            setLocalState({ num: 'auto', unit: 'auto' });
            onChange('auto');
        } else {
            const currentNum = localState.num === 'auto' ? '0' : localState.num;
            setLocalState({ num: currentNum, unit: newUnit });
            onChange(`${currentNum}${newUnit}`);
        }
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <Input
                type="text"
                value={localState.num}
                onChange={handleNumChange}
                placeholder={placeholder}
                className="h-7 text-xs px-2 min-w-0"
                disabled={localState.unit === 'auto'}
            />
            <Select value={localState.unit} onValueChange={handleUnitChange}>
                <SelectTrigger className="w-[4.5rem] h-7 text-[10px] px-1.5 gap-1 bg-muted/50">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {UNITS.map(u => (
                        <SelectItem key={u} value={u} className="text-xs">
                            {u}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
