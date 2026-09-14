-- Add missing property fields
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "bedrooms" INT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "listing_sub_type" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "credit_approved" BOOLEAN;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "parking" TEXT;

-- Backfill bedrooms from rooms where NULL
UPDATE "properties" SET "bedrooms" = "rooms" WHERE "bedrooms" IS NULL AND "rooms" IS NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS "properties_listing_sub_type_idx" ON "properties" USING btree ("listing_sub_type");
