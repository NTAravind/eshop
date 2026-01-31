"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash } from "lucide-react";

interface Template {
    id: string;
    channel: string;
    eventType: string;
    whatsappTemplateName?: string;
    whatsappLanguageCode?: string;
    subject?: string;
    content?: string;
    isActive: boolean;
}

const CHANNELS = ["WHATSAPP", "EMAIL", "WEB_PUSH", "MOBILE_PUSH"];
const EVENT_TYPES = [
    "ORDER_CREATED",
    "ORDER_COMPLETE",
    "ORDER_CANCELLED",
    "PAYMENT_RECEIVED",
    "PAYMENT_FAILED",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "PROMOTION",
    "OFFER"
];

export function TemplatesClient({ storeId }: { storeId: string }) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        channel: "WHATSAPP",
        eventType: "ORDER_CREATED",
        whatsappTemplateName: "",
        whatsappLanguageCode: "en",
        subject: "",
        content: "",
        isActive: true,
    });

    useEffect(() => {
        fetchTemplates();
    }, [storeId]);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`/api/stores/${storeId}/notifications/templates`);
            const data = await res.json();
            if (data.templates) {
                setTemplates(data.templates);
            }
        } catch (error) {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const res = await fetch(`/api/stores/${storeId}/notifications/templates/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Template deleted");
                fetchTemplates();
            } else {
                toast.error("Failed to delete template");
            }
        } catch (error) {
            toast.error("Error deleting template");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingTemplate
                ? `/api/stores/${storeId}/notifications/templates/${editingTemplate.id}`
                : `/api/stores/${storeId}/notifications/templates`;

            const method = editingTemplate ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save template");
            }

            toast.success(editingTemplate ? "Template updated" : "Template created");
            setIsDialogOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            channel: template.channel,
            eventType: template.eventType,
            whatsappTemplateName: template.whatsappTemplateName || "",
            whatsappLanguageCode: template.whatsappLanguageCode || "en",
            subject: template.subject || "",
            content: template.content || "",
            isActive: template.isActive,
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData({
            channel: "WHATSAPP",
            eventType: "ORDER_CREATED",
            whatsappTemplateName: "",
            whatsappLanguageCode: "en",
            subject: "",
            content: "",
            isActive: true,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Channel</label>
                                    <Select
                                        value={formData.channel}
                                        onValueChange={(val) => setFormData({ ...formData, channel: val })}
                                        disabled={!!editingTemplate}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CHANNELS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Event Type</label>
                                    <Select
                                        value={formData.eventType}
                                        onValueChange={(val) => setFormData({ ...formData, eventType: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EVENT_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {formData.channel === 'WHATSAPP' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">WhatsApp Template Name</label>
                                        <Input
                                            value={formData.whatsappTemplateName}
                                            onChange={e => setFormData({ ...formData, whatsappTemplateName: e.target.value })}
                                            placeholder="e.g. order_confirmation"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Language Code</label>
                                        <Input
                                            value={formData.whatsappLanguageCode}
                                            onChange={e => setFormData({ ...formData, whatsappLanguageCode: e.target.value })}
                                            placeholder="e.g. en_US"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {formData.channel === 'EMAIL' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Subject</label>
                                            <Input
                                                value={formData.subject}
                                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Content</label>
                                        <Textarea
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            rows={5}
                                            placeholder="Use {variable} for dynamic content"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Available variables: &#123;customerName&#125;, &#123;orderId&#125;, &#123;amount&#125;, &#123;storeName&#125;
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                                />
                                <label className="text-sm font-medium">Active</label>
                            </div>

                            <Button type="submit" className="w-full">Save Template</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Channel</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No templates found
                                </TableCell>
                            </TableRow>
                        ) : (
                            templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>{template.channel}</TableCell>
                                    <TableCell>{template.eventType}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {template.channel === 'WHATSAPP'
                                            ? template.whatsappTemplateName
                                            : template.subject || (template.content?.substring(0, 30) + '...')}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {template.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(template.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
