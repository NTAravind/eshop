'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Upload, X, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ImagePickerProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
}

export function ImagePicker({ value, onChange, label }: ImagePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [urlInput, setUrlInput] = React.useState(value || '');

    React.useEffect(() => {
        setUrlInput(value || '');
    }, [value]);

    const handleUrlSubmit = () => {
        onChange(urlInput);
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="space-y-2">
            {label && <Label className="text-xs">{label}</Label>}
            <div className="flex gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-xs font-normal h-9 relative overflow-hidden group">
                            {value ? (
                                <>
                                    <div className="absolute inset-0 bg-muted/50 group-hover:bg-muted/70 transition-colors z-0" />
                                    <img src={value} alt="Preview" className="h-6 w-6 object-cover rounded mr-2 z-10 bg-background" />
                                    <span className="truncate z-10 flex-1 text-left">{value}</span>
                                    <div
                                        role="button"
                                        onClick={handleClear}
                                        className="h-9 w-9 flex items-center justify-center absolute right-0 top-0 z-20 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-l-none"
                                    >
                                        <X className="h-3 w-3" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="text-muted-foreground">Select image...</span>
                                </>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Select Image</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="url" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="url">Link URL</TabsTrigger>
                                <TabsTrigger value="upload" disabled>Upload (Coming Soon)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="url" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleUrlSubmit}>
                                        Use Image
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="upload" className="pt-4">
                                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                    Upload not implemented yet
                                </div>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
