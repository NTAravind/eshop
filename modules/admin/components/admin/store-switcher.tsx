"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Store as StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, useParams } from "next/navigation";

// Minimal type for store
interface StoreType {
    id: string;
    name: string;
    slug: string;
}

interface StoreSwitcherProps {
    items: StoreType[];
    className?: string;
}

export default function StoreSwitcher({ items = [], className }: StoreSwitcherProps) {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const params = useParams();

    // Format items
    const formattedItems = items.map((item) => ({
        label: item.name,
        value: item.id,
        slug: item.slug
    }));

    const currentStore = formattedItems.find((item) => item.value === params.storeId);

    const onStoreSelect = (store: { value: string; label: string }) => {
        setOpen(false);
        router.push(`/admin/stores/${store.value}/overview`);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a store"
                    className={cn("w-[200px] justify-between", className)}
                >
                    <StoreIcon className="mr-2 h-4 w-4" />
                    {currentStore?.label || "Select a store"}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Search store..." />
                        <CommandEmpty>No store found.</CommandEmpty>
                        <CommandGroup heading="Stores">
                            {formattedItems.map((store) => (
                                <CommandItem
                                    key={store.value}
                                    onSelect={() => onStoreSelect(store)}
                                    className="text-sm"
                                >
                                    <StoreIcon className="mr-2 h-4 w-4" />
                                    {store.label}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            currentStore?.value === store.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                onSelect={() => {
                                    setOpen(false);
                                    router.push("/admin/stores/new"); // Or trigger modal
                                }}
                                className="cursor-pointer"
                            >
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Create Store
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
