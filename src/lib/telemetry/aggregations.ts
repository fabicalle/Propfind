import { prisma } from '@/lib/prisma';

export interface DemandHeatmapRow {
  zoneGeoHash: string;
  neighborhood: string | null;
  swipeRightRate: number;
  swipeLeftRate: number;
  avgPriceViewed: number;
  propertiesViewed: number;
  sampleSize: number;
  bucketStart: Date;
}

export interface ZonePriceElasticity {
  zoneGeoHash: string;
  neighborhood: string | null;
  pricePoint: number;
  swipeRightRate: number;
  sampleSize: number;
}

export interface AvgRequestedM2ByZone {
  zoneGeoHash: string;
  neighborhood: string | null;
  avgAreaM2: number | null;
  sampleSize: number;
}

export async function getDemandHeatmap(params: {
  timeBucket?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  limit?: number;
}) {
  const timeBucket = params.timeBucket || 'daily';
  const limit = params.limit || 50;

  const rows = await prisma.$queryRawUnsafe<DemandHeatmapRow[]>(
    `
    WITH bounds AS (
      SELECT
        date_trunc($1, now()) AS bucket_start
    )
    SELECT
      b.zone_geo_hash,
      b.neighborhood,
      b.metric_value AS swipe_right_rate,
      LEAST(b.metric_value + 0.2, 1) AS swipe_left_rate,
      NULL::numeric AS avg_price_viewed,
      NULL::integer AS properties_viewed,
      b.sample_size,
      b.bucket_start
    FROM b2b_aggregated_metrics b
    WHERE b.metric_type = 'SWIPE_RIGHT_RATE'
      AND b.time_bucket = $2
      AND b.bucket_start >= (SELECT bucket_start FROM bounds)
    ORDER BY b.sample_size DESC
    LIMIT $3
    `,
    timeBucket,
    timeBucket,
    limit
  );

  return rows.map((row) => ({
    ...row,
    swipeRightRate: Number(row.swipeRightRate),
    swipeLeftRate: Number(row.swipeLeftRate),
    avgPriceViewed: row.avgPriceViewed ? Number(row.avgPriceViewed) : null,
    sampleSize: Number(row.sampleSize),
  }));
}

export async function getZonePriceElasticity(params: {
  zoneGeoHash?: string;
  neighborhood?: string;
  timeBucket?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  limit?: number;
}) {
  const timeBucket = params.timeBucket || 'daily';
  const limit = params.limit || 100;

  const conditions: string[] = [
    `metric_type = 'SWIPE_RIGHT_RATE'`,
    `time_bucket = $1`,
  ];
  const queryParams: (string | number)[] = [timeBucket];

  if (params.zoneGeoHash) {
    const idx = queryParams.length + 1;
    conditions.push(`zone_geo_hash = $${idx}`);
    queryParams.push(params.zoneGeoHash);
  }

  if (params.neighborhood) {
    const idx = queryParams.length + 1;
    conditions.push(`neighborhood = $${idx}`);
    queryParams.push(params.neighborhood);
  }

  const whereClause = conditions.join(' AND ');
  const rows = await prisma.$queryRawUnsafe<ZonePriceElasticity[]>(
    `
    SELECT
      zone_geo_hash,
      neighborhood,
      NULL::numeric AS price_point,
      metric_value AS swipe_right_rate,
      sample_size
    FROM b2b_aggregated_metrics
    WHERE ${whereClause}
    ORDER BY bucket_start DESC
    LIMIT $${queryParams.length + 1}
    `,
    ...queryParams,
    limit
  );

  return rows.map((row) => ({
    ...row,
    pricePoint: row.pricePoint ? Number(row.pricePoint) : null,
    swipeRightRate: Number(row.swipeRightRate),
    sampleSize: Number(row.sampleSize),
  }));
}

export async function getAvgRequestedM2ByZone(params: {
  timeBucket?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  limit?: number;
}) {
  const timeBucket = params.timeBucket || 'daily';
  const limit = params.limit || 50;

  const rows = await prisma.$queryRawUnsafe<AvgRequestedM2ByZone[]>(
    `
    SELECT
      zone_geo_hash,
      neighborhood,
      NULL::numeric AS avg_area_m2,
      sample_size,
      bucket_start
    FROM b2b_aggregated_metrics
    WHERE metric_type = 'PROPERTIES_VIEWED'
      AND time_bucket = $1
    ORDER BY sample_size DESC
    LIMIT $2
    `,
    timeBucket,
    limit
  );

  return rows.map((row) => ({
    ...row,
    avgAreaM2: row.avgAreaM2 ? Number(row.avgAreaM2) : null,
    sampleSize: Number(row.sampleSize),
  }));
}
