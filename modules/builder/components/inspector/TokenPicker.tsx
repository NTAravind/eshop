import React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Layers, Box, Type, MousePointer2 } from 'lucide-react';
import type { DesignTokenMap } from '@/types/storefront-builder';

interface TokenPickerProps {
    theme: DesignTokenMap;
    value?: string;
    onChange: (tokenPath: string) => void;
    category?: keyof DesignTokenMap | 'all';
    trigger?: React.ReactNode;
}

export function TokenPicker({
    theme,
    value,
    onChange,
    category = 'all',
    trigger,
}: TokenPickerProps) {
    const categories = [
        { id: 'colors', label: 'Colors', icon: Palette },
        { id: 'spacing', label: 'Spacing', icon: Layers },
        { id: 'radii', label: 'Radii', icon: Box },
        { id: 'typography', label: 'Type', icon: Type },
    ] as const;

    const filteredCategories =
        category === 'all'
            ? categories
            : categories.filter((c) => c.id === category);

    return (
        <Popover>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="w-full justify-start font-normal">
                        {value ? (
                            <span className="flex items-center gap-2">
                                <span className="text-muted-foreground mr-1">Token:</span>
                                {value}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Select token...</span>
                        )}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <Tabs defaultValue={filteredCategories[0]?.id || 'colors'} className="w-full">
                    {category === 'all' && (
                        <div className="border-b px-2 py-2">
                            <TabsList className="w-full h-8">
                                {categories.map((cat) => (
                                    <TabsTrigger
                                        key={cat.id}
                                        value={cat.id}
                                        className="flex-1 text-xs px-1"
                                    >
                                        <cat.icon className="w-3 h-3 mr-1" />
                                        {cat.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                    )}

                    {filteredCategories.map((cat) => (
                        <TabsContent key={cat.id} value={cat.id} className="mt-0">
                            <ScrollArea className="h-64 p-2">
                                <div className="grid gap-1">
                                    {Object.entries(theme[cat.id as keyof DesignTokenMap] || {}).map(
                                        ([key, tokenValue]) => {
                                            const path = `${cat.id}.${key}`;
                                            const isSelected = value === path;

                                            return (
                                                <Button
                                                    key={path}
                                                    variant={isSelected ? 'secondary' : 'ghost'}
                                                    className="justify-start h-8 px-2 w-full text-sm font-normal"
                                                    onClick={() => onChange(path)}
                                                >
                                                    {cat.id === 'colors' && (
                                                        <div
                                                            className="w-4 h-4 rounded border mr-2"
                                                            style={{
                                                                backgroundColor: tokenValue as string,
                                                            }}
                                                        />
                                                    )}
                                                    <span className="flex-1 truncate">{key}</span>
                                                    {typeof tokenValue === 'string' && (
                                                        <span className="text-xs text-muted-foreground opacity-50 truncate max-w-[80px]">
                                                            {tokenValue}
                                                        </span>
                                                    )}
                                                </Button>
                                            );
                                        }
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
