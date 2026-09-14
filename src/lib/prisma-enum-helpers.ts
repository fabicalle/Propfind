import { PropertyType, ListingType, SellerType } from '@prisma/client';

export type PropertyTypeEnum = PropertyType;
export type ListingTypeEnum = ListingType;
export type SellerTypeEnum = SellerType;

const PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  APARTMENT: 'apartment',
  APARTAMENTO: 'apartment',
  DEPARTAMENTO: 'apartment',
  DEPT: 'apartment',
  FLAT: 'apartment',
  HOUSE: 'house',
  CASA: 'house',
  CHALET: 'house',
  CHALET_INDIVIDUAL: 'house',
  CONDO: 'condo',
  CONDOMINIO: 'condo',
  LAND: 'land',
  TERRENO: 'land',
  LOTE: 'land',
  SOLAR: 'land',
  COMMERCIAL: 'commercial',
  LOCAL: 'commercial',
  OFICINA: 'commercial',
  COMERCIO: 'commercial',
  NAVE: 'commercial',
  GALPON: 'commercial',
};

const LISTING_TYPE_MAP: Record<string, ListingType> = {
  SALE: 'sale',
  VENTA: 'sale',
  COMPRA: 'sale',
  RENT: 'rent',
  ALQUILER: 'rent',
  ARRIENDO: 'rent',
  RENTA: 'rent',
  TEMPORAL: 'rent',
  ALQUILER_TEMPORAL: 'rent',
};

const SELLER_TYPE_MAP: Record<string, SellerType> = {
  OWNER: 'OWNER',
  DUEÑO: 'OWNER',
  DUENO: 'OWNER',
  PROPIETARIO: 'OWNER',
  DIRECTO: 'OWNER',
  AGENCY: 'AGENCY',
  INMOBILIARIA: 'AGENCY',
  AGENCIA: 'AGENCY',
  BROKER: 'AGENCY',
};

export function parsePropertyType(raw: unknown): PropertyType | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const normalized = raw.trim().toUpperCase();
  return PROPERTY_TYPE_MAP[normalized];
}

export function parseListingType(raw: unknown): ListingType | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const normalized = raw.trim().toUpperCase();
  return LISTING_TYPE_MAP[normalized];
}

export function parseSellerType(raw: unknown): SellerType | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const normalized = raw.trim().toUpperCase();
  return SELLER_TYPE_MAP[normalized];
}

export function parseEnumSafe<T extends string>(
  enumMap: Record<string, T>,
  raw: unknown
): T | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const normalized = raw.trim().toUpperCase();
  return enumMap[normalized];
}

export function validatePropertyTypes(raw: unknown[]): PropertyType[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => parsePropertyType(v))
    .filter((v): v is PropertyType => v !== undefined);
}

export function validateListingTypes(raw: unknown[]): ListingType[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => parseListingType(v))
    .filter((v): v is ListingType => v !== undefined);
}

export function validateSellerTypes(raw: unknown[]): SellerType[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => parseSellerType(v))
    .filter((v): v is SellerType => v !== undefined);
}