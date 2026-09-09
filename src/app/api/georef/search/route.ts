import { NextRequest, NextResponse } from 'next/server';
import { rejectInvalidOrigin } from '@/lib/security/origin';

interface GeorefLocalidad {
  id: string;
  nombre: string;
  departamento: { id: string; nombre: string };
  provincia: { id: string; nombre: string };
  centroide: { lat: number; lng: number };
}

interface GeorefDepartamento {
  id: string;
  nombre: string;
  provincia: { id: string; nombre: string };
  centroide: { lat: number; lng: number };
}

interface GeorefSearchResponse {
  localidades?: GeorefLocalidad[];
  departamentos?: GeorefDepartamento[];
}

const GEOREF_API = 'https://apis.datosgobar.gob.ar/georef/api';

function mapProvinceName(provinceId: string, provinceName: string): string {
  const nameMap: Record<string, string> = {
    '06': 'BUENOS AIRES',
    '02': 'CATAMARCA',
    '22': 'CHACO',
    '26': 'CHUBUT',
    '14': 'CORDoba',
    '18': 'CORRECDENTES',
    '30': 'ENTRE RIOS',
    '16': 'FORMOSA',
    '90': 'JUAJUY',
    '42': 'LA PAMPA',
    '25': 'LA RIOJA',
    '43': 'MENDOZA',
    '27': 'MISIONES',
    '29': 'NEUQUEN',
    '44': 'RIO NEGRO',
    '38': 'SALTA',
    '66': 'SAN JUAN',
    '70': 'SAN LUIS',
    '50': 'SANTA CRUZ',
    '21': 'SANTA FE',
    '32': 'SANTIAGO DEL ESTERO',
    '52': 'TIERRA DEL FUEGO',
    '54': 'TUCUMAN',
    '01': 'CABA',
  };
  const mapped = nameMap[provinceId];
  if (mapped) return mapped;
  return provinceName;
}

export async function GET(request: NextRequest) {
  const originError = rejectInvalidOrigin(request);
  if (originError) return originError;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const max = Math.min(parseInt(searchParams.get('max') || '10'), 20);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ data: { localidades: [], departamentos: [] } });
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const baseUrl = `${GEOREF_API}/localidades?nombre=${encodedQuery}&max=${max}&campos=id,nombre,departamento.nombre,provincia.nombre,centroide`;

    const response = await fetch(baseUrl, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Georef API error: ${response.status}`);
    }

    const georefData = await response.json();
    const rawLocalidades = georefData.localidades || [];

    const localidades = rawLocalidades.map((loc: GeorefLocalidad) => ({
      id: loc.id,
      name: loc.nombre,
      provinceId: loc.provincia.id,
      provinceName: loc.provincia.nombre,
      departmentId: loc.departamento.id,
      departmentName: loc.departamento.nombre,
      lat: loc.centroide.lat,
      lng: loc.centroide.lng,
    }));

    const deptUrl = `${GEOREF_API}/departamentos?nombre=${encodedQuery}&max=${max}&campos=id,nombre,provincia.nombre,centroide`;
    let departamentos: any[] = [];
    try {
      const deptResponse = await fetch(deptUrl, {
        next: { revalidate: 300 },
      });
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        departamentos = (deptData.departamentos || []).map((dept: GeorefDepartamento) => ({
          id: dept.id,
          name: dept.nombre,
          provinceId: dept.provincia.id,
          provinceName: dept.provincia.nombre,
          lat: dept.centroide.lat,
          lng: dept.centroide.lng,
        }));
      }
    } catch {
      // Departamentos search is secondary, ignore errors
    }

    return NextResponse.json({ data: { localidades, departamentos } });
  } catch (error) {
    console.error('Georef API error:', error);
    return NextResponse.json(
      { data: { localidades: [], departamentos: [] } },
      { status: 200 }
    );
  }
}
