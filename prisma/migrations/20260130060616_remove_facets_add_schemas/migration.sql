/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the `Facet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FacetValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductFacetValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VariantFacetValue` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productSnapshot` to the `OrderLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantSnapshot` to the `OrderLine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'IN_APP';

-- DropForeignKey
ALTER TABLE "Facet" DROP CONSTRAINT "Facet_storeId_fkey";

-- DropForeignKey
ALTER TABLE "FacetValue" DROP CONSTRAINT "FacetValue_facetId_fkey";

-- DropForeignKey
ALTER TABLE "ProductFacetValue" DROP CONSTRAINT "ProductFacetValue_facetValueId_fkey";

-- DropForeignKey
ALTER TABLE "ProductFacetValue" DROP CONSTRAINT "ProductFacetValue_productId_fkey";

-- DropForeignKey
ALTER TABLE "VariantFacetValue" DROP CONSTRAINT "VariantFacetValue_facetValueId_fkey";

-- DropForeignKey
ALTER TABLE "VariantFacetValue" DROP CONSTRAINT "VariantFacetValue_variantId_fkey";

-- DropIndex
DROP INDEX "Product_storeId_deletedAt_idx";

-- DropIndex
DROP INDEX "Product_storeId_isActive_deletedAt_idx";

-- DropIndex
DROP INDEX "ProductVariant_productId_deletedAt_idx";

-- DropIndex
DROP INDEX "ProductVariant_productId_isActive_deletedAt_idx";

-- DropIndex
DROP INDEX "ProductVariant_productId_isActive_stock_deletedAt_idx";

-- DropIndex
DROP INDEX "ProductVariant_sku_deletedAt_idx";

-- DropIndex
DROP INDEX "ProductVariant_sku_deletedAt_key";

-- DropIndex
DROP INDEX "ProductVariant_sku_isActive_deletedAt_idx";

-- DropIndex
DROP INDEX "ProductVariant_stock_idx";

-- DropIndex
DROP INDEX "ProductVariant_stock_isActive_deletedAt_idx";

-- AlterTable
ALTER TABLE "OrderLine" ADD COLUMN     "productSnapshot" JSONB NOT NULL,
ADD COLUMN     "variantSnapshot" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "deletedAt",
ADD COLUMN     "customData" JSONB,
ADD COLUMN     "productSchemaId" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "deletedAt",
ADD COLUMN     "customData" JSONB;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR';

-- DropTable
DROP TABLE "Facet";

-- DropTable
DROP TABLE "FacetValue";

-- DropTable
DROP TABLE "ProductFacetValue";

-- DropTable
DROP TABLE "VariantFacetValue";

-- CreateTable
CREATE TABLE "ProductSchema" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantSchema" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantSchema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountInvitation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSchema_storeId_isActive_idx" ON "ProductSchema"("storeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSchema_storeId_name_version_key" ON "ProductSchema"("storeId", "name", "version");

-- CreateIndex
CREATE INDEX "VariantSchema_storeId_isActive_idx" ON "VariantSchema"("storeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VariantSchema_storeId_version_key" ON "VariantSchema"("storeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_token_key" ON "AccountInvitation"("token");

-- CreateIndex
CREATE INDEX "AccountInvitation_email_idx" ON "AccountInvitation"("email");

-- CreateIndex
CREATE INDEX "AccountInvitation_token_idx" ON "AccountInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_accountId_email_key" ON "AccountInvitation"("accountId", "email");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE INDEX "Product_storeId_isActive_idx" ON "Product"("storeId", "isActive");

-- CreateIndex
CREATE INDEX "Product_storeId_createdAt_idx" ON "Product"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_stock_idx" ON "ProductVariant"("productId", "stock");

-- CreateIndex
CREATE INDEX "ProductVariant_stock_isActive_idx" ON "ProductVariant"("stock", "isActive");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productSchemaId_fkey" FOREIGN KEY ("productSchemaId") REFERENCES "ProductSchema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSchema" ADD CONSTRAINT "ProductSchema_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSchema" ADD CONSTRAINT "VariantSchema_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitation" ADD CONSTRAINT "AccountInvitation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
