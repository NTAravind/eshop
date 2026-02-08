
import { validateDocument } from '../validation';
import { strict as assert } from 'assert';
import type { StorefrontNode } from '@/types/storefront-builder';

console.log('\n🧪 Running validation tests...\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${name}`);
        console.error(e);
        failed++;
    }
}

// Helper to create a basic valid node
const createNode = (overrides: Partial<StorefrontNode> = {}): StorefrontNode => ({
    id: 'test_node',
    type: 'Container', // Valid type
    props: {},
    ...overrides,
});

// ==================== Basic Validation ====================

test('validateDocument: valid simple tree', () => {
    const tree = createNode();
    const result = validateDocument(tree);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
});

test('validateDocument: missing ID', () => {
    const tree = createNode({ id: undefined as any });
    const result = validateDocument(tree);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Node must have a valid string ID')));
});

test('validateDocument: missing type', () => {
    const tree = createNode({ type: undefined as any });
    const result = validateDocument(tree);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Node must have a valid type')));
});

test('validateDocument: invalid type', () => {
    const tree = createNode({ type: 'InvalidComponent' });
    const result = validateDocument(tree);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Unknown component type')));
});

// ==================== Props Validation ====================

test('validateDocument: invalid props', () => {
    const tree = createNode({ props: 'not an object' as any });
    const result = validateDocument(tree);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Props must be an object')));
});

// ==================== Bindings Validation ====================

test('validateDocument: valid binding', () => {
    const tree = createNode({
        bindings: { text: 'store.name' },
        type: 'Text',
    });
    const result = validateDocument(tree);
    assert.equal(result.valid, true);
});

test('validateDocument: invalid binding path', () => {
    const tree = createNode({
        bindings: { text: 'invalid+' },
        type: 'Text',
    });
    const result = validateDocument(tree);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Expressions are not allowed')));
});

// ==================== Layout Validation ====================

test('validateDocument: layout missing Slot', () => {
    const tree = createNode();
    const result = validateDocument(tree, 'LAYOUT');
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('Layout documents must contain a Slot')));
});

test('validateDocument: layout with Slot', () => {
    const tree = createNode({
        children: [
            createNode({ id: 'content_slot', type: 'Slot' }),
        ],
    });
    const result = validateDocument(tree, 'LAYOUT');
    assert.equal(result.valid, true);
});

// ==================== Recursive Validation ====================

test('validateDocument: invalid child node', () => {
    const tree = createNode({
        children: [
            createNode({ id: undefined as any }), // Invalid child
        ],
    });
    const result = validateDocument(tree);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('children[0]: Node must have a valid string ID')));
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
