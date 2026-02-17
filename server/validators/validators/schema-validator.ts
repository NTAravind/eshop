/**
 * Schema field type definitions
 */
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'enum' | 'date';

export interface SchemaField {
    key: string;
    label: string;
    type: SchemaFieldType;
    required: boolean;
    adminOnly: boolean;
    storefrontVisible: boolean;
    options?: string[]; // For enum type
    min?: number; // For number type
    max?: number; // For number type
    minLength?: number; // For string type
    maxLength?: number; // For string type
}

export interface SchemaDefinition {
    fields: SchemaField[];
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * Validates customData against a schema definition
 */
export function validateCustomData(
    customData: Record<string, any>,
    schema: SchemaDefinition,
    context: 'admin' | 'storefront' = 'admin'
): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate each field in the schema
    for (const field of schema.fields) {
        const value = customData[field.key];

        // Skip adminOnly fields in storefront context
        if (context === 'storefront' && field.adminOnly) {
            continue;
        }

        // Check required fields
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: field.key,
                message: `${field.label} is required`,
            });
            continue;
        }

        // Skip validation if field is optional and not provided
        if (!field.required && (value === undefined || value === null)) {
            continue;
        }

        // Validate field type
        const typeValid = validateFieldType(value, field);
        if (!typeValid.valid) {
            errors.push({
                field: field.key,
                message: typeValid.error!,
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validates a single field value based on its type
 */
function validateFieldType(
    value: any,
    field: SchemaField
): { valid: boolean; error?: string } {
    switch (field.type) {
        case 'string':
            if (typeof value !== 'string') {
                return { valid: false, error: `${field.label} must be a string` };
            }
            if (field.minLength !== undefined && value.length < field.minLength) {
                return {
                    valid: false,
                    error: `${field.label} must be at least ${field.minLength} characters`,
                };
            }
            if (field.maxLength !== undefined && value.length > field.maxLength) {
                return {
                    valid: false,
                    error: `${field.label} must be at most ${field.maxLength} characters`,
                };
            }
            return { valid: true };

        case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
                return { valid: false, error: `${field.label} must be a number` };
            }
            if (field.min !== undefined && value < field.min) {
                return {
                    valid: false,
                    error: `${field.label} must be at least ${field.min}`,
                };
            }
            if (field.max !== undefined && value > field.max) {
                return {
                    valid: false,
                    error: `${field.label} must be at most ${field.max}`,
                };
            }
            return { valid: true };

        case 'boolean':
            if (typeof value !== 'boolean') {
                return { valid: false, error: `${field.label} must be a boolean` };
            }
            return { valid: true };

        case 'enum':
            if (!field.options || !Array.isArray(field.options)) {
                return { valid: false, error: `${field.label} has invalid enum options` };
            }
            if (!field.options.includes(value)) {
                return {
                    valid: false,
                    error: `${field.label} must be one of: ${field.options.join(', ')}`,
                };
            }
            return { valid: true };

        case 'date':
            // Accept ISO date strings or Date objects
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { valid: false, error: `${field.label} must be a valid date` };
            }
            return { valid: true };

        default:
            return { valid: false, error: `Unknown field type: ${field.type}` };
    }
}

/**
 * Filters customData to remove adminOnly fields for storefront
 */
export function filterCustomDataForStorefront(
    customData: Record<string, any>,
    schema: SchemaDefinition
): Record<string, any> {
    const filtered: Record<string, any> = {};

    for (const field of schema.fields) {
        if (!field.adminOnly && field.storefrontVisible && customData[field.key] !== undefined) {
            filtered[field.key] = customData[field.key];
        }
    }

    return filtered;
}

/**
 * Merges field definitions from product schema and variant schema
 */
export function mergeSchemas(
    productSchema: SchemaDefinition,
    variantSchema: SchemaDefinition
): SchemaDefinition {
    return {
        fields: [...productSchema.fields, ...variantSchema.fields],
    };
}

/**
 * Validates schema definition structure
 */
export function validateSchemaDefinition(schema: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!schema || typeof schema !== 'object') {
        errors.push({
            field: 'schema',
            message: 'Schema must be an object',
        });
        return { valid: false, errors };
    }

    if (!Array.isArray(schema.fields)) {
        errors.push({
            field: 'fields',
            message: 'Schema must have a fields array',
        });
        return { valid: false, errors };
    }

    const keys = new Set<string>();

    for (let i = 0; i < schema.fields.length; i++) {
        const field = schema.fields[i];

        // Check required properties
        if (!field.key || typeof field.key !== 'string') {
            errors.push({
                field: `fields[${i}]`,
                message: 'Field must have a valid key',
            });
        } else if (keys.has(field.key)) {
            errors.push({
                field: field.key,
                message: `Duplicate field key: ${field.key}`,
            });
        } else {
            keys.add(field.key);
        }

        if (!field.label || typeof field.label !== 'string') {
            errors.push({
                field: `fields[${i}]`,
                message: 'Field must have a valid label',
            });
        }

        if (!['string', 'number', 'boolean', 'enum', 'date'].includes(field.type)) {
            errors.push({
                field: field.key || `fields[${i}]`,
                message: `Invalid field type: ${field.type}`,
            });
        }

        if (typeof field.required !== 'boolean') {
            errors.push({
                field: field.key || `fields[${i}]`,
                message: 'Field must have a boolean required property',
            });
        }

        if (typeof field.adminOnly !== 'boolean') {
            errors.push({
                field: field.key || `fields[${i}]`,
                message: 'Field must have a boolean adminOnly property',
            });
        }

        if (typeof field.storefrontVisible !== 'boolean') {
            errors.push({
                field: field.key || `fields[${i}]`,
                message: 'Field must have a boolean storefrontVisible property',
            });
        }

        // Validate enum options
        if (field.type === 'enum') {
            if (!Array.isArray(field.options) || field.options.length === 0) {
                errors.push({
                    field: field.key || `fields[${i}]`,
                    message: 'Enum field must have at least one option',
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
