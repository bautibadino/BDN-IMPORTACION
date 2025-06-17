-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "internalCode" TEXT,
    "description" TEXT,
    "unit" TEXT,
    "ivaType" TEXT NOT NULL DEFAULT 'iva_21',
    "taxCode" TEXT,
    "finalUnitCostUsd" REAL NOT NULL,
    "finalUnitCostArs" REAL NOT NULL,
    "markupPercentage" REAL NOT NULL,
    "finalPriceArs" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "minStock" INTEGER,
    "location" TEXT,
    "images" TEXT,
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "Product_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("finalPriceArs", "finalUnitCostArs", "finalUnitCostUsd", "id", "images", "internalCode", "location", "markupPercentage", "name", "productLeadId", "stock") SELECT "finalPriceArs", "finalUnitCostArs", "finalUnitCostUsd", "id", "images", "internalCode", "location", "markupPercentage", "name", "productLeadId", "stock" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_productLeadId_key" ON "Product"("productLeadId");
CREATE TABLE "new_QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "description" TEXT,
    "ivaType" TEXT NOT NULL DEFAULT 'iva_21',
    "ivaAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuoteItem" ("description", "discount", "id", "productId", "quantity", "quoteId", "subtotal", "unitPrice") SELECT "description", "discount", "id", "productId", "quantity", "quoteId", "subtotal", "unitPrice" FROM "QuoteItem";
DROP TABLE "QuoteItem";
ALTER TABLE "new_QuoteItem" RENAME TO "QuoteItem";
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");
CREATE INDEX "QuoteItem_productId_idx" ON "QuoteItem"("productId");
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" DATETIME,
    "invoiceType" TEXT NOT NULL DEFAULT 'FACTURA_B',
    "pointOfSale" TEXT NOT NULL DEFAULT '0001',
    "invoiceNumber" INTEGER,
    "fullNumber" TEXT,
    "authCode" TEXT,
    "authCodeExpiry" DATETIME,
    "taxedAmount" REAL NOT NULL DEFAULT 0,
    "nonTaxedAmount" REAL NOT NULL DEFAULT 0,
    "exemptAmount" REAL NOT NULL DEFAULT 0,
    "grossIncomePerception" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteId" TEXT,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sale_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "customerId", "deliveryDate", "discountAmount", "id", "internalNotes", "notes", "quoteId", "saleDate", "saleNumber", "status", "subtotal", "taxAmount", "total", "updatedAt") SELECT "createdAt", "customerId", "deliveryDate", "discountAmount", "id", "internalNotes", "notes", "quoteId", "saleDate", "saleNumber", "status", "subtotal", "taxAmount", "total", "updatedAt" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");
CREATE INDEX "Sale_saleDate_idx" ON "Sale"("saleDate");
CREATE INDEX "Sale_status_idx" ON "Sale"("status");
CREATE INDEX "Sale_invoiceType_idx" ON "Sale"("invoiceType");
CREATE INDEX "Sale_pointOfSale_invoiceNumber_idx" ON "Sale"("pointOfSale", "invoiceNumber");
CREATE TABLE "new_SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "description" TEXT,
    "ivaType" TEXT NOT NULL DEFAULT 'iva_21',
    "ivaAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("description", "discount", "id", "productId", "quantity", "saleId", "subtotal", "unitPrice") SELECT "description", "discount", "id", "productId", "quantity", "saleId", "subtotal", "unitPrice" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
