'use client';

import React from 'react';
import {
    ChevronRight,
    MoreHorizontal,
    Trash2,
    Plus,
    ArrowRightLeft,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextPathPicker } from './ContextPathPicker';
import type { BindingExpr, BindingContext } from '@/types/storefront-builder';

interface BindingExprNodeProps {
    expr: BindingExpr;
    onChange: (expr: BindingExpr) => void;
    onDelete?: () => void;
    depth?: number;
}

export function BindingExprNode({ expr, onChange, onDelete, depth = 0 }: BindingExprNodeProps) {
    const handleChange = (updates: Partial<BindingExpr>) => {
        onChange({ ...expr, ...updates } as BindingExpr);
    };

    const renderNodeContent = () => {
        switch (expr.kind) {
            case 'path':
                return (
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1 rounded">
                            {expr.root}
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex-1">
                            <ContextPathPicker
                                value={expr.segments.join('.')}
                                onChange={(path) => {
                                    // Split dotted path into segments
                                    // e.g. "product.title" -> root="product", segments=["title"]
                                    if (path.includes('.')) {
                                        const [root, ...segments] = path.split('.');
                                        handleChange({ root: root as any, segments });
                                    } else {
                                        handleChange({ root: path as any, segments: [] });
                                    }
                                }}
                            />
                        </div>
                    </div>
                );

            case 'literal':
                return (
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-xs text-muted-foreground w-12">Value:</span>
                        <Input
                            className="h-7 text-xs font-mono"
                            value={String(expr.value)}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Basic type inference attempt
                                const num = Number(val);
                                handleChange({ value: !isNaN(num) && val !== '' ? num : val });
                            }}
                        />
                    </div>
                );

            case 'transform':
                return (
                    <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1 rounded">
                                Fn: {expr.transformId}
                            </span>
                            <BindingExprNode
                                expr={expr.input}
                                onChange={(input) => handleChange({ input })}
                                depth={depth + 1}
                            />
                        </div>
                        {/* Params support could be added here */}
                    </div>
                );

            case 'conditional':
                return (
                    <div className="w-full space-y-2 border-l-2 border-indigo-100 pl-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground w-8">If</span>
                            <BindingExprNode
                                expr={expr.test}
                                onChange={(test) => handleChange({ test })}
                                depth={depth + 1}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground w-8">Then</span>
                            <BindingExprNode
                                expr={expr.consequent}
                                onChange={(consequent) => handleChange({ consequent })}
                                depth={depth + 1}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground w-8">Else</span>
                            <BindingExprNode
                                expr={expr.alternate}
                                onChange={(alternate) => handleChange({ alternate })}
                                depth={depth + 1}
                            />
                        </div>
                    </div>
                );

            case 'fallback':
                return (
                    <div className="w-full space-y-2">
                        <BindingExprNode
                            expr={expr.primary}
                            onChange={(primary) => handleChange({ primary })}
                            depth={depth + 1}
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="w-3 h-3" />
                            <span>Fallback</span>
                        </div>
                        <BindingExprNode
                            expr={expr.fallback}
                            onChange={(fallback) => handleChange({ fallback })}
                            depth={depth + 1}
                        />
                    </div>
                );
        }
    };

    return (
        <div className={cn(
            "rounded border bg-background p-2 text-sm relative group",
            depth > 0 && "border-border/50",
            depth === 0 && "shadow-sm"
        )}>
            {/* Context Menu / Actions */}
            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 backdrop-blur-sm rounded">
                {/* Wrap in Transform Flow */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" title="Wrap...">
                            <MoreHorizontal className="w-3 h-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="end">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-7"
                            onClick={() => onChange({
                                kind: 'transform',
                                transformId: 'uppercase',
                                input: expr
                            })}
                        >
                            Wrap in Transform
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-7"
                            onClick={() => onChange({
                                kind: 'conditional',
                                test: expr,
                                consequent: { kind: 'literal', value: true },
                                alternate: { kind: 'literal', value: false }
                            })}
                        >
                            Wrap in Conditional
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-7"
                            onClick={() => onChange({
                                kind: 'fallback',
                                primary: expr,
                                fallback: { kind: 'literal', value: '' }
                            })}
                        >
                            Add Fallback
                        </Button>
                    </PopoverContent>
                </Popover>

                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={onDelete}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                )}
            </div>

            {renderNodeContent()}
        </div>
    );
}

// Utility for classNames
function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}
