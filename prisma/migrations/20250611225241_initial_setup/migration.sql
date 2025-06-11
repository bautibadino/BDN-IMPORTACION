-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('aéreo', 'marítimo', 'terrestre');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('EXW', 'FOB', 'CIF', 'DDP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('borrador', 'pendiente_pago', 'pagado', 'en_producción', 'listo_embarque', 'embarcado', 'en_tránsito', 'en_aduana', 'recibido', 'cancelado');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('visto', 'contacto', 'muestra', 'pedido', 'descartado');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('proforma_invoice', 'commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'insurance_policy', 'other');

-- CreateEnum
CREATE TYPE "ImportCostType" AS ENUM ('flete_internacional', 'flete_local', 'aduana_impuestos', 'seguro', 'almacenaje', 'despachante', 'bancarios', 'otros');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "contactName" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "source" TEXT,
    "language" TEXT,
    "rating" INTEGER,
    "isVerified" BOOLEAN DEFAULT false,
    "firstContact" TIMESTAMP(3),
    "tags" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierNote" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL,
    "addedBy" TEXT,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "SupplierNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referencePriceUsd" DOUBLE PRECISION,
    "moq" INTEGER,
    "currency" TEXT,
    "volumeM3" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "sourceUrl" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "ProductLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLeadStatus" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LeadStatus" NOT NULL,
    "note" TEXT,
    "addedBy" TEXT,
    "productLeadId" TEXT NOT NULL,

    CONSTRAINT "ProductLeadStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "shipmentType" "ShipmentType" NOT NULL,
    "incoterm" "Incoterm" NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "forwarder" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "trackingCode" TEXT,
    "estimatedArrival" TIMESTAMP(3),
    "portOfOrigin" TEXT,
    "portOfDestination" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceUsd" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION DEFAULT 0,
    "orderId" TEXT NOT NULL,
    "productLeadId" TEXT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportCost" (
    "id" TEXT NOT NULL,
    "type" "ImportCostType" NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "appliesTo" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "ImportCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "note" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internalCode" TEXT,
    "finalUnitCostUsd" DOUBLE PRECISION NOT NULL,
    "finalUnitCostArs" DOUBLE PRECISION NOT NULL,
    "markupPercentage" DOUBLE PRECISION NOT NULL,
    "finalPriceArs" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "location" TEXT,
    "mlListingUrl" TEXT,
    "productLeadId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productLeadId_key" ON "OrderItem"("orderId", "productLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productLeadId_key" ON "Product"("productLeadId");

-- AddForeignKey
ALTER TABLE "SupplierNote" ADD CONSTRAINT "SupplierNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLead" ADD CONSTRAINT "ProductLead_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLeadStatus" ADD CONSTRAINT "ProductLeadStatus_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportCost" ADD CONSTRAINT "ImportCost_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productLeadId_fkey" FOREIGN KEY ("productLeadId") REFERENCES "ProductLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
