export interface LocationZone {
  id: string;
  name: string;
  bbox?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
}

export interface LocationDepartment {
  id: string;
  name: string;
  zones: LocationZone[];
  bbox?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  aliases?: string[];
}

export interface LocationProvince {
  id: string;
  name: string;
  departments: LocationDepartment[];
}

export interface LocationIndex {
  provinceId: string;
  provinceName: string;
  departmentId: string;
  departmentName: string;
  localityId?: string;
  localityName?: string;
}

export const MENDOZA_PROVINCE_ID = 'mendoza';
export const DEFAULT_DEPARTMENT_ID = 'all';
export const DEFAULT_DEPARTMENT_NAME = 'Todos';

export const LOCATIONS: LocationProvince[] = [
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    departments: [
      {
        id: 'la-plata',
        name: 'La Plata',
        bbox: { south: -34.98, west: -58.15, north: -34.88, east: -57.80 },
        zones: [
          { id: 'centro', name: 'Centro' },
          { id: 'norte', name: 'Norte' },
          { id: 'sur', name: 'Sur' },
        ],
      },
      {
        id: 'mar-del-plata',
        name: 'Mar del Plata',
        bbox: { south: -38.10, west: -58.00, north: -37.90, east: -57.30 },
        zones: [
          { id: 'centro-mdp', name: 'Centro' },
          { id: 'zona-sur', name: 'Zona Sur' },
          { id: 'zona-norte', name: 'Zona Norte' },
        ],
      },
      {
        id: 'bahia-blanca',
        name: 'Bahía Blanca',
        bbox: { south: -38.85, west: -62.35, north: -38.65, east: -61.95 },
        zones: [
          { id: 'centro-bb', name: 'Centro' },
          { id: 'zona-norte-bb', name: 'Zona Norte' },
        ],
      },
      {
        id: 'tigre',
        name: 'Tigre',
        bbox: { south: -34.48, west: -58.75, north: -34.35, east: -58.45 },
        zones: [
          { id: 'centro-tigre', name: 'Centro' },
          { id: 'delta', name: 'Delta' },
        ],
      },
      {
        id: 'la-matanza',
        name: 'La Matanza',
        bbox: { south: -34.85, west: -58.75, north: -34.65, east: -58.40 },
        zones: [],
      },
      {
        id: 'la-pampa-bsas',
        name: 'La Pampa',
        bbox: { south: -36.50, west: -62.00, north: -34.50, east: -58.00 },
        zones: [],
      },
      {
        id: 'general-laso',
        name: 'General Laso',
        bbox: { south: -34.70, west: -58.60, north: -34.55, east: -58.30 },
        zones: [],
      },
    ],
  },
  {
    id: 'catamarca',
    name: 'Catamarca',
    departments: [
      {
        id: 'capital-catamarca',
        name: 'Capital',
        bbox: { south: -29.90, west: -66.90, north: -29.75, east: -66.70 },
        zones: [
          { id: 'san-fernando', name: 'San Fernando del Valle' },
        ],
      },
    ],
  },
  {
    id: 'chaco',
    name: 'Chaco',
    departments: [
      {
        id: 'capital-chaco',
        name: 'Capital',
        bbox: { south: -27.10, west: -58.90, north: -26.90, east: -58.70 },
        zones: [
          { id: 'resistencia', name: 'Resistencia' },
          { id: 'barranqueras', name: 'Barranqueras' },
        ],
      },
    ],
  },
  {
    id: 'chubut',
    name: 'Chubut',
    departments: [
      {
        id: 'rawson',
        name: 'Rawson',
        bbox: { south: -46.80, west: -67.90, north: -43.00, east: -65.00 },
        zones: [
          { id: 'rawson-ciudad', name: 'Rawson' },
          { id: 'puerto-madryn', name: 'Puerto Madryn' },
        ],
      },
    ],
  },
  {
    id: 'cordoba',
    name: 'Córdoba',
    departments: [
      {
        id: 'capital-cordoba',
        name: 'Capital',
        bbox: { south: -31.50, west: -64.25, north: -31.35, east: -64.10 },
        zones: [
          { id: 'cordoba-centro', name: 'Córdoba Centro' },
          { id: 'nueva-cordoba', name: 'Nueva Córdoba' },
          { id: 'guemes', name: 'Güemes' },
        ],
      },
      {
        id: 'villa-carlos-paz',
        name: 'Villa Carlos Paz',
        bbox: { south: -31.48, west: -64.30, north: -31.40, east: -64.18 },
        zones: [
          { id: 'centro-vcp', name: 'Centro' },
          { id: 'zona-lago', name: 'Zona Lago' },
        ],
      },
    ],
  },
  {
    id: 'corrientes',
    name: 'Corrientes',
    departments: [
      {
        id: 'capital-corrientes',
        name: 'Capital',
        bbox: { south: -27.50, west: -58.95, north: -27.35, east: -58.75 },
        zones: [
          { id: 'corrientes-ciudad', name: 'Corrientes' },
        ],
      },
    ],
  },
  {
    id: 'entre-rios',
    name: 'Entre Ríos',
    departments: [
      {
        id: 'parana',
        name: 'Paraná',
        bbox: { south: -32.00, west: -60.40, north: -31.80, east: -59.90 },
        zones: [
          { id: 'parana-centro', name: 'Paraná Centro' },
          { id: 'costanera', name: 'Costanera' },
        ],
      },
    ],
  },
  {
    id: 'formosa',
    name: 'Formosa',
    departments: [
      {
        id: 'capital-formosa',
        name: 'Capital',
        bbox: { south: -26.35, west: -58.25, north: -26.15, east: -58.00 },
        zones: [
          { id: 'formosa-ciudad', name: 'Formosa' },
        ],
      },
    ],
  },
  {
    id: 'jujuy',
    name: 'Jujuy',
    departments: [
      {
        id: 'capital-jujuy',
        name: 'Dr. Manuel Belgrano',
        bbox: { south: -24.25, west: -65.40, north: -24.05, east: -65.15 },
        zones: [
          { id: 'san-salvador', name: 'San Salvador de Jujuy' },
        ],
      },
    ],
  },
  {
    id: 'la-pampa',
    name: 'La Pampa',
    departments: [
      {
        id: 'capital-la-pampa',
        name: 'Capital',
        bbox: { south: -46.50, west: -65.00, north: -45.80, east: -63.50 },
        zones: [
          { id: 'santa-rosa', name: 'Santa Rosa' },
        ],
      },
    ],
  },
  {
    id: 'la-rioja',
    name: 'La Rioja',
    departments: [
      {
        id: 'capital-la-rioja',
        name: 'Capital',
        bbox: { south: -29.45, west: -68.40, north: -29.25, east: -67.90 },
        zones: [
          { id: 'la-rioja-ciudad', name: 'La Rioja' },
        ],
      },
    ],
  },
  {
    id: MENDOZA_PROVINCE_ID,
    name: 'Mendoza',
    departments: [
      {
        id: 'godoy-cruz',
        name: 'Godoy Cruz',
        aliases: ['godoy cruz'],
        bbox: { south: -32.96, west: -68.90, north: -32.88, east: -68.80 },
        zones: [
          { id: 'palmares', name: 'Palmares' },
          { id: 'bombal-sur', name: 'Barrio Bombal Sur' },
          { id: 'centro-gc', name: 'Godoy Cruz Centro' },
          { id: 'trapiche', name: 'El Trapiche' },
          { id: 'las-tortugas', name: 'Las Tortugas' },
          { id: 'benegas', name: 'Benegas' },
          { id: 'parque-san-martin', name: 'Parque San Martín' },
          { id: 'villa-marini', name: 'Villa Marini' },
          { id: 'la-travesia', name: 'La Travesía' },
          { id: 'chacras-de-godoy-cruz', name: 'Chacras de Godoy Cruz' },
          { id: 'san-martin', name: 'San Martín' },
        ],
      },
      {
        id: 'capital',
        name: 'Ciudad de Mendoza',
        aliases: ['mendoza', 'ciudad de mendoza'],
        bbox: { south: -32.93, west: -68.89, north: -32.85, east: -68.79 },
        zones: [
          { id: 'quinta-seccion', name: 'Quinta Sección' },
          { id: 'sexta-seccion', name: 'Sexta Sección' },
          { id: 'bombal-norte', name: 'Barrio Bombal' },
          { id: 'microcentro', name: 'Microcentro / Centro' },
          { id: 'seccion-primera', name: 'Primera Sección' },
        ],
      },
      {
        id: 'lujan-de-cuyo',
        name: 'Luján de Cuyo',
        aliases: ['lujan de cuyo', 'luján de cuyo'],
        bbox: { south: -33.05, west: -68.95, north: -32.95, east: -68.80 },
        zones: [
          { id: 'chacras-de-coria', name: 'Chacras de Coria' },
          { id: 'vistalba', name: 'Vistalba' },
          { id: 'carrodilla', name: 'Carrodilla' },
          { id: 'mayor-drummond', name: 'Mayor Drummond' },
          { id: 'las-compuertas', name: 'Las Compuertas' },
        ],
      },
      {
        id: 'guaymallen',
        name: 'Guaymallén',
        aliases: ['guaymallen'],
        bbox: { south: -32.93, west: -68.83, north: -32.83, east: -68.73 },
        zones: [
          { id: 'dorrego', name: 'Dorrego' },
          { id: 'villa-nueva', name: 'Villa Nueva' },
          { id: 'san-jose', name: 'San José' },
          { id: 'santa-ana', name: 'Barrio Santa Ana' },
        ],
      },
      {
        id: 'maipu',
        name: 'Maipú',
        aliases: ['maipu'],
        bbox: { south: -32.98, west: -68.83, north: -32.88, east: -68.73 },
        zones: [
          { id: 'maipu-centro', name: 'Maipú Centro' },
          { id: 'coquimbito', name: 'Coquimbito' },
          { id: 'luzuriaga', name: 'Luzuriaga' },
          { id: 'general-gutierrez', name: 'General Gutiérrez' },
        ],
      },
      {
        id: 'las-heras',
        name: 'Las Heras',
        aliases: ['las heras'],
        bbox: { south: -32.88, west: -68.83, north: -32.78, east: -68.73 },
        zones: [
          { id: 'el-challao', name: 'El Challao' },
          { id: 'las-heras-centro', name: 'Las Heras Centro' },
          { id: 'barrio-cementista', name: 'Barrio Cementista' },
        ],
      },
    ],
  },
  {
    id: 'caba',
    name: 'Ciudad Autónoma de Buenos Aires',
    departments: [
      {
        id: 'caba-ciudad',
        name: 'CABA',
        bbox: { south: -34.67, west: -58.45, north: -34.55, east: -58.30 },
        zones: [
          { id: 'palermo', name: 'Palermo' },
          { id: 'recoleta', name: 'Recoleta' },
          { id: 'belgrano', name: 'Belgrano' },
          { id: 'san-telmo', name: 'San Telomo' },
          { id: 'microcentro-caba', name: 'Microcentro' },
          { id: 'caballito', name: 'Caballito' },
          { id: 'la-boca', name: 'La Boca' },
          { id: 'barracas', name: 'Barracas' },
          { id: 'palermo-hollywood', name: 'Palermo Hollywood' },
          { id: 'microcentro', name: 'Microcentro' },
        ],
      },
    ],
  },
  {
    id: 'misiones',
    name: 'Misiones',
    departments: [
      {
        id: 'capital-misiones',
        name: 'Capital',
        bbox: { south: -27.35, west: -55.95, north: -27.10, east: -55.60 },
        zones: [
          { id: 'posadas', name: 'Posadas' },
        ],
      },
    ],
  },
  {
    id: 'neuquen',
    name: 'Neuquén',
    departments: [
      {
        id: 'confluencia',
        name: 'Confluencia',
        bbox: { south: -40.80, west: -71.70, north: -40.60, east: -71.40 },
        zones: [
          { id: 'neuquen-ciudad', name: 'Neuquén' },
        ],
      },
    ],
  },
  {
    id: 'rio-negro',
    name: 'Río Negro',
    departments: [
      {
        id: 'general-roca',
        name: 'General Roca',
        bbox: { south: -45.10, west: -68.00, north: -40.00, east: -63.00 },
        zones: [
          { id: 'bariloche', name: 'San Carlos de Bariloche' },
          { id: 'viedma', name: 'Viedma' },
        ],
      },
    ],
  },
  {
    id: 'salta',
    name: 'Salta',
    departments: [
      {
        id: 'capital-salta',
        name: 'Capital',
        bbox: { south: -24.55, west: -65.30, north: -24.30, east: -65.00 },
        zones: [
          { id: 'salta-ciudad', name: 'Salta' },
        ],
      },
    ],
  },
  {
    id: 'san-juan',
    name: 'San Juan',
    departments: [
      {
        id: 'capital-san-juan',
        name: 'Capital',
        bbox: { south: -31.60, west: -69.30, north: -31.30, east: -68.90 },
        zones: [
          { id: 'san-juan-ciudad', name: 'San Juan' },
        ],
      },
    ],
  },
  {
    id: 'san-luis',
    name: 'San Luis',
    departments: [
      {
        id: 'capital-san-luis',
        name: 'Capital',
        bbox: { south: -33.35, west: -66.40, north: -33.20, east: -66.10 },
        zones: [
          { id: 'san-luis-ciudad', name: 'San Luis' },
        ],
      },
    ],
  },
  {
    id: 'santa-cruz',
    name: 'Santa Cruz',
    departments: [
      {
        id: 'guer-aike',
        name: 'Güer Aike',
        bbox: { south: -51.50, west: -72.50, north: -47.50, east: -67.50 },
        zones: [
          { id: 'rio-gallegos', name: 'Río Gallegos' },
          { id: 'el-calafate', name: 'El Calafate' },
        ],
      },
    ],
  },
  {
    id: 'santa-fe',
    name: 'Santa Fe',
    departments: [
      {
        id: 'la-capital',
        name: 'La Capital',
        bbox: { south: -31.70, west: -60.80, north: -31.50, east: -60.50 },
        zones: [
          { id: 'santa-fe-ciudad', name: 'Santa Fe' },
          { id: 'santo-tome', name: 'Santo Tomé' },
        ],
      },
      {
        id: 'rosario',
        name: 'Rosario',
        bbox: { south: -31.50, west: -60.70, north: -31.30, east: -60.60 },
        zones: [
          { id: 'centro-rosario', name: 'Centro' },
          { id: 'norte-rosario', name: 'Norte' },
        ],
      },
    ],
  },
  {
    id: 'santiago-del-estero',
    name: 'Santiago del Estero',
    departments: [
      {
        id: 'capital-santiago',
        name: 'Capital',
        bbox: { south: -27.85, west: -64.35, north: -27.65, east: -64.10 },
        zones: [
          { id: 'santiago-ciudad', name: 'Santiago del Estero' },
        ],
      },
    ],
  },
  {
    id: 'tierra-del-fuego',
    name: 'Tierra del Fuego',
    departments: [
      {
        id: 'ushuaia',
        name: 'Ushuaia',
        bbox: { south: -54.90, west: -68.40, north: -54.70, east: -68.10 },
        zones: [
          { id: 'ushuaia-ciudad', name: 'Ushuaia' },
        ],
      },
    ],
  },
  {
    id: 'tucuman',
    name: 'Tucumán',
    departments: [
      {
        id: 'capital-tucuman',
        name: 'Capital',
        bbox: { south: -26.85, west: -65.30, north: -26.70, east: -65.10 },
        zones: [
          { id: 'san-miguel', name: 'San Miguel de Tucumán' },
        ],
      },
    ],
  },
];

export function getProvinceById(id: string): LocationProvince | undefined {
  return LOCATIONS.find((p) => p.id === id);
}

export function getDepartmentById(
  provinceId: string,
  departmentId: string
): LocationDepartment | undefined {
  const province = getProvinceById(provinceId);
  return province?.departments.find((d) => d.id === departmentId);
}

export function getZoneById(
  provinceId: string,
  departmentId: string,
  zoneId: string
): LocationZone | undefined {
  const department = getDepartmentById(provinceId, departmentId);
  return department?.zones.find((z) => z.id === zoneId);
}

export function searchLocations(query: string): LocationIndex[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const normalizedQuery = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const results: LocationIndex[] = [];

  for (const province of LOCATIONS) {
    const provinceNameNormalized = province.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (provinceNameNormalized.includes(normalizedQuery)) {
      results.push({
        provinceId: province.id,
        provinceName: province.name,
        departmentId: DEFAULT_DEPARTMENT_ID,
        departmentName: DEFAULT_DEPARTMENT_NAME,
      });
    }

    for (const department of province.departments) {
      const departmentNameNormalized = department.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (departmentNameNormalized.includes(normalizedQuery)) {
        results.push({
          provinceId: province.id,
          provinceName: province.name,
          departmentId: department.id,
          departmentName: department.name,
        });
      }

      for (const zone of department.zones) {
        const zoneNameNormalized = zone.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (zoneNameNormalized.includes(normalizedQuery)) {
          results.push({
            provinceId: province.id,
            provinceName: province.name,
            departmentId: department.id,
            departmentName: department.name,
            localityId: zone.id,
            localityName: zone.name,
          });
        }
      }
    }
  }

  return results;
}

export function findDepartmentById(departmentId: string): LocationDepartment | undefined {
  for (const province of LOCATIONS) {
    const department = province.departments.find((d) => d.id === departmentId);
    if (department) return department;
  }
  return undefined;
}

export function getProvinceBbox(provinceId: string): { south: number; west: number; north: number; east: number } | undefined {
  const province = getProvinceById(provinceId);
  if (!province) return undefined;

  const departments = province.departments.filter((d) => d.bbox);
  if (departments.length === 0) return undefined;

  let south = departments[0].bbox!.south;
  let west = departments[0].bbox!.west;
  let north = departments[0].bbox!.north;
  let east = departments[0].bbox!.east;

  for (const dept of departments.slice(1)) {
    south = Math.min(south, dept.bbox!.south);
    west = Math.min(west, dept.bbox!.west);
    north = Math.max(north, dept.bbox!.north);
    east = Math.max(east, dept.bbox!.east);
  }

  return { south, west, north, east };
}

export const ARGENTINA_BBOX = {
  south: -55.90,
  west: -73.50,
  north: -21.70,
  east: -56.99,
};
