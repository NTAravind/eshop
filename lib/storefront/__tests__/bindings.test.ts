
import { validateBindingPath, resolveBinding } from '../bindings';
import { strict as assert } from 'assert';

console.log('\n🧪 Running bindings tests...\n');

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

// ==================== validateBindingPath ====================

test('validateBindingPath: valid paths', () => {
    assert.equal(validateBindingPath('store.name').valid, true);
    assert.equal(validateBindingPath('products[0].name').valid, true);
    assert.equal(validateBindingPath('a.b[1].c').valid, true);
});

test('validateBindingPath: invalid paths', () => {
    assert.equal(validateBindingPath('').valid, false);
    assert.equal(validateBindingPath('store.').valid, false);
    assert.equal(validateBindingPath('.store').valid, false);
    assert.equal(validateBindingPath('func()').valid, false);
    assert.equal(validateBindingPath('a + b').valid, false);
});

test('validateBindingPath: forbidden keys', () => {
    assert.equal(validateBindingPath('constructor').valid, false);
    assert.equal(validateBindingPath('__proto__').valid, false);
    assert.equal(validateBindingPath('obj.constructor').valid, false);
});

// ==================== resolveBinding ====================

const mockContext: any = {
    store: {
        name: 'My Store',
        currency: 'USD',
    },
    user: {
        id: 'user_1',
        profile: {
            email: 'test@example.com',
        },
    },
    collection: {
        products: [
            { id: 'p1', name: 'Product 1' },
            { id: 'p2', name: 'Product 2' },
        ],
    },
};

test('resolveBinding: simple property', () => {
    assert.equal(resolveBinding('store.name', mockContext), 'My Store');
    assert.equal(resolveBinding('store.currency', mockContext), 'USD');
});

test('resolveBinding: nested property', () => {
    assert.equal(resolveBinding('user.profile.email', mockContext), 'test@example.com');
});

test('resolveBinding: array access', () => {
    assert.equal(resolveBinding('collection.products[0].name', mockContext), 'Product 1');
    assert.equal(resolveBinding('collection.products[1].id', mockContext), 'p2');
});

test('resolveBinding: missing property returns undefined', () => {
    assert.equal(resolveBinding('store.missing', mockContext), undefined);
    assert.equal(resolveBinding('unknown.path', mockContext), undefined);
});

test('resolveBinding: repeater scope', () => {
    const scopeContext = {
        ...mockContext,
        __scope: {
            item: { id: 'p1', name: 'Product 1' },
            index: 0,
        },
    };

    assert.equal(resolveBinding('item.name', scopeContext), 'Product 1');
    assert.equal(resolveBinding('index', scopeContext), 0);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
