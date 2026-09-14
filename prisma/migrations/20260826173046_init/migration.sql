-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('anonymous', 'google', 'apple', 'email');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('SWIPE_LEFT', 'SWIPE_RIGHT', 'SUPERLIKE', 'VIEW_DETAIL', 'CONTACT_REALTOR', 'SAVE', 'SHARE');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('SWIPE_RIGHT_RATE', 'SWIPE_LEFT_RATE', 'SUPERLIKE_RATE', 'AVG_PRICE_VIEWED', 'AVG_SESSION_DURATION', 'PROPERTIES_VIEWED', 'DETAIL_VIEW_RATE', 'CONTACT_RATE', 'SAVE_RATE');

-- CreateEnum
CREATE TYPE "TimeBucket" AS ENUM ('hourly', 'daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'house', 'condo', 'land', 'commercial');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('sale', 'rent');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "auth_provider" "AuthProvider" NOT NULL DEFAULT 'anonymous',
    "auth_provider_id" TEXT,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "consent_flags" JSONB NOT NULL DEFAULT '{"analytics": false, "marketing": false, "personalization": false}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "price_currency" TEXT NOT NULL DEFAULT 'USD',
    "total_monthly_cost" DECIMAL(10,2),
    "area_m2" DECIMAL(10,2),
    "rooms" INTEGER,
    "bathrooms" INTEGER,
    "property_type" "PropertyType",
    "listing_type" "ListingType" NOT NULL DEFAULT 'sale',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "geog" VARCHAR(2048),
    "geojson" JSONB,
    "address" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "geo_hash" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "source_url" TEXT,
    "source_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "property_id" TEXT NOT NULL,
    "interaction_type" "InteractionType" NOT NULL,
    "swipe_direction" TEXT,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filter_name" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_properties" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saved_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_aggregated_metrics" (
    "id" TEXT NOT NULL,
    "metric_type" "MetricType" NOT NULL,
    "zone_geo_hash" TEXT,
    "neighborhood" TEXT,
    "time_bucket" "TimeBucket" NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "metricValue" DECIMAL(16,6) NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_aggregated_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_telemetry" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "filters_applied" JSONB NOT NULL DEFAULT '{}',
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "zoom_level" INTEGER,
    "search_duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_auth_provider_auth_provider_id_idx" ON "users"("auth_provider", "auth_provider_id");

-- CreateIndex
CREATE INDEX "properties_geo_hash_idx" ON "properties"("geo_hash");

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- CreateIndex
CREATE INDEX "properties_total_monthly_cost_idx" ON "properties"("total_monthly_cost");

-- CreateIndex
CREATE INDEX "properties_is_active_idx" ON "properties"("is_active");

-- CreateIndex
CREATE INDEX "properties_property_type_listing_type_idx" ON "properties"("property_type", "listing_type");

-- CreateIndex
CREATE INDEX "properties_neighborhood_idx" ON "properties"("neighborhood");

-- CreateIndex
CREATE INDEX "properties_created_at_idx" ON "properties"("created_at");

-- CreateIndex
CREATE INDEX "user_interactions_user_id_created_at_idx" ON "user_interactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_interactions_property_id_idx" ON "user_interactions"("property_id");

-- CreateIndex
CREATE INDEX "user_interactions_session_id_created_at_idx" ON "user_interactions"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "user_interactions_interaction_type_idx" ON "user_interactions"("interaction_type");

-- CreateIndex
CREATE INDEX "user_interactions_created_at_idx" ON "user_interactions"("created_at");

-- CreateIndex
CREATE INDEX "saved_filters_user_id_idx" ON "saved_filters"("user_id");

-- CreateIndex
CREATE INDEX "saved_filters_user_id_is_default_idx" ON "saved_filters"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "user_saved_properties_user_id_created_at_idx" ON "user_saved_properties"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_saved_properties_property_id_idx" ON "user_saved_properties"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_saved_properties_user_id_property_id_key" ON "user_saved_properties"("user_id", "property_id");

-- CreateIndex
CREATE INDEX "b2b_aggregated_metrics_metric_type_time_bucket_bucket_start_idx" ON "b2b_aggregated_metrics"("metric_type", "time_bucket", "bucket_start");

-- CreateIndex
CREATE INDEX "b2b_aggregated_metrics_zone_geo_hash_bucket_start_idx" ON "b2b_aggregated_metrics"("zone_geo_hash", "bucket_start");

-- CreateIndex
CREATE INDEX "b2b_aggregated_metrics_neighborhood_bucket_start_idx" ON "b2b_aggregated_metrics"("neighborhood", "bucket_start");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_aggregated_metrics_metric_type_zone_geo_hash_neighborho_key" ON "b2b_aggregated_metrics"("metric_type", "zone_geo_hash", "neighborhood", "time_bucket", "bucket_start");

-- CreateIndex
CREATE INDEX "search_telemetry_session_id_created_at_idx" ON "search_telemetry"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "search_telemetry_created_at_idx" ON "search_telemetry"("created_at");

-- CreateIndex
CREATE INDEX "search_telemetry_user_id_created_at_idx" ON "search_telemetry"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_properties" ADD CONSTRAINT "user_saved_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_properties" ADD CONSTRAINT "user_saved_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_telemetry" ADD CONSTRAINT "search_telemetry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
