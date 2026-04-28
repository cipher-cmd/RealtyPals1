-- CreateTable
CREATE TABLE "project_price_bands" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "bhk" INTEGER,
    "min_price_psf" INTEGER NOT NULL,
    "max_price_psf" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_price_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "intent_state" JSONB NOT NULL,
    "resolved" JSONB NOT NULL,
    "phase" TEXT NOT NULL,
    "completeness" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_analytics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "field" TEXT,
    "phase" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_price_bands_project_name_sector_id_bhk_idx" ON "project_price_bands"("project_name", "sector_id", "bhk");

-- CreateIndex
CREATE INDEX "chat_sessions_user_id_updated_at_idx" ON "chat_sessions"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_analytics_user_id_timestamp_idx" ON "chat_analytics"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "chat_analytics_event_idx" ON "chat_analytics"("event");

-- AddForeignKey
ALTER TABLE "project_price_bands" ADD CONSTRAINT "project_price_bands_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
