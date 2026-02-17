'use client';

import React from 'react';
import { useEditorStore } from '@/modules/builder/editor-store';
import { useValidationStore, selectTotalIssueCount, selectErrorCount, selectWarningCount } from '@/modules/builder/stores/validation-store';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, AlertCircle, Terminal, UploadCloud } from 'lucide-react';
import { ProblemsPanel } from './ProblemsPanel';

export function BottomBar() {
    const collapsed = useEditorStore((s) => s.bottomPanelCollapsed);
    const activeTab = useEditorStore((s) => s.activeBottomTab);
    const toggleCollapsed = useEditorStore((s) => s.toggleBottomPanel);
    const setActiveTab = useEditorStore((s) => s.setActiveBottomTab);

    // Validation stats
    const totalIssues = useValidationStore(selectTotalIssueCount);
    const errorCount = useValidationStore(selectErrorCount);
    const warningCount = useValidationStore(selectWarningCount);

    return (
        <div
            className={cn(
                "border-t bg-background flex flex-col transition-all duration-300 ease-in-out",
                collapsed ? "h-9" : "h-[250px]"
            )}
        >
            {/* Header / Tab Bar */}
            <div className="flex items-center justify-between h-9 px-2 bg-muted/40 border-b">
                <div className="flex items-center h-full">
                    {/* Toggle Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mr-2"
                        onClick={toggleCollapsed}
                    >
                        {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>

                    <Tabs
                        value={activeTab}
                        onValueChange={(v: any) => {
                            setActiveTab(v);
                            if (collapsed) toggleCollapsed();
                        }}
                        className="h-full"
                    >
                        <TabsList className="h-full bg-transparent p-0 gap-1 rounded-none">
                            <TabsTrigger
                                value="problems"
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-3 text-xs gap-2"
                            >
                                <AlertCircle className="w-3.5 h-3.5" />
                                Problems
                                {(totalIssues > 0) && (
                                    <span className={cn(
                                        "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                                        errorCount > 0 ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-white"
                                    )}>
                                        {totalIssues}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="console"
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-3 text-xs gap-2"
                            >
                                <Terminal className="w-3.5 h-3.5" />
                                Console
                            </TabsTrigger>
                            <TabsTrigger
                                value="publish"
                                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background px-3 text-xs gap-2"
                            >
                                <UploadCloud className="w-3.5 h-3.5" />
                                Publish Log
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content Area */}
            {!collapsed && (
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'problems' && <ProblemsPanel />}
                    {activeTab === 'console' && (
                        <div className="p-4 text-xs font-mono text-muted-foreground">
                            Console output will appear here...
                        </div>
                    )}
                    {activeTab === 'publish' && (
                        <div className="p-4 text-xs font-mono text-muted-foreground">
                            Review publish history and snapshots here...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
