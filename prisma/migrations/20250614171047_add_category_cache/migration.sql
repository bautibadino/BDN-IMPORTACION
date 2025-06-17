-- CreateTable
CREATE TABLE "CategoryCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL,
    "fullPath" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryCache_categoryId_key" ON "CategoryCache"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryCache_name_idx" ON "CategoryCache"("name");

-- CreateIndex
CREATE INDEX "CategoryCache_level_idx" ON "CategoryCache"("level");

-- CreateIndex
CREATE INDEX "CategoryCache_lastUpdated_idx" ON "CategoryCache"("lastUpdated");
