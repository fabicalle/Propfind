export interface LocationZone {
  id: string;
  name: string;
}

export interface LocationDepartment {
  id: string;
  name: string;
  zones: LocationZone[];
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
        zones: [
          { id: 'centro', name: 'Centro' },
          { id: 'norte', name: 'Norte' },
          { id: 'sur', name: 'Sur' },
        ],
      },
      {
        id: 'mar-del-plata',
        name: 'Mar del Plata',
        zones: [
          { id: 'centro-mdp', name: 'Centro' },
          { id: 'zona-sur', name: 'Zona Sur' },
          { id: 'zona-norte', name: 'Zona Norte' },
        ],
      },
      {
        id: 'bahia-blanca',
        name: 'Bahía Blanca',
        zones: [
          { id: 'centro-bb', name: 'Centro' },
          { id: 'zona-norte-bb', name: 'Zona Norte' },
        ],
      },
      {
        id: 'tigre',
        name: 'Tigre',
        zones: [
          { id: 'centro-tigre', name: 'Centro' },
          { id: 'delta', name: 'Delta' },
        ],
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
        zones: [
          { id: 'cordoba-centro', name: 'Córdoba Centro' },
          { id: 'nueva-cordoba', name: 'Nueva Córdoba' },
          { id: 'guemes', name: 'Güemes' },
        ],
      },
      {
        id: 'villa-carlos-paz',
        name: 'Villa Carlos Paz',
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
        zones: [
          { id: 'palermo', name: 'Palermo' },
          { id: 'recoleta', name: 'Recoleta' },
          { id: 'belgrano', name: 'Belgrano' },
          { id: 'san-telmo', name: 'San Telmo' },
          { id: 'microcentro-caba', name: 'Microcentro' },
          { id: 'caballito', name: 'Caballito' },
          { id: 'la-boca', name: 'La Boca' },
          { id: 'barracas', name: 'Barracas' },
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
        zones: [
          { id: 'santa-fe-ciudad', name: 'Santa Fe' },
          { id: 'santo-tome', name: 'Santo Tomé' },
        ],
      },
      {
        id: 'rosario',
        name: 'Rosario',
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
