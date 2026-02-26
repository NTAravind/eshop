'use server';

import prisma from "@/server/db/prisma";
import { revalidatePath } from "next/cache";
import {
    defaultGlobalLayout,
    defaultHomePage,
    defaultTheme,
    defaultCollectionPage,
    defaultPdpTemplate,
    defaultCheckoutPage,
    defaultOrdersPage,
    defaultProfilePage,
    defaultLoginPage,
} from "@/modules/storefront/defaults";
import { productCardPrefab } from "@/modules/storefront/defaults/prefabs/product-card";
import { navbarPrefab, cartSidebarPrefab, orderCardPrefab } from "@/modules/storefront/defaults/prefabs";
import { StorefrontDocKind, StorefrontDocStatus } from "@/app/generated/prisma";

type VariantSeed = {
    sku: string;
    price: number;
    stock: number;
    customData?: Record<string, unknown>;
    images?: string[];
};

type ProductSeed = {
    name: string;
    description?: string;
    categoryId?: string;
    productSchemaId?: string;
    customData?: Record<string, unknown>;
    variants: VariantSeed[];
    images: string[];
};

// Sample Data Definitions
const CLOTHING_SCHEMA = {
    name: "Clothing",
    fields: [
        { name: "material", key: "material", type: "text", label: "Material" },
        { name: "care_instructions", key: "care_instructions", type: "textarea", label: "Care Instructions" },
        { name: "fit", key: "fit", type: "select", label: "Fit", options: ["Slim", "Regular", "Loose"] }
    ]
};

const ELECTRONICS_SCHEMA = {
    name: "Electronics",
    fields: [
        { name: "warranty", key: "warranty", type: "text", label: "Warranty Period" },
        { name: "voltage", key: "voltage", type: "number", label: "Voltage (V)" },
        { name: "box_contents", key: "box_contents", type: "textarea", label: "Box Contents" }
    ]
};

const CART_PLACEHOLDER = { id: "cart-root", type: "Container", props: {}, styles: {}, children: [] };

export async function seedStore(storeId: string) {
    if (!storeId) return { success: false, error: "Store ID is required" };

    try {
        console.log(`Starting seed for store: ${storeId}`);

        // 1. Create Product Schemas
        const clothingSchema = await prisma.productSchema.upsert({
            where: { storeId_name_version: { storeId, name: "Clothing", version: 1 } },
            update: {},
            create: {
                storeId,
                name: "Clothing",
                version: 1,
                fields: CLOTHING_SCHEMA.fields
            }
        });

        const electronicsSchema = await prisma.productSchema.upsert({
            where: { storeId_name_version: { storeId, name: "Electronics", version: 1 } },
            update: {},
            create: {
                storeId,
                name: "Electronics",
                version: 1,
                fields: ELECTRONICS_SCHEMA.fields
            }
        });

        // 2. Create Categories
        await createCategoryIfNotExists(storeId, "Men", "men");
        const menCategory = await prisma.category.findFirstOrThrow({
            where: { storeId, slug: "men", deletedAt: null }
        });

        await createCategoryIfNotExists(storeId, "Women", "women");
        const womenCategory = await prisma.category.findFirstOrThrow({
            where: { storeId, slug: "women", deletedAt: null }
        });

        await createCategoryIfNotExists(storeId, "Tech", "tech");
        const techCategory = await prisma.category.findFirstOrThrow({
            where: { storeId, slug: "tech", deletedAt: null }
        });

        // 3. Create Products
        // Product 1: T-Shirt (Clothing)
        await createProductIfNotExists(storeId, {
            name: "Classic Cotton T-Shirt",
            description: "A comfortable everyday essential made from 100% organic cotton.",
            categoryId: menCategory.id,
            productSchemaId: clothingSchema.id,
            customData: { material: "100% Cotton", care_instructions: "Machine wash cold", fit: "Regular" },
            variants: [
                { sku: "TSHIRT-BLK-S", price: 2999, stock: 50, customData: { color: "Black", size: "S" } },
                { sku: "TSHIRT-BLK-M", price: 2999, stock: 45, customData: { color: "Black", size: "M" } },
                { sku: "TSHIRT-WHT-M", price: 2999, stock: 60, customData: { color: "White", size: "M" } }
            ],
            images: [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800"
            ]
        });

        // Product 2: Denim Jacket (Clothing)
        await createProductIfNotExists(storeId, {
            name: "Vintage Denim Jacket",
            description: "Rugged and stylish denim jacket with a vintage wash.",
            categoryId: womenCategory.id,
            productSchemaId: clothingSchema.id,
            customData: { material: "Denim", care_instructions: "Dry clean only", fit: "Loose" },
            variants: [
                { sku: "DENIM-BLU-S", price: 8999, stock: 20, customData: { color: "Blue", size: "S" } },
                { sku: "DENIM-BLU-M", price: 8999, stock: 15, customData: { color: "Blue", size: "M" } }
            ],
            images: [
                "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800"
            ]
        });

        // Product 3: Wireless Headphones (Electronics)
        await createProductIfNotExists(storeId, {
            name: "Noise Cancelling Headphones",
            description: "Immersive sound with active noise cancellation and 30-hour battery life.",
            categoryId: techCategory.id,
            productSchemaId: electronicsSchema.id,
            customData: { warranty: "2 Years", voltage: 5, box_contents: "Headphones, USB-C Cable, Case" },
            variants: [
                { sku: "HEADPHONE-BLK", price: 24999, stock: 100, customData: { color: "Black" } },
                { sku: "HEADPHONE-SLV", price: 24999, stock: 80, customData: { color: "Silver" } }
            ],
            images: [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=800"
            ]
        });

        // Product 4: Smart Watch (Electronics)
        await createProductIfNotExists(storeId, {
            name: "Series 7 Smart Watch",
            description: "Stay connected and track your fitness with our latest smart watch.",
            categoryId: techCategory.id,
            productSchemaId: electronicsSchema.id,
            customData: { warranty: "1 Year", voltage: 5, box_contents: "Watch, Band, Charger" },
            variants: [
                { sku: "WATCH-BLK", price: 39999, stock: 30, customData: { color: "Graphite" } }
            ],
            images: [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
            ]
        });

        // Product 5: Local Test Item (Valid URLs)
        await createProductIfNotExists(storeId, {
            name: "Local Test Item",
            description: "A product with valid internet image URLs.",
            categoryId: menCategory.id,
            productSchemaId: clothingSchema.id,
            customData: { material: "Polyester", care_instructions: "Hand wash", fit: "Regular" },
            variants: [
                { sku: "LOCAL-TEST-Item", price: 1500, stock: 100, customData: { color: "Grey", size: "L" } }
            ],
            images: [
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800",
                "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&q=80&w=800"
            ]
        });

        // 4. Create Storefront Data
        console.log("Seeding storefront data...");

        await ensureDefaultStorefrontContent(storeId);

        revalidatePath(`/admin/stores/${storeId}`);
        return { success: true };
    } catch (error) {
        console.error("Seeding failed:", error);
        return { success: false, error: "Failed to seed store" };
    }
}

async function ensureDefaultStorefrontContent(storeId: string) {
    const defaultDocuments = [
        { kind: StorefrontDocKind.LAYOUT, key: "GLOBAL_LAYOUT", tree: defaultGlobalLayout },
        { kind: StorefrontDocKind.PAGE, key: "HOME", tree: defaultHomePage },
        { kind: StorefrontDocKind.PAGE, key: "COLLECTION", tree: defaultCollectionPage },
        { kind: StorefrontDocKind.PAGE, key: "CART", tree: CART_PLACEHOLDER },
        { kind: StorefrontDocKind.PAGE, key: "CHECKOUT", tree: defaultCheckoutPage },
        { kind: StorefrontDocKind.PAGE, key: "ORDERS", tree: defaultOrdersPage },
        { kind: StorefrontDocKind.PAGE, key: "PROFILE", tree: defaultProfilePage },
        { kind: StorefrontDocKind.PAGE, key: "LOGIN", tree: defaultLoginPage },
        { kind: StorefrontDocKind.TEMPLATE, key: "PDP:default", tree: defaultPdpTemplate },
        { kind: StorefrontDocKind.PREFAB, key: "ProductCard", tree: productCardPrefab, meta: { prefabType: 'productcard' } },
        { kind: StorefrontDocKind.PREFAB, key: "Navbar", tree: navbarPrefab, meta: { prefabType: 'navbar' } },
        { kind: StorefrontDocKind.PREFAB, key: "CartSidebar", tree: cartSidebarPrefab, meta: { prefabType: 'cartsidebar' } },
        { kind: StorefrontDocKind.PREFAB, key: "OrderCard", tree: orderCardPrefab, meta: { prefabType: 'ordercard' } },
    ];

    const statuses = [StorefrontDocStatus.DRAFT, StorefrontDocStatus.PUBLISHED];

    for (const doc of defaultDocuments) {
        for (const status of statuses) {
            await prisma.storefrontDocument.upsert({
                where: {
                    storeId_kind_key_status: {
                        storeId,
                        kind: doc.kind,
                        key: doc.key,
                        status,
                    },
                },
                update: {
                    tree: doc.tree as any,
                    meta: (doc as any).meta ? ((doc as any).meta as any) : undefined,
                },
                create: {
                    storeId,
                    kind: doc.kind,
                    key: doc.key,
                    status,
                    tree: doc.tree as any,
                    meta: (doc as any).meta ? ((doc as any).meta as any) : undefined,
                },
            });
        }
    }

    for (const status of statuses) {
        await prisma.storefrontTheme.upsert({
            where: {
                storeId_status: {
                    storeId,
                    status,
                },
            },
            update: {
                vars: defaultTheme as any,
            },
            create: {
                storeId,
                status,
                vars: defaultTheme as any,
            },
        });
    }

    await prisma.storefrontSettings.upsert({
        where: { storeId },
        update: {},
        create: {
            storeId,
            deliveryModes: ["DELIVERY"],
            checkoutFields: { phone: true, notes: false },
        },
    });
}

async function createProductIfNotExists(storeId: string, data: ProductSeed) {
    // Check if product with same name exists in store
    const existing = await prisma.product.findFirst({
        where: { storeId, name: data.name },
        include: { images: true }
    });

    if (existing) {
        const needsImages = existing.images.length === 0 && data.images && data.images.length > 0;
        const needsPrimaryImageUpdate = data.images.length > 0 && (!existing.image || existing.image.includes("default-product-img"));

        if (needsImages || needsPrimaryImageUpdate) {
            console.log(`Updating existing product assets: ${data.name}`);
            await prisma.product.update({
                where: { id: existing.id },
                data: {
                    ...(needsPrimaryImageUpdate ? { image: data.images[0] } : {}),
                    ...(needsImages
                        ? {
                            images: {
                                create: data.images.map((url, index) => ({
                                    url,
                                    position: index,
                                    alt: data.name
                                }))
                            }
                        }
                        : {}),
                },
            });
        } else {
            console.log(`Skipping existing product: ${data.name}`);
        }
        return;
    }

    // Check if any variant SKU already exists in this store
    // If so, we can't create this product without violating unique constraints.
    // In a real scenario, we might merge, but for seeding, we'll skip or warn.
    for (const variant of data.variants) {
        const existingVariant = await prisma.productVariant.findUnique({
            where: { sku: variant.sku }
        });
        if (existingVariant) {
            console.log(`Skipping product "${data.name}" because SKU "${variant.sku}" already exists.`);
            return;
        }
    }

    const product = await prisma.product.create({
        data: {
            storeId,
            name: data.name,
            description: data.description,
            categoryId: data.categoryId,
            productSchemaId: data.productSchemaId,
            customData: data.customData as any,
            image: data.images[0],
            images: {
                create: data.images.map((url, index) => ({
                    url,
                    position: index,
                    alt: data.name
                }))
            },
            variants: {
                create: data.variants.map((variant) => {
                    const variantImageUrls = variant.images?.length
                        ? variant.images
                        : (data.images.length > 0 ? [data.images[0]] : []);

                    return {
                        sku: variant.sku,
                        price: variant.price,
                        stock: variant.stock,
                        customData: variant.customData as any,
                        images: variantImageUrls.length
                            ? {
                                create: variantImageUrls.map((url, imageIndex) => ({
                                    url,
                                    position: imageIndex,
                                    alt: `${data.name} ${variant.sku}`
                                }))
                            }
                            : undefined,
                    };
                })
            }
        }
    });

    console.log(`Created product: ${data.name}`);
}

async function createCategoryIfNotExists(storeId: string, name: string, slug: string) {
    const existing = await prisma.category.findFirst({
        where: { storeId, slug, deletedAt: null }
    });

    if (existing) return;

    await prisma.category.create({
        data: { storeId, name, slug }
    });
}
