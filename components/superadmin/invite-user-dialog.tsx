'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { inviteAccountUserAction } from '@/app/superadmin/actions/superadmin.actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InviteUserDialogProps {
    defaultAccountId?: string;
    // Allow external control if needed
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function InviteUserDialog({
    defaultAccountId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: InviteUserDialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setUncontrolledOpen;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        accountId: defaultAccountId || '',
        email: '',
        role: 'OWNER',
    });

    // Update local state when defaultAccountId changes (if using it as initial value)
    // useEffect(() => {
    //     if (defaultAccountId) setFormData(prev => ({ ...prev, accountId: defaultAccountId }));
    // }, [defaultAccountId]);
    // Better to use key to reset or just rely on prop.

    // We update accountId in render if it's empty and prop is provided? 
    // No, better to strict sync or let user type. 
    // If opened via row action, defaultAccountId is passed.

    // If open changes to true, reset form?
    // Let's keep it simple. If defaultAccountId is passed, we use it.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Use prop if state is empty (fallback)
        const targetAccountId = formData.accountId || defaultAccountId;

        if (!targetAccountId || !formData.email) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await inviteAccountUserAction({
                accountId: targetAccountId,
                email: formData.email,
                role: formData.role,
            });

            if (result.success) {
                toast.success('Invitation sent successfully!');
                setOpen(false);
                setFormData({ accountId: '', email: '', role: 'OWNER' });
                // No need to reload page usually, but maybe to show updated list if we showed invites?
                // Accounts list doesn't show invites.
            } else {
                toast.error(result.error || 'Failed to send invitation');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error('Invite error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Invite User
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Invite User to Account</DialogTitle>
                        <DialogDescription>
                            Send an email invitation to join the billing account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="inviteAccountId">Account ID</Label>
                            <Input
                                id="inviteAccountId"
                                placeholder="Account ID"
                                value={formData.accountId || defaultAccountId || ''}
                                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                // If default provided, maybe read-only? 
                                // flexible: allow edit
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="inviteEmail">Email Address</Label>
                            <Input
                                id="inviteEmail"
                                type="email"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OWNER">Owner (Admin)</SelectItem>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
