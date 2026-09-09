-- AlterTable: add is_mock and embedding columns to properties
ALTER TABLE "properties" ADD COLUMN "is_mock" boolean NOT NULL DEFAULT false;
ALTER TABLE "properties" ADD COLUMN "embedding" text;

-- Add index on is_mock for faster filtering
CREATE INDEX IF NOT EXISTS "properties_is_mock_idx" ON "properties" ("is_mock") WHERE "is_mock" = true;
