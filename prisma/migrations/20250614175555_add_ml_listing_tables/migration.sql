/*
  Warnings:

  - You are about to drop the column `mlCategoryId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mlItemId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mlLastSync` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mlListingUrl` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mlStatus` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mlSyncEnabled` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `mlSyncErrors` on the `Product` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MLListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mlItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "condition" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL,
    "permalink" TEXT,
    "thumbnail" TEXT,
    "listingType" TEXT,
    "buyingMode" TEXT,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "officialStore" BOOLEAN NOT NULL DEFAULT false,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" DATETIME,
    "syncErrors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MLStockMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MLStockMapping_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MLListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MLStockMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "internalCode" TEXT,
    "finalUnitCostUsd" REAL NOT NULL,
    "finalUnitCostArs" REAL NOT NULL,
    "markupPercentage" REAL NOT NULL,
    "finalPriceArs" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "location" TEXT,
    "images" TEXT,
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "Product_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("finalPriceArs", "finalUnitCostArs", "finalUnitCostUsd", "id", "images", "internalCode", "location", "markupPercentage", "name", "productLeadId", "stock") SELECT "finalPriceArs", "finalUnitCostArs", "finalUnitCostUsd", "id", "images", "internalCode", "location", "markupPercentage", "name", "productLeadId", "stock" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_productLeadId_key" ON "Product"("productLeadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MLListing_mlItemId_key" ON "MLListing"("mlItemId");

-- CreateIndex
CREATE INDEX "MLListing_mlItemId_idx" ON "MLListing"("mlItemId");

-- CreateIndex
CREATE INDEX "MLListing_status_idx" ON "MLListing"("status");

-- CreateIndex
CREATE INDEX "MLStockMapping_listingId_idx" ON "MLStockMapping"("listingId");

-- CreateIndex
CREATE INDEX "MLStockMapping_productId_idx" ON "MLStockMapping"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "MLStockMapping_listingId_productId_key" ON "MLStockMapping"("listingId", "productId");
