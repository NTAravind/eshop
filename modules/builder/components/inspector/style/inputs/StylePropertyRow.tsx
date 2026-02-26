import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/shared/utils';

interface StylePropertyRowProps {
    label: string;
    property?: string;
    isModified?: boolean;
    isOverridden?: boolean;
    onReset?: () => void;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export function StylePropertyRow({
    label,
    property,
    isModified,
    isOverridden,
    onReset,
    children,
    action,
    className
}: StylePropertyRowProps) {
    return (
        <div className={cn("flex flex-col gap-1.5 mb-3 group/row", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Label
                        className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold text-muted-foreground transition-colors truncate",
                            isOverridden && "text-amber-600",
                            isModified && !isOverridden && "text-blue-600"
                        )}
                        title={property}
                    >
                        {label}
                    </Label>

                    {/* Indicators */}
                    {isOverridden && (
                        <div className="w-1 h-1 rounded-full bg-amber-500" title="Overridden for this breakpoint" />
                    )}
                    {isModified && !isOverridden && (
                        <div className="w-1 h-1 rounded-full bg-blue-500" title="Modified" />
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity focus-within:opacity-100">
                    {/* Extra Action (e.g. Token Picker) */}
                    {action && (
                        <div className="flex items-center">
                            {action}
                        </div>
                    )}

                    {/* Reset Action - visible on hover or if modified */}
                    {(isModified || isOverridden) && onReset && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={onReset}
                            title="Reset property"
                        >
                            <RotateCcw className="w-2.5 h-2.5 text-muted-foreground" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {children}
            </div>
        </div>
    );
}
