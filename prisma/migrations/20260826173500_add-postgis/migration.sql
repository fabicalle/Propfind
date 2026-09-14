ALTER TABLE "properties" ALTER COLUMN "geog" TYPE geography(Point,4326) USING ST_SetSRID(ST_MakePoint("lng", "lat"),4326)::geography;

CREATE INDEX IF NOT EXISTS "properties_geog_idx" ON "properties" USING GIST ("geog");

CREATE OR REPLACE FUNCTION set_geog_and_geohash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  NEW.geo_hash := LEFT(ST_GeoHash(NEW.geog, 12), 12);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_geog ON "properties";
CREATE TRIGGER trg_set_geog
BEFORE INSERT OR UPDATE OF lat, lng ON "properties"
FOR EACH ROW EXECUTE FUNCTION set_geog_and_geohash();
