-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANIFIEE',
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "country" VARCHAR(2) NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT,
    "objective" TEXT NOT NULL,
    "beneficiaries" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(12,2) NOT NULL,
    "collected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "used" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actions_slug_key" ON "actions"("slug");

-- CreateIndex
CREATE INDEX "actions_status_idx" ON "actions"("status");

-- CreateIndex
CREATE INDEX "actions_publishedAt_idx" ON "actions"("publishedAt");
