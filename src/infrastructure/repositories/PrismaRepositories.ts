import { PropertyRepository, InteractionRepository, PropertyReportRepository } from '@/application/ports';
import { Property, PropertyReport } from '@/domain/entities';
import { BoundingBox, PropertySearchFilters, CreatePropertyInput, CreatePropertyReportInput } from '@/domain/value-objects';
import { SearchParams, PagedResult } from '@/types/search';
import { prisma } from '@/lib/prisma';
import { PropertyType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export class PrismaPropertyRepository implements PropertyRepository {
  private toProperty(row: Record<string, unknown>): Property {
    const price = row.price;
    const areaM2 = row.areaM2;
    const totalMonthlyCost = row.totalMonthlyCost;

    const priceCurrency = (row.priceCurrency as string) ?? (row.price_currency as string) ?? 'USD';
    const listingType = (row.listingType as 'sale' | 'rent') ?? (row.listing_type as 'sale' | 'rent') ?? 'sale';
    const listingSubType = (row.listingSubType as string | null) ?? (row.listing_sub_type as string | null) ?? null;
    const sellerType = (row.sellerType as 'OWNER' | 'AGENCY' | null) ?? (row.seller_type as 'OWNER' | 'AGENCY' | null) ?? null;
    const creditApproved = (row.creditApproved as boolean | null) ?? (row.credit_approved as boolean | null) ?? null;
    const parking = (row.parking as string | null) ?? (row.parking as string | null) ?? null;

    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      price: this.toNumber(price),
      priceCurrency,
      totalMonthlyCost: totalMonthlyCost ? this.toNumber(totalMonthlyCost) : null,
      areaM2: areaM2 ? this.toNumber(areaM2) : null,
      rooms: (row.rooms as number | null) ?? null,
      bedrooms: (row.bedrooms as number | null) ?? null,
      bathrooms: (row.bathrooms as number | null) ?? null,
      propertyType: row.propertyType as string | null,
      listingType,
      listingSubType,
      sellerType,
      creditApproved,
      parking,
      lat: row.lat as number,
      lng: row.lng as number,
      address: row.address as string | null,
      neighborhood: row.neighborhood as string | null,
      city: row.city as string | null,
      departmentId: (row.departmentId as string | null) ?? (row.department_id as string | null) ?? null,
      localityId: (row.localityId as string | null) ?? (row.locality_id as string | null) ?? null,
      images: (row.images as Array<{ url: string; width: number; height: number; alt?: string }>) || [],
      amenities: (row.amenities as string[]) || [],
      sourceUrl: row.sourceUrl as string | null,
      isActive: (row.isActive as boolean) ?? true,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
      publisherId: (row.publisher_id as string | null) ?? null,
      isMock: (row.isMock as boolean) ?? (row.is_mock as boolean) ?? false,
      embedding: (row.embedding as string | null) ?? null,
    };
  }

  private toNumber(value: unknown): number {
    if (value && typeof value === 'object' && typeof (value as { toNumber: () => number }).toNumber === 'function') {
      return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value);
  }

  async searchByBoundingBox(params: {
    bbox: BoundingBox;
    filters: PropertySearchFilters;
    excludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<Property[]> {
    const { bbox, filters, excludeIds = [], limit, offset } = params;

    const whereConditions: string[] = [
      'p.is_active = true',
      'p.id NOT IN (SELECT property_id FROM property_reports)',
    ];
    const queryParams: (string | number | string[] | boolean)[] = [];

    const isFullWorldBbox =
      bbox.south <= -90 &&
      bbox.west <= -180 &&
      bbox.north >= 90 &&
      bbox.east >= 180;

    if (!isFullWorldBbox) {
      queryParams.push(bbox.west, bbox.south, bbox.east, bbox.north);
      whereConditions.push(
        `ST_Intersects(p.geog, ST_MakeEnvelope($1, $2, $3, $4, 4326)::geography)`
      );
    }

    if (filters.priceMin !== undefined) {
      queryParams.push(filters.priceMin);
      whereConditions.push(`p.price >= $${queryParams.length}`);
    }
    if (filters.priceMax !== undefined) {
      queryParams.push(filters.priceMax);
      whereConditions.push(`p.price <= $${queryParams.length}`);
    }
    if (filters.areaMin !== undefined) {
      queryParams.push(filters.areaMin);
      whereConditions.push(`p.area_m2 >= $${queryParams.length}`);
    }
    if (filters.areaMax !== undefined) {
      queryParams.push(filters.areaMax);
      whereConditions.push(`p.area_m2 <= $${queryParams.length}`);
    }
    if (filters.rooms && filters.rooms.length > 0) {
      queryParams.push(filters.rooms as unknown as string[]);
      whereConditions.push(`p.rooms = ANY($${queryParams.length}::int[])`);
    }
    if (filters.bedrooms && filters.bedrooms.length > 0) {
      queryParams.push(filters.bedrooms as unknown as string[]);
      whereConditions.push(`p.bedrooms = ANY($${queryParams.length}::int[])`);
    }
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      queryParams.push(filters.propertyTypes);
      whereConditions.push(`p.property_type = ANY($${queryParams.length}::text[])`);
    }
    if (filters.currency) {
      queryParams.push(filters.currency);
      whereConditions.push(`p.price_currency = $${queryParams.length}`);
    }
    if (filters.listingType) {
      queryParams.push(filters.listingType);
      whereConditions.push(`p.listing_type = $${queryParams.length}::"ListingType"`);
    }
    if (filters.listingSubType) {
      queryParams.push(filters.listingSubType);
      whereConditions.push(`p.listing_sub_type = $${queryParams.length}`);
    }
    if (filters.sellerType) {
      queryParams.push(filters.sellerType);
      whereConditions.push(`p.seller_type = $${queryParams.length}::"SellerType"`);
    }
    if (filters.creditApproved !== undefined) {
      queryParams.push(filters.creditApproved);
      whereConditions.push(`p.credit_approved = $${queryParams.length}`);
    }
    if (filters.parking) {
      queryParams.push(filters.parking);
      whereConditions.push(`p.parking = $${queryParams.length}`);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      queryParams.push(filters.amenities);
      whereConditions.push(`p.amenities @> $${queryParams.length}::jsonb`);
    }
    if (excludeIds.length > 0) {
      queryParams.push(excludeIds);
      whereConditions.push(`p.id != ALL($${queryParams.length}::text[])`);
    }

    const whereClause = whereConditions.join(' AND ');

    interface PropertyRow {
      id: string;
      title: string;
      description: string | null;
      price: string | number | null;
      area_m2: string | number | null;
      rooms: number | null;
      bedrooms: number | null;
      bathrooms: number | null;
      property_type: string | null;
      listing_type: string | null;
      listing_sub_type: string | null;
      seller_type: string | null;
      price_currency: string | null;
      credit_approved: boolean | null;
      parking: string | null;
      lat: number;
      lng: number;
      address: string | null;
      neighborhood: string | null;
      city: string | null;
      department_id: string | null;
      locality_id: string | null;
      images: string | null;
      amenities: string | null;
      source_url: string | null;
      is_active: boolean;
      created_at: string | Date | null;
      publisher_id: string | null;
    }

    const query = `
      SELECT
        p.id, p.title, p.description, p.price, p.area_m2, p.rooms, p.bedrooms, p.bathrooms,
        p.property_type, p.listing_type, p.listing_sub_type, p.seller_type, p.price_currency, p.credit_approved, p.parking,
        p.lat, p.lng, p.address, p.neighborhood, p.city, p.department_id, p.locality_id, p.images, p.amenities, p.source_url, p.is_active, p.created_at, p.publisher_id
      FROM properties p
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const rows = await prisma.$queryRawUnsafe<PropertyRow[]>(query, ...queryParams, limit, offset);

    return rows.map((row) => this.toProperty(row as unknown as Record<string, unknown>));
  }

  async findById(id: string): Promise<Property | null> {
    const property = await prisma.property.findUnique({
      where: { id, isActive: true },
      include: { publisher: true },
    });
    if (!property) return null;
    return this.toProperty(property as unknown as Record<string, unknown>);
  }

  async create(data: CreatePropertyInput): Promise<Property> {
    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        priceCurrency: data.priceCurrency ?? 'USD',
        totalMonthlyCost: data.totalMonthlyCost,
        areaM2: data.areaM2,
        rooms: data.rooms,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        propertyType: data.propertyType as PropertyType | undefined,
        listingType: data.listingType,
        listingSubType: data.listingSubType,
        sellerType: data.sellerType as 'OWNER' | 'AGENCY' | undefined,
        creditApproved: data.creditApproved,
        parking: data.parking,
        lat: data.lat,
        lng: data.lng,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        departmentId: data.departmentId,
        localityId: data.localityId,
        images: data.images as unknown as Prisma.InputJsonValue,
        amenities: data.amenities as unknown as Prisma.InputJsonValue,
        sourceUrl: data.sourceUrl,
        publisherId: data.publisherId,
        isMock: data.isMock ?? false,
        embedding: data.embedding,
      } as unknown as Prisma.PropertyCreateInput,
    });
    return this.toProperty(property as unknown as Record<string, unknown>);
  }

  async findFirstNotInIds(ids: string[], limit = 1): Promise<Property | null> {
    const property = await prisma.property.findFirst({
      where: {
        isActive: true,
        id: { notIn: ids },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    if (!property) return null;
    return this.toProperty(property as unknown as Record<string, unknown>);
  }

  async search(params: SearchParams): Promise<PagedResult<Property>> {
    const {
      query = '',
      locationQuery = '',
      localityIds = [],
      lat,
      lng,
      radiusKm = 50,
      operationType,
      page = 1,
      limit = 20,
      excludeIds = [],
      filters,
    } = params;

    const offset = (page - 1) * limit;
    const hasGeo = lat != null && lng != null;

    let opCondition: string | null = null;
    const effectiveListingType = operationType ?? filters?.listingType;
    if (effectiveListingType) {
      const dbType = effectiveListingType === 'SALE' ? 'sale' : effectiveListingType === 'RENT' ? 'rent' : effectiveListingType;
      opCondition = `p.listing_type = '${dbType}'`;
    }

    const buildQuery = (useGeo: boolean): { whereClause: string; params: (string | number | string[] | boolean)[]; distanceExpr: string } => {
      const conditions: string[] = ['p.is_active = true'];
      if (opCondition) conditions.push(opCondition);
      const queryParams: (string | number | string[] | boolean)[] = [];

      const buildTextSearchCondition = (text: string) => {
        const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 0) return null;

        const fields = ['p.title', 'p.description', 'p.address', 'p.neighborhood', 'p.city', 'p.department_id'];
        const wordConditions: string[] = [];

        for (const word of words) {
          const paramsForWord: number[] = [];
          for (let i = 0; i < fields.length; i++) {
            const idx = queryParams.length + 1;
            queryParams.push(`%${word}%`);
            paramsForWord.push(idx);
          }
          const fieldConditions = fields.map((_, i) => `${fields[i]} ILIKE $${paramsForWord[i]}`);
          wordConditions.push(`(${fieldConditions.join(' OR ')})`);
        }

        return `(${wordConditions.join(' AND ')})`;
      };

      const textCond = buildTextSearchCondition(query);
      if (textCond) conditions.push(textCond);

      if (localityIds.length === 0 && locationQuery) {
        const locCond = buildTextSearchCondition(locationQuery);
        if (locCond) conditions.push(locCond);
      }

      // --- LEVEL 3: Locality IDs (strict geographical hierarchy) ---
      // Uses individual IN() placeholders to avoid Postgres array parsing issues with $queryRawUnsafe
      if (localityIds.length > 0) {
        const placeholders = localityIds.map((id) => {
          queryParams.push(id);
          return `$${queryParams.length}`;
        });
        conditions.push(`(p.department_id IN (${placeholders.join(', ')}) OR p.locality_id IN (${placeholders.join(', ')}))`);
      }

      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map((id) => {
          queryParams.push(id);
          return `$${queryParams.length}`;
        });
        conditions.push(`p.id NOT IN (${placeholders.join(', ')})`);
      }

      if (filters?.propertyTypes?.length) {
        const placeholders = filters.propertyTypes.map((type) => {
          queryParams.push(type);
          return `$${queryParams.length}`;
        });
        conditions.push(`p.property_type IN (${placeholders.join(', ')})`);
      }

      if (filters?.priceMin != null) {
        const pMinIdx = queryParams.length + 1;
        queryParams.push(filters.priceMin);
        conditions.push(`p.price >= $${pMinIdx}`);
      }

      if (filters?.priceMax != null) {
        const pMaxIdx = queryParams.length + 1;
        queryParams.push(filters.priceMax);
        conditions.push(`p.price <= $${pMaxIdx}`);
      }

      if (filters?.bedrooms?.length) {
        const placeholders = filters.bedrooms.map((num) => {
          queryParams.push(Number(num));
          return `$${queryParams.length}`;
        });
        conditions.push(`p.bedrooms IN (${placeholders.join(', ')})`);
      }

      if (filters?.rooms?.length) {
        const placeholders = filters.rooms.map((num) => {
          queryParams.push(Number(num));
          return `$${queryParams.length}`;
        });
        conditions.push(`p.rooms IN (${placeholders.join(', ')})`);
      }

      if (filters?.bathrooms != null) {
        const baIdx = queryParams.length + 1;
        queryParams.push(filters.bathrooms);
        conditions.push(`p.bathrooms >= $${baIdx}`);
      }

      if (filters?.amenities?.length) {
        const amIdx = queryParams.length + 1;
        const amArr = filters.amenities;
        queryParams.push(amArr);
        conditions.push(`p.amenities::jsonb ?| $${amIdx}::text[]`);
      }

      if (filters?.creditApproved != null) {
        const caIdx = queryParams.length + 1;
        queryParams.push(filters.creditApproved);
        conditions.push(`p.credit_approved = $${caIdx}`);
      }

      if (filters?.parking) {
        const pkIdx = queryParams.length + 1;
        queryParams.push(filters.parking);
        conditions.push(`p.parking = $${pkIdx}`);
      }

      if (filters?.sellerType) {
        const stIdx = queryParams.length + 1;
        queryParams.push(filters.sellerType);
        conditions.push(`p.seller_type = $${stIdx}`);
      }

      if (filters?.currency) {
        const curIdx = queryParams.length + 1;
        queryParams.push(filters.currency);
        conditions.push(`p.price_currency = $${curIdx}`);
      }

      if (filters?.listingSubType) {
        const lstIdx = queryParams.length + 1;
        queryParams.push(filters.listingSubType);
        conditions.push(`p.listing_sub_type = $${lstIdx}`);
      }

      let distanceExpr = '0 AS distance_km';

      if (useGeo && hasGeo && Number.isFinite(lat as number) && Number.isFinite(lng as number)) {
        const latIdx = queryParams.length + 1;
        const lngIdx = queryParams.length + 2;
        const radiusIdx = queryParams.length + 3;
        queryParams.push(lat, lng, radiusKm);
        conditions.push(
          `(6371 * acos(cos(radians($${latIdx})) * cos(radians(p.lat)) * cos(radians(p.lng) - radians($${lngIdx})) + sin(radians($${latIdx})) * sin(radians(p.lat)))) <= $${radiusIdx}`
        );
        distanceExpr = `(6371 * acos(cos(radians($${latIdx})) * cos(radians(p.lat)) * cos(radians(p.lng) - radians($${lngIdx})) + sin(radians($${latIdx})) * sin(radians(p.lat)))) AS distance_km`;
      }

      queryParams.push(limit, offset);

      const whereClause = conditions.join(' AND ');
      return { whereClause, params: queryParams, distanceExpr: distanceExpr };
    };

    const runQuery = async (useGeo: boolean) => {
      const { whereClause, params, distanceExpr } = buildQuery(useGeo);

      const countParams = params.slice(0, -2);

      const countQuery = `
        SELECT COUNT(*) as total_count
        FROM properties p
        WHERE ${whereClause}
      `;

      const dataQuery = `
        SELECT
          p.id, p.title, p.description, p.price, p.area_m2, p.total_monthly_cost, p.rooms, p.bedrooms, p.bathrooms,
          p.property_type, p.listing_type, p.listing_sub_type, p.seller_type, p.price_currency, p.credit_approved, p.parking,
          p.lat, p.lng, p.address, p.neighborhood, p.city, p.department_id, p.locality_id, p.images, p.amenities, p.source_url, p.source_id,
          p.is_active, p.created_at, p.updated_at, p.publisher_id, p.is_mock, p.embedding,
          ${distanceExpr}
        FROM properties p
        WHERE ${whereClause}
        ORDER BY ${useGeo ? 'distance_km ASC' : 'p.created_at DESC'}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;

      const [countResult, rows] = await Promise.all([
        prisma.$queryRawUnsafe<{ total_count: number }[]>(countQuery, ...countParams),
        prisma.$queryRawUnsafe<Record<string, unknown>[]>(dataQuery, ...params),
      ]);

      const totalCount = Number(countResult?.[0]?.total_count ?? 0);
      const properties = rows.map((row: Record<string, unknown>) => this.toProperty(row));

      return { properties, totalCount };
    };

    let { properties, totalCount } = await runQuery(hasGeo);

    if (totalCount === 0 && hasGeo) {
      const fallback = await runQuery(false);
      properties = fallback.properties;
      totalCount = fallback.totalCount;
    }

    return {
      items: properties,
      total: totalCount,
      page,
      limit,
      hasMore: page * limit < totalCount,
    };
  }
}

export class PrismaInteractionRepository implements InteractionRepository {
  async create(data: {
    propertyId: string;
    interactionType: 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SUPERLIKE' | 'VIEW_DETAIL' | 'CONTACT_REALTOR' | 'SAVE' | 'SHARE';
    swipeDirection?: 'left' | 'right' | 'up';
    sessionId: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.userInteraction.create({
      data: {
        propertyId: data.propertyId,
        interactionType: data.interactionType,
        swipeDirection: data.swipeDirection,
        sessionId: data.sessionId,
        userId: data.userId,
        metadata: data.metadata as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findRecentBySession(sessionId: string, limit = 100): Promise<Array<{ propertyId: string }>> {
    const interactions = await prisma.userInteraction.findMany({
      where: { sessionId },
      select: { propertyId: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return interactions;
  }
}

export class PrismaPropertyReportRepository implements PropertyReportRepository {
  async create(data: CreatePropertyReportInput): Promise<PropertyReport> {
    const report = await prisma.propertyReport.create({
      data: {
        property: { connect: { id: data.propertyId } },
        reason: data.reason as any,
        details: data.details,
        reporterEmail: data.reporterEmail,
      },
    });
    return {
      id: report.id,
      propertyId: report.propertyId,
      reason: report.reason as PropertyReport['reason'],
      details: report.details,
      reporterEmail: report.reporterEmail,
      createdAt: report.createdAt,
    };
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    const count = await prisma.propertyReport.count({
      where: { propertyId },
    });
    return count;
  }

  async getReportedPropertyIds(threshold = 1): Promise<string[]> {
    const results = await prisma.propertyReport.groupBy({
      by: ['propertyId'],
      _count: { propertyId: true },
      having: {
        propertyId: {
          _count: { gte: threshold },
        },
      },
    });
    return results.map((r: { propertyId: string }) => r.propertyId);
  }
}
