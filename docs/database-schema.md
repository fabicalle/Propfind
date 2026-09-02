# Database Schema Design (PostgreSQL + PostGIS)

## Overview

All geospatial data uses PostGIS `geography` type (SRID 4326) for accurate distance calculations on a spheroid. GeoHash is used for B2B aggregation zones.

## Tables

### users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    auth_provider   VARCHAR(50) NOT NULL DEFAULT 'anonymous', -- 'anonymous', 'google', 'apple', 'email'
    auth_provider_id VARCHAR(255),
    profile         JSONB DEFAULT '{}', -- { displayName, avatarUrl, phone }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NULL,
    consent_flags   JSONB NOT NULL DEFAULT '{"analytics": false, "marketing": false, "personalization": false}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider, auth_provider_id);
```

### properties

```sql
CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    price           NUMERIC(14,2) NOT NULL,
    price_currency  VARCHAR(3) NOT NULL DEFAULT 'USD',
    area_m2         NUMERIC(10,2),
    rooms           SMALLINT,
    bathrooms       SMALLINT,
    property_type   VARCHAR(50), -- 'apartment', 'house', 'condo', 'land', 'commercial'
    listing_type    VARCHAR(20) NOT NULL DEFAULT 'sale', -- 'sale', 'rent'
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    geog            geography(Point, 4326) NOT NULL, -- PostGIS geography
    geojson         JSONB, -- Full GeoJSON Feature for complex polygons
    address         VARCHAR(500),
    neighborhood    VARCHAR(200),
    city            VARCHAR(200),
    geo_hash        VARCHAR(12), -- For aggregation zones
    images          JSONB NOT NULL DEFAULT '[]', -- [{ url, width, height, alt }]
    amenities       JSONB NOT NULL DEFAULT '[]', -- ['pool', 'gym', 'parking']
    source_url      VARCHAR(1000),
    source_id       VARCHAR(255), -- External listing ID
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NULL
);

CREATE INDEX idx_properties_geog ON properties USING GIST(geog);
CREATE INDEX idx_properties_geo_hash ON properties(geo_hash);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_active ON properties(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_properties_type ON properties(property_type, listing_type);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX idx_properties_created ON properties(created_at DESC);
```

### user_interactions

```sql
CREATE TYPE interaction_type AS ENUM (
    'SWIPE_LEFT', 'SWIPE_RIGHT', 'SUPERLIKE',
    'VIEW_DETAIL', 'CONTACT_REALTOR', 'SAVE', 'SHARE'
);

CREATE TABLE user_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    swipe_direction VARCHAR(10), -- 'left', 'right', 'up' (null for non-swipe types)
    session_id      VARCHAR(255) NOT NULL, -- Anonymous session tracking
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata        JSONB DEFAULT '{}' -- { swipeVelocity, timeOnCardMs, source: 'deck' | 'map' }
);

CREATE INDEX idx_interactions_user ON user_interactions(user_id, created_at DESC);
CREATE INDEX idx_interactions_property ON user_interactions(property_id);
CREATE INDEX idx_interactions_session ON user_interactions(session_id, created_at DESC);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);
```

### saved_filters

```sql
CREATE TABLE saved_filters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filter_name     VARCHAR(200) NOT NULL,
    criteria        JSONB NOT NULL, -- { priceMin, priceMax, areaMin, rooms, propertyTypes, bbox, amenities }
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NULL
);

CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_default ON saved_filters(user_id) WHERE is_default = TRUE;
```

### user_saved_properties

```sql
CREATE TABLE user_saved_properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tags            JSONB NOT NULL DEFAULT '[]',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_saved_props_user ON user_saved_properties(user_id, created_at DESC);
CREATE INDEX idx_saved_props_property ON user_saved_properties(property_id);
```

### b2b_aggregated_metrics

```sql
CREATE TYPE metric_type AS ENUM (
    'SWIPE_RIGHT_RATE', 'SWIPE_LEFT_RATE', 'SUPERLIKE_RATE',
    'AVG_PRICE_VIEWED', 'AVG_SESSION_DURATION', 'PROPERTIES_VIEWED',
    'DETAIL_VIEW_RATE', 'CONTACT_RATE', 'SAVE_RATE'
);

CREATE TYPE time_bucket AS ENUM ('hourly', 'daily', 'weekly', 'monthly');

CREATE TABLE b2b_aggregated_metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type     metric_type NOT NULL,
    zone_geo_hash   VARCHAR(12), -- GeoHash zone (nullable for city-wide)
    neighborhood    VARCHAR(200), -- Named neighborhood (nullable for geohash zones)
    time_bucket     time_bucket NOT NULL,
    bucket_start    TIMESTAMPTZ NOT NULL, -- Start of the aggregation window
    metric_value    NUMERIC(16,6) NOT NULL,
    sample_size     INTEGER NOT NULL,
    metadata        JSONB DEFAULT '{}', -- { propertyTypes, priceRange }
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_b2b_metrics_type ON b2b_aggregated_metrics(metric_type, time_bucket, bucket_start DESC);
CREATE INDEX idx_b2b_metrics_zone ON b2b_aggregated_metrics(zone_geo_hash, bucket_start DESC);
CREATE INDEX idx_b2b_metrics_neighborhood ON b2b_aggregated_metrics(neighborhood, bucket_start DESC);
CREATE UNIQUE INDEX idx_b2b_metrics_unique ON b2b_aggregated_metrics(metric_type, zone_geo_hash, neighborhood, time_bucket, bucket_start);
```

### search_telemetry

```sql
CREATE TABLE search_telemetry (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      VARCHAR(255) NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    filters_applied JSONB NOT NULL DEFAULT '{}',
    results_count   INTEGER NOT NULL DEFAULT 0,
    click_position  geography(Point, 4326), -- Where user clicked on map
    zoom_level      SMALLINT,
    search_duration_ms INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_session ON search_telemetry(session_id, created_at DESC);
CREATE INDEX idx_telemetry_created ON search_telemetry(created_at DESC);
CREATE INDEX idx_telemetry_user ON search_telemetry(user_id, created_at DESC);
```

## Migration Notes

1. **PostGIS Extension**: Run `CREATE EXTENSION IF NOT EXISTS postgis;` before any migration
2. **geog Column**: Populated via trigger on INSERT/UPDATE from lat/lng:
   ```sql
   CREATE TRIGGER set_geog BEFORE INSERT OR UPDATE ON properties
   FOR EACH ROW EXECUTE FUNCTION
   -- ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
   ```
3. **geo_hash**: Computed from lat/lng using `ST_GeoHash(geog, 12)` on insert
4. **Partitioning**: `search_telemetry` and `user_interactions` should be partitioned by `created_at` (monthly) at scale
5. **Retention**: `search_telemetry` rows older than 90 days are eligible for archival
6. **B2B Aggregation**: Run every 15 min via cron; upsert into `b2b_aggregated_metrics` using the unique index
