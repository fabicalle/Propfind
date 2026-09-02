import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectInvalidOrigin } from '@/lib/security/origin';
import { withCsrf } from '@/lib/security/withCsrf';
import { logSuspiciousInput } from '@/lib/security/auditLog';

const ParseTextSchema = z.object({
  text: z.string().min(1, 'El texto es requerido'),
});

interface ParsedPropertyData {
  title?: string;
  listingType?: 'rent' | 'sale';
  propertyType?: string;
  price?: number;
  expenses?: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  rooms?: number;
  bathrooms?: number;
  areaM2?: number;
  amenities?: string[];
  description?: string;
}

function extractWithHeuristics(text: string): ParsedPropertyData {
  const result: ParsedPropertyData = {};

  const lowerText = text.toLowerCase();

  if (lowerText.includes('alquiler') || lowerText.includes('renta') || lowerText.includes('arriendo')) {
    result.listingType = 'rent';
  } else if (lowerText.includes('venta') || lowerText.includes('vende') || lowerText.includes('compro')) {
    result.listingType = 'sale';
  }

  const propertyTypes: Record<string, string> = {
    'departamento': 'apartment',
    'depto': 'apartment',
    'casa': 'house',
    'penthouse': 'penthouse',
    'ph': 'penthouse',
    'local': 'commercial',
    'comercial': 'commercial',
    'terreno': 'land',
    'lote': 'land',
  };

  for (const [keyword, type] of Object.entries(propertyTypes)) {
    if (lowerText.includes(keyword)) {
      result.propertyType = type;
      break;
    }
  }

  const priceMatch = text.match(/\$[\s]?([0-9]+(?:\.[0-9]{3})*)/);
  if (priceMatch) {
    result.price = parseInt(priceMatch[1].replace(/\./g, ''));
  }

  const expensesMatch = text.match(/expensas?[\s:]+[\$]?([0-9]+)/);
  if (expensesMatch) {
    result.expenses = parseInt(expensesMatch[1]);
  }

  const roomsMatch = text.match(/(\d+)\s*(?:dormitorio|habitaci[oó]n|cuarto|bed)/);
  if (roomsMatch) {
    result.rooms = parseInt(roomsMatch[1]);
  }

  const bathMatch = text.match(/(\d+)\s*(?:ba[ñn]o|bathroom)/);
  if (bathMatch) {
    result.bathrooms = parseInt(bathMatch[1]);
  }

  const areaMatch = text.match(/(\d+)\s*m[²2]/);
  if (areaMatch) {
    result.areaM2 = parseInt(areaMatch[1]);
  }

  const addressMatch = text.match(/([A-Za-zÀ-ÿ]+\s+(?:calle|av\.?|avenida|boulevard|blvd\.?|pasaje|pje\.?)\s+\d+)/i);
  if (addressMatch) {
    result.address = addressMatch[1];
  }

  const amenities: string[] = [];
  const amenityKeywords = [
    'patio',
    'lavandería',
    'cocina',
    'balcón',
    'terraza',
    'cochera',
    'piscina',
    'seguridad',
    'aire acondicionado',
    'calefacción',
    'mascotas permitidas',
  ];

  for (const keyword of amenityKeywords) {
    if (lowerText.includes(keyword)) {
      amenities.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  if (amenities.length > 0) result.amenities = amenities;

  return result;
}

async function POST_impl(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const validated = ParseTextSchema.parse(body);

    if (validated.text.length > 5000) {
      logSuspiciousInput(request, 'text', validated.text);
    }

    const parsed = extractWithHeuristics(validated.text);

    return NextResponse.json({
      success: true,
      data: parsed,
      confidence: parsed.title || parsed.price ? 'medium' : 'low',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message || 'Invalid input' } },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Error al parsear el texto' }, { status: 500 });
  }
}

export const POST = withCsrf(POST_impl);
