'use client';

import React from 'react';
import { useValidationStore, selectTotalIssueCount } from '@/modules/builder/stores/validation-store';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/shared/utils';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { ValidationIssue } from '@/modules/storefront/publish-validator';

export function ProblemsPanel() {
    const issues = useValidationStore((s) => s.issues);
    const selectedIssueIndex = useValidationStore((s) => s.selectedIssueIndex);
    const selectIssue = useValidationStore((s) => s.selectIssue);
    const runValidation = useValidationStore((s) => s.runValidation);

    // We might need access to validity state to trigger re-run manually
    // For now auto-validation handles it.

    if (issues.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <CheckCircle className="w-8 h-8 mb-2 text-green-500/50" />
                <p className="text-sm">No validation issues found.</p>
                <p className="text-xs opacity-70">Your store is ready to publish.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Problems
                    </h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        {issues.length}
                    </Badge>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col">
                    {issues.map((issue, index) => (
                        <ValidationIssueItem
                            key={`${issue.nodeId}-${index}`}
                            issue={issue}
                            selected={index === selectedIssueIndex}
                            onClick={() => selectIssue(index)}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function ValidationIssueItem({
    issue,
    selected,
    onClick
}: {
    issue: ValidationIssue;
    selected: boolean;
    onClick: () => void
}) {
    const Icon = issue.level === 'error' ? XCircle : AlertTriangle;
    const colorClass = issue.level === 'error' ? 'text-destructive' : 'text-amber-500';
    const bgClass = issue.level === 'error' ? 'bg-destructive/5' : 'bg-amber-50';

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 text-sm cursor-pointer border-b border-border/40 hover:bg-muted/50 transition-colors",
                selected && "bg-muted shadow-inner border-l-2 border-l-primary"
            )}
            onClick={onClick}
        >
            {issue.level === 'error' ? (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-xs mb-0.5">
                    {issue.message}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono bg-muted px-1 rounded">
                        {issue.nodeId}
                    </span>
                    {issue.path && (
                        <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{issue.path}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
