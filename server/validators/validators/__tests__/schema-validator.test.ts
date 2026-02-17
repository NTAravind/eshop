
import {
    validateCustomData,
    filterCustomDataForStorefront,
    validateSchemaDefinition,
    type SchemaDefinition,
} from '../schema-validator';

describe('schema-validator', () => {
    const testSchema: SchemaDefinition = {
        fields: [
            {
                key: 'brand',
                label: 'Brand',
                type: 'string',
                required: true,
                adminOnly: false,
                storefrontVisible: true,
            },
            {
                key: 'material',
                label: 'Material',
                type: 'enum',
                options: ['Cotton', 'Polyester', 'Silk'],
                required: false,
                adminOnly: false,
                storefrontVisible: true,
            },
            {
                key: 'price',
                label: 'Cost Price',
                type: 'number',
                required: false,
                adminOnly: true,
                storefrontVisible: false,
                min: 0,
            },
            {
                key: 'inStock',
                label: 'In Stock',
                type: 'boolean',
                required: false,
                adminOnly: false,
                storefrontVisible: true,
            },
            {
                key: 'launchDate',
                label: 'Launch Date',
                type: 'date',
                required: false,
                adminOnly: false,
                storefrontVisible: true,
            },
        ],
    };

    describe('validateCustomData', () => {
        it('should validate valid data', () => {
            const customData = {
                brand: 'Nike',
                material: 'Cotton',
                price: 1000,
                inStock: true,
                launchDate: '2024-01-01',
            };

            const result = validateCustomData(customData, testSchema, 'admin');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail on missing required field', () => {
            const customData = {
                material: 'Cotton',
            };

            const result = validateCustomData(customData, testSchema, 'admin');
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('brand');
        });

        it('should fail on invalid enum value', () => {
            const customData = {
                brand: 'Nike',
                material: 'Leather', // Not in enum options
            };

            const result = validateCustomData(customData, testSchema, 'admin');
            expect(result.valid).toBe(false);
            expect(result.errors[0].field).toBe('material');
        });

        it('should fail on invalid type', () => {
            const customData = {
                brand: 'Nike',
                price: 'expensive', // Should be number
            };

            const result = validateCustomData(customData, testSchema, 'admin');
            expect(result.valid).toBe(false);
            expect(result.errors[0].field).toBe('price');
        });

        it('should validate number constraints', () => {
            const customData = {
                brand: 'Nike',
                price: -100, // Below min
            };

            const result = validateCustomData(customData, testSchema, 'admin');
            expect(result.valid).toBe(false);
            expect(result.errors[0].field).toBe('price');
        });

        it('should skip adminOnly fields in storefront context', () => {
            const customData = {
                // Missing brand (required)
                price: 1000, // adminOnly, should be skipped
            };

            const result = validateCustomData(customData, testSchema, 'storefront');
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('brand');
        });
    });

    describe('filterCustomDataForStorefront', () => {
        it('should remove adminOnly fields', () => {
            const customData = {
                brand: 'Nike',
                material: 'Cotton',
                price: 1000, // adminOnly
                inStock: true,
            };

            const filtered = filterCustomDataForStorefront(customData, testSchema);
            expect(filtered).toEqual({
                brand: 'Nike',
                material: 'Cotton',
                inStock: true,
            });
            expect(filtered.price).toBeUndefined();
        });
    });

    describe('validateSchemaDefinition', () => {
        it('should validate valid schema', () => {
            const result = validateSchemaDefinition(testSchema);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should fail on missing fields array', () => {
            const invalidSchema = { notFields: [] };
            const result = validateSchemaDefinition(invalidSchema);
            expect(result.valid).toBe(false);
        });

        it('should fail on duplicate field keys', () => {
            const invalidSchema = {
                fields: [
                    {
                        key: 'brand',
                        label: 'Brand',
                        type: 'string',
                        required: true,
                        adminOnly: false,
                        storefrontVisible: true,
                    },
                    {
                        key: 'brand', // Duplicate
                        label: 'Brand 2',
                        type: 'string',
                        required: true,
                        adminOnly: false,
                        storefrontVisible: true,
                    },
                ],
            };

            const result = validateSchemaDefinition(invalidSchema);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true);
        });

        it('should fail on invalid field type', () => {
            const invalidSchema = {
                fields: [
                    {
                        key: 'brand',
                        label: 'Brand',
                        type: 'invalid_type',
                        required: true,
                        adminOnly: false,
                        storefrontVisible: true,
                    },
                ],
            };

            const result = validateSchemaDefinition(invalidSchema);
            expect(result.valid).toBe(false);
        });

        it('should fail on enum without options', () => {
            const invalidSchema = {
                fields: [
                    {
                        key: 'material',
                        label: 'Material',
                        type: 'enum',
                        required: true,
                        adminOnly: false,
                        storefrontVisible: true,
                        // Missing options
                    },
                ],
            };

            const result = validateSchemaDefinition(invalidSchema);
            expect(result.valid).toBe(false);
        });
    });
});
