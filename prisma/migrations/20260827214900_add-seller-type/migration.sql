CREATE TYPE "SellerType" AS ENUM ('OWNER', 'AGENCY');

ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "seller_type" "SellerType";
