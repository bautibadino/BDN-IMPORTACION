-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "contactName" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "source" TEXT,
    "language" TEXT,
    "rating" INTEGER,
    "isVerified" BOOLEAN DEFAULT false,
    "firstContact" DATETIME,
    "tags" TEXT
);

-- CreateTable
CREATE TABLE "SupplierNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL,
    "addedBy" TEXT,
    "supplierId" TEXT NOT NULL,
    CONSTRAINT "SupplierNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referencePriceUsd" REAL,
    "moq" INTEGER,
    "currency" TEXT,
    "volumeM3" REAL,
    "weightKg" REAL,
    "photoUrl" TEXT,
    "sourceUrl" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,
    CONSTRAINT "ProductLead_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductLeadStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "addedBy" TEXT,
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "ProductLeadStatus_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "shipmentType" TEXT NOT NULL,
    "incoterm" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "forwarder" TEXT,
    "orderDate" DATETIME NOT NULL,
    "trackingCode" TEXT,
    "estimatedArrival" DATETIME,
    "portOfOrigin" TEXT,
    "portOfDestination" TEXT,
    "isProcessedToStock" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" INTEGER NOT NULL,
    "unitPriceUsd" REAL NOT NULL,
    "discountPercent" REAL DEFAULT 0,
    "orderId" TEXT NOT NULL,
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amountUsd" REAL NOT NULL,
    "description" TEXT,
    "appliesTo" TEXT,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "ImportCost_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "note" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
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
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "Product_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostUsd" REAL NOT NULL,
    "totalCostUsd" REAL NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "notes" TEXT,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productLeadId" TEXT NOT NULL,
    CONSTRAINT "ProductBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductBatch_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductBatch_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productLeadId_key" ON "OrderItem"("orderId", "productLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productLeadId_key" ON "Product"("productLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductBatch_orderId_productLeadId_key" ON "ProductBatch"("orderId", "productLeadId");
