/**
 * Data Profile Loader — V2 Architecture
 *
 * Loads data for a resolved route based on its DataProfile configuration.
 * Executes data sources and returns the assembled context data for the page.
 */

import type {
    DataProfile,
    DataSource,
} from '@/types/storefront-builder';

// ==================== TYPES ====================

export interface DataProfileResult {
    data: Record<string, unknown>;
    errors: DataLoadError[];
    durationMs: number;
}

export interface DataLoadError {
    kind: string;
    contextKey: string;
    error: string;
}

/**
 * Data source executor — takes a DataSource and route params,
 * returns the resolved data. Implementations are injected by the caller.
 */
export type DataSourceExecutor = (
    source: DataSource,
    params: Record<string, string>
) => Promise<unknown>;

// ==================== PROFILE LOADING ====================

/**
 * Execute all data sources in a DataProfile and return assembled data.
 * Sources are executed in parallel. Individual failures don't block others.
 */
export async function loadDataProfile(
    profile: DataProfile,
    routeParams: Record<string, string>,
    executor: DataSourceExecutor
): Promise<DataProfileResult> {
    const startTime = Date.now();
    const data: Record<string, unknown> = {};
    const errors: DataLoadError[] = [];

    const results = await Promise.allSettled(
        profile.sources.map(async (source) => {
            const result = await executor(source, routeParams);
            return { source, result };
        })
    );

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const source = profile.sources[i];
        const contextKey = getContextKey(source);

        if (result.status === 'fulfilled') {
            data[contextKey] = result.value.result;
        } else {
            errors.push({
                kind: source.kind,
                contextKey,
                error: result.reason instanceof Error
                    ? result.reason.message
                    : String(result.reason),
            });
        }
    }

    return {
        data,
        errors,
        durationMs: Date.now() - startTime,
    };
}

// ==================== HELPERS ====================

/**
 * Extract the context key from a DataSource.
 * Each source kind writes to a specific context key.
 */
function getContextKey(source: DataSource): string {
    switch (source.kind) {
        case 'CollectionByHandle':
        case 'CollectionByTag':
            return source.contextKey; // 'collection'
        case 'ProductByHandle':
            return source.contextKey; // 'product'
        case 'Orders':
            return source.contextKey; // 'orders'
        case 'StaticPage':
            return 'staticPage';
        default:
            return 'unknown';
    }
}

// ==================== COMPOSITE EXECUTOR ====================

/**
 * Create a composite executor that delegates to kind-specific executors.
 */
export function createExecutor(
    executors: Partial<Record<DataSource['kind'], DataSourceExecutor>>
): DataSourceExecutor {
    return async (source, params) => {
        const executor = executors[source.kind];
        if (!executor) {
            throw new Error(`No executor for data source kind: "${source.kind}"`);
        }
        return executor(source, params);
    };
}

// ==================== VALIDATION ====================

/**
 * Validate a DataProfile configuration.
 */
export function validateDataProfile(
    profile: DataProfile
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.id) {
        errors.push('DataProfile must have an id');
    }

    if (!profile.displayName) {
        errors.push('DataProfile must have a displayName');
    }

    if (!Array.isArray(profile.sources) || profile.sources.length === 0) {
        errors.push('DataProfile must have at least one data source');
    }

    // Check for duplicate contextKeys
    const contextKeys = new Set<string>();
    for (const source of profile.sources) {
        const key = getContextKey(source);
        if (contextKeys.has(key)) {
            errors.push(`Duplicate contextKey: "${key}"`);
        }
        contextKeys.add(key);
    }

    return { valid: errors.length === 0, errors };
}
