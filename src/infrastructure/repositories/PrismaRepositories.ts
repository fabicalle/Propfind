import { PropertyRepository, InteractionRepository } from '@/application/ports';
import { Property } from '@/domain/entities';
import { BoundingBox, PropertySearchFilters, CreatePropertyInput } from '@/domain/value-objects';
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
      images: (row.images as Array<{ url: string; width: number; height: number; alt?: string }>) || [],
      amenities: (row.amenities as string[]) || [],
      sourceUrl: row.sourceUrl as string | null,
      isActive: (row.isActive as boolean) ?? true,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string),
      publisherId: (row.publisher_id as string | null) ?? null,
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

    const whereConditions: string[] = ['p.is_active = true'];
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

    const rows = (await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        description: string | null;
        price: unknown;
        area_m2: unknown;
        rooms: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        property_type: string | null;
        listing_type: unknown;
        listing_sub_type: string | null;
        seller_type: unknown;
        price_currency: string | null;
        credit_approved: boolean | null;
        parking: string | null;
        lat: number;
        lng: number;
        address: string | null;
        neighborhood: string | null;
        city: string | null;
        images: unknown;
        amenities: unknown;
        source_url: string | null;
        is_active: boolean;
        created_at: unknown;
        publisher_id: string | null;
      }>
    >`
      SELECT
        p.id, p.title, p.description, p.price, p.area_m2, p.rooms, p.bedrooms, p.bathrooms,
        p.property_type, p.listing_type, p.listing_sub_type, p.seller_type, p.price_currency, p.credit_approved, p.parking,
        p.lat, p.lng, p.address, p.neighborhood, p.city, p.images, p.amenities, p.source_url, p.is_active, p.created_at, p.publisher_id
      FROM properties p
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `, ...queryParams, limit, offset));

    return rows.map((row) => this.toProperty(row));
  }

  async findById(id: string): Promise<Property | null> {
    const property = await prisma.property.findUnique({
      where: { id },
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
        images: data.images as unknown as Prisma.InputJsonValue,
        amenities: data.amenities as unknown as Prisma.InputJsonValue,
        sourceUrl: data.sourceUrl,
        publisherId: data.publisherId,
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
