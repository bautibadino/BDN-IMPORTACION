-- CreateTable
CREATE TABLE "MercadoLibreToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "mlListingUrl" TEXT,
    "images" TEXT,
    "mlItemId" TEXT,
    "mlStatus" TEXT,
    "mlCategoryId" TEXT,
    "mlLastSync" DATETIME,
    "mlSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mlSyncErrors" TEXT,
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "Product_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("finalPriceArs", "finalUnitCostArs", "finalUnitCostUsd", "id", "internalCode", "location", "markupPercentage", "mlListingUrl", "name", "productLeadId", "stock") SELECT "finalPriceArs", "finalUnitCostArs", "finalUnitCostUsd", "id", "internalCode", "location", "markupPercentage", "mlListingUrl", "name", "productLeadId", "stock" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_productLeadId_key" ON "Product"("productLeadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MercadoLibreToken_userId_key" ON "MercadoLibreToken"("userId");
