/**
 * Action Pipeline System — V2 Architecture
 *
 * Replaces single ActionRef dispatches with ordered, multi-step pipelines.
 * Supports conditions (via BindingExpr), error strategies, and migration
 * from legacy ActionRef format.
 */

import type {
    ActionPipeline,
    ActionStep,
    ActionRef,
    ActionResult,
    StepResult,
    BindingExpr,
    BindingContext,
    RuntimeContext,
} from '@/types/storefront-builder';
import { resolveBindingExpr } from '../binding-ast';
import { resolvePayloadBindings } from '../bindings';

// ==================== TYPES ====================

/** Dispatcher function — dispatches a single action step */
export type StepDispatcher = (
    actionId: string,
    payload: Record<string, unknown>,
    context: RuntimeContext | BindingContext
) => Promise<{ success: boolean; data?: unknown; error?: string }>;

// ==================== PIPELINE DISPATCH ====================

/**
 * Execute an ActionPipeline — run steps in sequence with condition evaluation.
 *
 * Each step:
 * 1. Evaluate condition (skip if falsy)
 * 2. Resolve payload bindings (AST-based)
 * 3. Dispatch via the provided StepDispatcher
 * 4. Handle errors per pipeline.onError strategy
 */
export async function dispatchPipeline(
    pipeline: ActionPipeline,
    context: BindingContext,
    dispatcher: StepDispatcher
): Promise<ActionResult> {
    const stepResults: StepResult[] = [];
    const errorStrategy = pipeline.onError ?? 'stop';

    for (const step of pipeline.steps) {
        const startTime = Date.now();

        // 1. Evaluate condition
        if (step.condition) {
            const conditionResult = resolveBindingExpr(step.condition, context);
            if (!conditionResult) {
                stepResults.push({
                    actionId: step.actionId,
                    success: true,
                    data: { skipped: true, reason: 'condition_false' },
                    durationMs: Date.now() - startTime,
                });
                continue;
            }
        }

        // 2. Resolve payload bindings
        let resolvedPayload = step.payload ? { ...step.payload } : {};
        if (step.payloadBindings) {
            for (const [key, expr] of Object.entries(step.payloadBindings)) {
                const value = resolveBindingExpr(expr, context);
                if (value !== undefined) {
                    resolvedPayload[key] = value;
                }
            }
        }

        // 3. Dispatch
        try {
            const result = await dispatcher(step.actionId, resolvedPayload, context);
            stepResults.push({
                actionId: step.actionId,
                success: result.success,
                data: result.data,
                error: result.error,
                durationMs: Date.now() - startTime,
            });

            // 4. Handle failure
            if (!result.success) {
                switch (errorStrategy) {
                    case 'stop':
                        return {
                            success: false,
                            stepResults,
                            error: `Pipeline stopped at step "${step.actionId}": ${result.error}`,
                        };
                    case 'rollback':
                        // Rollback is a future enhancement — for now, behave like 'stop'
                        return {
                            success: false,
                            stepResults,
                            error: `Pipeline rolled back at step "${step.actionId}": ${result.error}`,
                        };
                    case 'continue':
                        // Keep going
                        break;
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            stepResults.push({
                actionId: step.actionId,
                success: false,
                error: errorMsg,
                durationMs: Date.now() - startTime,
            });

            if (errorStrategy === 'stop' || errorStrategy === 'rollback') {
                return {
                    success: false,
                    stepResults,
                    error: `Pipeline error at step "${step.actionId}": ${errorMsg}`,
                };
            }
        }
    }

    return {
        success: stepResults.every((r) => r.success || (r.data as any)?.skipped),
        stepResults,
    };
}

// Helper for step IDs
function generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== MIGRATION ====================

/**
 * Convert a legacy ActionRef to a single-step ActionPipeline.
 */
export function migrateActionRef(ref: ActionRef): ActionPipeline {
    const step: ActionStep = {
        id: generateStepId(),
        actionId: ref.actionId,
        payload: ref.payload,
    };

    // Convert legacy string payload bindings to AST BindingExpr
    if (ref.payloadBindings) {
        const bindingExprs: Record<string, BindingExpr> = {};
        for (const [key, path] of Object.entries(ref.payloadBindings)) {
            // Migrate string paths to BindingPath AST
            const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
            const root = parts[0] as any;
            const segments: (string | number)[] = parts.slice(1).map((seg) => {
                const num = parseInt(seg, 10);
                return !isNaN(num) && String(num) === seg ? num : seg;
            });
            bindingExprs[key] = { kind: 'path', root, segments };
        }
        step.payloadBindings = bindingExprs;
    }

    return {
        id: `migrated-${ref.actionId}`,
        steps: [step],
        onError: 'stop',
    };
}

/**
 * Migrate all actions in a node's V1 `actions` map to V2 `actionMap`.
 * Returns only the actionMap — does not remove the original `actions`.
 */
export function migrateNodeActions(
    actions: Record<string, ActionRef>
): Record<string, ActionPipeline> {
    const actionMap: Record<string, ActionPipeline> = {};
    for (const [event, ref] of Object.entries(actions)) {
        actionMap[event] = migrateActionRef(ref);
    }
    return actionMap;
}

// ==================== UTILITY ====================

/**
 * Create a simple single-step pipeline.
 */
export function createSimplePipeline(
    actionId: string,
    payload?: Record<string, unknown>,
    payloadBindings?: Record<string, BindingExpr>
): ActionPipeline {
    return {
        id: `pipeline-${actionId}-${Date.now()}`,
        steps: [{
            id: generateStepId(),
            actionId,
            payload,
            payloadBindings,
        }],
        onError: 'stop',
    };
}

/**
 * Create a multi-step pipeline from a list of step configs.
 */
export function createPipeline(
    id: string,
    steps: Array<{
        actionId: string;
        payload?: Record<string, unknown>;
        payloadBindings?: Record<string, BindingExpr>;
        condition?: BindingExpr;
    }>,
    onError: 'stop' | 'continue' | 'rollback' = 'stop'
): ActionPipeline {
    return {
        id,
        steps: steps.map((s) => ({
            id: generateStepId(),
            actionId: s.actionId,
            payload: s.payload,
            payloadBindings: s.payloadBindings,
            condition: s.condition,
        })),
        onError,
    };
}
