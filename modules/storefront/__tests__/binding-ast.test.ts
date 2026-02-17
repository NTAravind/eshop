
import { resolveBindingExpr, migrateStringBinding, validateBindingExpr, resolveBindingMap } from '../binding-ast';
import type { BindingExpr, BindingContext } from '@/types/storefront-builder';
import { strict as assert } from 'assert';

console.log('\n🧪 Running binding AST tests...\n');

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

// ==================== Mock Context ====================

const mockContext: BindingContext = {
    store: { id: 's1', name: 'My Store', slug: 'my-store', currency: 'USD', requirePhoneNumber: false },
    settings: { deliveryModes: ['DELIVERY'] },
    user: { id: 'u1', name: 'John', email: 'john@test.com', phone: null, avatarUrl: null, profile: {} },
    cart: { id: 'c1', items: [], subtotal: 0, total: 0, itemCount: 0, discountCode: null, discountTotal: 0, deliveryMode: 'DELIVERY' },
    route: { pathname: '/store/my-store', searchParams: {}, params: { slug: 'my-store' } },
    uiState: {},
    collection: {
        products: [
            { id: 'p1', name: 'Product 1', price: 29.99, images: [], variants: [], customData: {} },
            { id: 'p2', name: 'Product 2', price: 49.99, images: [], variants: [], customData: {} },
        ],
    } as any,
    __scope: {
        item: { id: 'p1', name: 'Scoped Product', price: 19.99 },
        index: 2,
    },
} as any;

// ==================== Path Resolution ====================

test('path: simple root access', () => {
    const expr: BindingExpr = { kind: 'path', root: 'store', segments: ['name'] };
    assert.equal(resolveBindingExpr(expr, mockContext), 'My Store');
});

test('path: nested access', () => {
    const expr: BindingExpr = { kind: 'path', root: 'route', segments: ['params', 'slug'] };
    assert.equal(resolveBindingExpr(expr, mockContext), 'my-store');
});

test('path: array index', () => {
    const expr: BindingExpr = { kind: 'path', root: 'collection', segments: ['products', 0, 'name'] };
    assert.equal(resolveBindingExpr(expr, mockContext), 'Product 1');
});

test('path: missing property returns undefined', () => {
    const expr: BindingExpr = { kind: 'path', root: 'store', segments: ['nonexistent'] };
    assert.equal(resolveBindingExpr(expr, mockContext), undefined);
});

test('path: repeater item scope', () => {
    const expr: BindingExpr = { kind: 'path', root: 'item', segments: ['name'] };
    assert.equal(resolveBindingExpr(expr, mockContext), 'Scoped Product');
});

test('path: repeater index scope', () => {
    const expr: BindingExpr = { kind: 'path', root: 'index', segments: [] };
    assert.equal(resolveBindingExpr(expr, mockContext), 2);
});

test('path: root only (no segments)', () => {
    const expr: BindingExpr = { kind: 'path', root: 'store', segments: [] };
    const result = resolveBindingExpr(expr, mockContext);
    assert.equal(typeof result, 'object');
    assert.equal((result as any).name, 'My Store');
});

// ==================== Literal ====================

test('literal: string', () => {
    const expr: BindingExpr = { kind: 'literal', value: 'hello' };
    assert.equal(resolveBindingExpr(expr, mockContext), 'hello');
});

test('literal: number', () => {
    const expr: BindingExpr = { kind: 'literal', value: 42 };
    assert.equal(resolveBindingExpr(expr, mockContext), 42);
});

test('literal: boolean', () => {
    const expr: BindingExpr = { kind: 'literal', value: true };
    assert.equal(resolveBindingExpr(expr, mockContext), true);
});

test('literal: null', () => {
    const expr: BindingExpr = { kind: 'literal', value: null };
    assert.equal(resolveBindingExpr(expr, mockContext), null);
});

// ==================== Conditional ====================

test('conditional: truthy test → consequent', () => {
    const expr: BindingExpr = {
        kind: 'conditional',
        test: { kind: 'path', root: 'user', segments: ['id'] },
        consequent: { kind: 'literal', value: 'logged in' },
        alternate: { kind: 'literal', value: 'guest' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'logged in');
});

test('conditional: falsy test → alternate', () => {
    const noUserContext = { ...mockContext, user: null } as any;
    const expr: BindingExpr = {
        kind: 'conditional',
        test: { kind: 'path', root: 'user', segments: [] },
        consequent: { kind: 'literal', value: 'logged in' },
        alternate: { kind: 'literal', value: 'guest' },
    };
    assert.equal(resolveBindingExpr(expr, noUserContext), 'guest');
});

// ==================== Transform ====================

test('transform: uppercase', () => {
    const expr: BindingExpr = {
        kind: 'transform',
        transformId: 'uppercase',
        input: { kind: 'path', root: 'store', segments: ['name'] },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'MY STORE');
});

test('transform: lowercase', () => {
    const expr: BindingExpr = {
        kind: 'transform',
        transformId: 'lowercase',
        input: { kind: 'literal', value: 'HELLO' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'hello');
});

test('transform: formatCurrency', () => {
    const expr: BindingExpr = {
        kind: 'transform',
        transformId: 'formatCurrency',
        input: { kind: 'path', root: 'item', segments: ['price'] },
        params: { currency: 'USD', locale: 'en-US' },
    };
    const result = resolveBindingExpr(expr, mockContext);
    assert.equal(typeof result, 'string');
    assert.ok((result as string).includes('19.99'));
});

test('transform: pluralize', () => {
    const expr: BindingExpr = {
        kind: 'transform',
        transformId: 'pluralize',
        input: { kind: 'literal', value: 1 },
        params: { singular: 'item', plural: 'items' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), '1 item');

    const plural: BindingExpr = { ...expr, input: { kind: 'literal', value: 3 } };
    assert.equal(resolveBindingExpr(plural, mockContext), '3 items');
});

test('transform: not', () => {
    const expr: BindingExpr = {
        kind: 'transform',
        transformId: 'not',
        input: { kind: 'literal', value: false },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), true);
});

test('transform: unknown transform returns input', () => {
    const expr: BindingExpr = {
        kind: 'transform',
        transformId: 'nonexistent',
        input: { kind: 'literal', value: 'test' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'test');
});

// ==================== Fallback ====================

test('fallback: primary exists → use primary', () => {
    const expr: BindingExpr = {
        kind: 'fallback',
        primary: { kind: 'path', root: 'store', segments: ['name'] },
        fallback: { kind: 'literal', value: 'Default Store' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'My Store');
});

test('fallback: primary undefined → use fallback', () => {
    const expr: BindingExpr = {
        kind: 'fallback',
        primary: { kind: 'path', root: 'store', segments: ['nonexistent'] },
        fallback: { kind: 'literal', value: 'Default Value' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'Default Value');
});

test('fallback: primary null → use fallback', () => {
    const expr: BindingExpr = {
        kind: 'fallback',
        primary: { kind: 'literal', value: null },
        fallback: { kind: 'literal', value: 'Default Value' },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'Default Value');
});

// ==================== resolveBindingMap ====================

test('resolveBindingMap: resolves multiple bindings', () => {
    const map: Record<string, BindingExpr> = {
        title: { kind: 'path', root: 'store', segments: ['name'] },
        subtitle: { kind: 'literal', value: 'Welcome!' },
    };
    const result = resolveBindingMap(map, mockContext);
    assert.equal(result.title, 'My Store');
    assert.equal(result.subtitle, 'Welcome!');
});

// ==================== Migration ====================

test('migrateStringBinding: simple path', () => {
    const result = migrateStringBinding('store.name');
    assert.equal(result.kind, 'path');
    assert.equal(result.root, 'store');
    assert.deepEqual(result.segments, ['name']);
});

test('migrateStringBinding: nested path', () => {
    const result = migrateStringBinding('user.profile.email');
    assert.equal(result.root, 'user');
    assert.deepEqual(result.segments, ['profile', 'email']);
});

test('migrateStringBinding: array access', () => {
    const result = migrateStringBinding('collection.products[0].name');
    assert.equal(result.root, 'collection');
    assert.deepEqual(result.segments, ['products', 0, 'name']);
});

test('migrateStringBinding: root only', () => {
    const result = migrateStringBinding('store');
    assert.equal(result.root, 'store');
    assert.deepEqual(result.segments, []);
});

test('migrateStringBinding: migrated path resolves correctly', () => {
    const migrated = migrateStringBinding('store.name');
    assert.equal(resolveBindingExpr(migrated, mockContext), 'My Store');
});

test('migrateStringBinding: migrated array path resolves correctly', () => {
    const migrated = migrateStringBinding('collection.products[1].name');
    assert.equal(resolveBindingExpr(migrated, mockContext), 'Product 2');
});

test('migrateStringBinding: migrated repeater scope resolves correctly', () => {
    const migrated = migrateStringBinding('item.name');
    assert.equal(resolveBindingExpr(migrated, mockContext), 'Scoped Product');
});

// ==================== Validation ====================

test('validateBindingExpr: valid path', () => {
    const result = validateBindingExpr({ kind: 'path', root: 'store', segments: ['name'] });
    assert.equal(result.valid, true);
});

test('validateBindingExpr: forbidden key', () => {
    const result = validateBindingExpr({ kind: 'path', root: 'store', segments: ['__proto__'] });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('Forbidden'));
});

test('validateBindingExpr: valid conditional', () => {
    const result = validateBindingExpr({
        kind: 'conditional',
        test: { kind: 'path', root: 'user', segments: [] },
        consequent: { kind: 'literal', value: 'yes' },
        alternate: { kind: 'literal', value: 'no' },
    });
    assert.equal(result.valid, true);
});

test('validateBindingExpr: valid fallback', () => {
    const result = validateBindingExpr({
        kind: 'fallback',
        primary: { kind: 'path', root: 'store', segments: ['name'] },
        fallback: { kind: 'literal', value: 'default' },
    });
    assert.equal(result.valid, true);
});

test('validateBindingExpr: exceeds max depth', () => {
    // Build a deeply nested conditional
    let expr: BindingExpr = { kind: 'literal', value: 'deep' };
    for (let i = 0; i < 7; i++) {
        expr = {
            kind: 'conditional',
            test: { kind: 'literal', value: true },
            consequent: expr,
            alternate: { kind: 'literal', value: 'alt' },
        };
    }
    const result = validateBindingExpr(expr);
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes('max depth'));
});

test('validateBindingExpr: missing kind', () => {
    const result = validateBindingExpr({} as any);
    assert.equal(result.valid, false);
});

// ==================== Complex / Composed Expressions ====================

test('composed: fallback with transform', () => {
    const expr: BindingExpr = {
        kind: 'fallback',
        primary: { kind: 'path', root: 'store', segments: ['nonexistent'] },
        fallback: {
            kind: 'transform',
            transformId: 'uppercase',
            input: { kind: 'literal', value: 'fallback value' },
        },
    };
    assert.equal(resolveBindingExpr(expr, mockContext), 'FALLBACK VALUE');
});

test('composed: conditional with transform', () => {
    const expr: BindingExpr = {
        kind: 'conditional',
        test: { kind: 'path', root: 'cart', segments: ['itemCount'] },
        consequent: {
            kind: 'transform',
            transformId: 'pluralize',
            input: { kind: 'path', root: 'cart', segments: ['itemCount'] },
            params: { singular: 'item', plural: 'items' },
        },
        alternate: { kind: 'literal', value: 'Cart is empty' },
    };
    // cart.itemCount is 0, which is falsy
    assert.equal(resolveBindingExpr(expr, mockContext), 'Cart is empty');
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
