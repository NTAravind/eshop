"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface PrefabDoc {
    id: string;
    key: string;
    meta?: any;
}

interface PrefabPickerProps {
    value?: string;
    onChange: (value: string) => void;
    prefabType?: string;
}

export function PrefabPicker({ value, onChange, prefabType }: PrefabPickerProps) {
    const params = useParams();
    const storeId = params.storeId as string;
    const [prefabs, setPrefabs] = useState<PrefabDoc[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!storeId) return;

        const fetchPrefabs = async () => {
            try {
                setLoading(true);
                const url = new URL(`/api/admin/stores/${storeId}/prefabs`, window.location.origin);
                if (prefabType) {
                    url.searchParams.set('type', prefabType);
                }
                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('Failed to fetch prefabs');
                }
                const data = await response.json();
                setPrefabs(data);
            } catch (error) {
                console.error('Error fetching prefabs:', error);
                toast.error('Failed to load prefabs');
            } finally {
                setLoading(false);
            }
        };

        fetchPrefabs();
    }, [storeId, prefabType]);

    return (
        <Select value={value || "unselected"} onValueChange={(val) => onChange(val === "unselected" ? "" : val)}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading prefabs..." : "Select prefab"} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unselected">None</SelectItem>
                {prefabs.map((prefab) => (
                    <SelectItem key={prefab.key} value={prefab.key}>
                        {prefab.key}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
