-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('exterior', 'interior', 'floor_plan', 'amenity', 'view');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "balconies" INTEGER,
ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "highlights" TEXT[];

-- CreateTable
CREATE TABLE "property_images" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_type" "ImageType" NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_intelligence" (
    "id" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "key_growth_drivers" TEXT[],
    "rental_yield_avg" DOUBLE PRECISION,
    "appreciation_5yr" DOUBLE PRECISION,
    "map_center_lat" DOUBLE PRECISION,
    "map_center_lng" DOUBLE PRECISION,
    "map_zoom" INTEGER DEFAULT 14,

    CONSTRAINT "sector_intelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_images_property_id_image_type_idx" ON "property_images"("property_id", "image_type");

-- CreateIndex
CREATE UNIQUE INDEX "sector_intelligence_sector_id_key" ON "sector_intelligence"("sector_id");

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sector_intelligence" ADD CONSTRAINT "sector_intelligence_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
