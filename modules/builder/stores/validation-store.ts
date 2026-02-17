/**
 * Validation Store — V2 Builder UI
 *
 * Runs publish-validator on tree changes (debounced) and exposes
 * the validation result + issue list for the Problems panel.
 */

import { create } from 'zustand';
import type { ValidationResult, ValidationIssue } from '@/modules/storefront/publish-validator';
import { validateDocument } from '@/modules/storefront/publish-validator';
import type { StorefrontNode, DesignTokenMap } from '@/types/storefront-builder';

// ==================== STORE ====================

interface ValidationState {
    /** Last validation result */
    result: ValidationResult | null;
    /** Flat list of all issues (errors + warnings) */
    issues: ValidationIssue[];
    /** Whether auto-validation is enabled */
    autoValidateEnabled: boolean;
    /** Whether a validation is currently running */
    isValidating: boolean;
    /** Selected issue ID (for highlighting) */
    selectedIssueIndex: number | null;
}

interface ValidationActions {
    /** Run validation manually */
    runValidation: (tree: StorefrontNode, theme?: DesignTokenMap) => void;
    /** Toggle auto-validation */
    setAutoValidate: (enabled: boolean) => void;
    /** Clear all issues */
    clearIssues: () => void;
    /** Select an issue (for click-to-navigate) */
    selectIssue: (index: number | null) => void;
}

export type ValidationStore = ValidationState & ValidationActions;

const initialState: ValidationState = {
    result: null,
    issues: [],
    autoValidateEnabled: true,
    isValidating: false,
    selectedIssueIndex: null,
};

export const useValidationStore = create<ValidationStore>()((set) => ({
    ...initialState,

    runValidation(tree: StorefrontNode, theme?: DesignTokenMap) {
        set({ isValidating: true });

        // We use setTimeout to push this to the next tick to avoid blocking UI
        setTimeout(() => {
            try {
                const result = validateDocument(tree, theme);
                const issues: ValidationIssue[] = [
                    ...result.errors,
                    ...result.warnings,
                ];

                set({
                    result,
                    issues,
                    isValidating: false,
                });
            } catch (err) {
                console.error('Validation failed:', err);
                set({ isValidating: false });
            }
        }, 0);
    },

    setAutoValidate(enabled: boolean) {
        set({ autoValidateEnabled: enabled });
    },

    clearIssues() {
        set({ result: null, issues: [], selectedIssueIndex: null });
    },

    selectIssue(index: number | null) {
        set({ selectedIssueIndex: index });
    },
}));

// ==================== SELECTORS ====================

export const selectErrorCount = (s: ValidationStore) =>
    s.result?.errors.length ?? 0;

export const selectWarningCount = (s: ValidationStore) =>
    s.result?.warnings.length ?? 0;

export const selectTotalIssueCount = (s: ValidationStore) =>
    s.issues.length;

export const selectIsValid = (s: ValidationStore) =>
    s.result?.valid ?? true;
