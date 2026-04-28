-- CreateEnum
CREATE TYPE "DemandLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "SupplyLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('flat', 'plot');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ready', 'under_construction');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avg_price_low" INTEGER NOT NULL,
    "avg_price_high" INTEGER NOT NULL,
    "demand_level" "DemandLevel" NOT NULL,
    "supply_level" "SupplyLevel" NOT NULL,
    "volatility_flag" BOOLEAN NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "property_type" "PropertyType" NOT NULL,
    "bhk" INTEGER NOT NULL,
    "size_sqft" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "price_per_sqft" INTEGER NOT NULL,
    "builder" TEXT NOT NULL,
    "floor" INTEGER,
    "status" "PropertyStatus" NOT NULL,
    "amenities" TEXT[],

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_bands" (
    "id" TEXT NOT NULL,
    "sector_id" TEXT NOT NULL,
    "property_type" "PropertyType",
    "bhk" INTEGER,
    "min_size" INTEGER NOT NULL,
    "max_size" INTEGER NOT NULL,
    "price_low" INTEGER NOT NULL,
    "price_high" INTEGER NOT NULL,
    "confidence_level" "ConfidenceLevel" NOT NULL,

    CONSTRAINT "price_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_properties" (
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("user_id","property_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sectors_city_name_key" ON "sectors"("city", "name");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_bands" ADD CONSTRAINT "price_bands_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
