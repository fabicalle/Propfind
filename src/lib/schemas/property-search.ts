import { z } from 'zod';
import { PropertyType, ListingType } from '@prisma/client';

const cleanOptionalString = z
  .string()
  .transform((val) => {
    if (val === '' || val === 'ALL' || val === 'all') return undefined;
    const trimmed = val.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  .optional();

export const PropertySearchSchema = z.object({
  query: cleanOptionalString,
  locationQuery: cleanOptionalString,
  localityIds: z.array(z.string().uuid()).optional(),
  lat: z.coerce.number({ invalid_type_error: 'Latitud inválida' }).optional(),
  lng: z.coerce.number({ invalid_type_error: 'Longitud inválida' }).optional(),
  radiusKm: z.coerce.number({ invalid_type_error: 'Radio inválido' }).optional(),
  operationType: z
    .string()
    .transform((val) => {
      if (val === '' || val === undefined || val === 'ALL' || val === 'all') return 'ALL';
      return val.toUpperCase();
    })
    .pipe(z.enum(['ALL', 'RENT', 'SALE']))
    .default('ALL'),
  page: z.coerce.number({ invalid_type_error: 'Página inválida' }).int().positive().default(1),
  limit: z.coerce.number({ invalid_type_error: 'Límite inválido' }).int().positive().max(100).default(20),
  propertyType: z
    .string()
    .transform((val) => (val === '' || val === 'ALL' ? undefined : val))
    .pipe(z.nativeEnum(PropertyType).optional())
    .optional(),
  listingType: z
    .string()
    .transform((val) => (val === '' || val === 'ALL' ? undefined : val))
    .pipe(z.nativeEnum(ListingType).optional())
    .optional(),
  priceMin: z.coerce.number({ invalid_type_error: 'Precio mínimo inválido' }).optional(),
  priceMax: z.coerce.number({ invalid_type_error: 'Precio máximo inválido' }).optional(),
  bedrooms: z.coerce.number({ invalid_type_error: 'Dormitorios inválido' }).int().positive().optional(),
  rooms: z.coerce.number({ invalid_type_error: 'Ambientes inválido' }).int().positive().optional(),
  bathrooms: z.coerce.number({ invalid_type_error: 'Baños inválido' }).int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  excludeIds: z.array(z.string().uuid()).optional(),
});

export type PropertySearchInput = z.infer<typeof PropertySearchSchema>;
