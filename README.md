# 🏠 PropFind - Plataforma Inmobiliaria Inteligente (MVP)

![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38bdf8?logo=tailwindcss)
![Clean Architecture](https://img.shields.io/badge/Clean_Architecture-Feature--First-green?logo=architecture)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2d3748?logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)

---

## 📋 Visión General

**PropFind** es una plataforma web de alta velocidad para búsqueda y publicación de inmuebles, diseñada para ofrecer una experiencia de usuario fluida y moderna. Combina una interfaz interactiva basada en tarjetas tipo swipe, geolocalización multicapa y una arquitectura desacoplada lista para escalar hacia analítica de datos avanzada.

La plataforma resuelve la fragmentación típica del mercado inmobiliario digital: los usuarios pueden descubrir propiedades de forma intuitiva, filtrar por ubicación y tipo, interactuar directamente con publicadores y gestionar favoritos sin fricción. A su vez, los publicadores acceden a un flujo estructurado para cargar inmuebles con validaciones automáticas y exposición inmediata.

El MVP prioriza velocidad de desarrollo y mantenibilidad: el frontend se apoya en Next.js App Router con TypeScript estricto, estilos con Tailwind CSS y animaciones con Framer Motion, mientras que la capa de dominio adopta Clean Architecture (Feature-First) y Repository Pattern para garantizar testabilidad y evolución futura.

---

## ✨ Características Principales

### 🔍 Búsqueda e Interacción Swipe

- **Motor de búsqueda avanzada** con filtros por ubicación, precio, tipo de propiedad y superficie.
- **Deck de tarjetas interactivo** (`SwipeDeck`) para descubrir inmuebles con gestos intuitivos (favoritos/descartes).
- **Favoritos y listas guardadas** persistentes por usuario.
- **Vista detallada** del inmueble con galería de imágenes, características y ubicación en mapa.

### 🗺️ Geolocalización Multicapa

- **GeoRef Argentina** para selects en cascada (provincia → localidad → barrio).
- **Mapas interactivos** con Google Maps / Street View en la ficha técnica del inmueble.
- **Detección por IP** mediante hook `useGeoIP` para sugerir ubicación inicial al usuario.

### 🤝 Gestión de Leads Directa

- **Modal de contacto** estilo ZonaProp con WhatsApp Directo (`wa.me`) y envío de email.
- **Formulario de contacto** para consultas sin interrumpir la navegación.
- **Panel de publicadores** para gestión de propiedades y leads recibidos.

### ⚖️ Cumplimiento Legal y Privacidad

- Rutas estáticas `/terminos` y `/privacidad` con documentación legal completa.
- **Cláusula de anonimización de datos** para analítica B2B, garantizando cumplimiento normativo.
- **Consent flags** granulares por usuario (analítica, marketing, personalización).

---

## 🏗️ Arquitectura y Estructura de Directorios

### Filosofía: Clean Architecture (Feature-First)

El proyecto adopta **Clean Architecture** con orientación a features, lo que significa que cada dominio funcional vive en su propio módulo autocontenido. Esta separación permite:

- **Independencia de frameworks** en la capa de dominio.
- **Testabilidad** sin dependencias de UI o base de datos.
- **Escalabilidad** para agregar features sin acoplamientos cruzados.
- **Repository Pattern** para abstraer el acceso a datos (Prisma/Supabase).

### Estructura del Proyecto

```text
E:\alpha/
├── .env.example                 # Variables de entorno de referencia
├── .env.local                   # Configuración local (no versionado)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── playwright.config.ts         # Configuración de tests E2E
├── prisma/
│   ├── schema.prisma            # Schema de base de datos
│   ├── seed.ts                  # Datos semilla para desarrollo
│   └── migrations/              # Historial de migraciones
├── public/                      # Assets estáticos (imágenes, SVGs)
├── e2e/                         # Tests end-to-end y snapshots
├── docs/                        # Documentación técnica y roadmap
└── src/
    ├── app/                     # Next.js App Router (rutas, layouts, API)
    │   ├── api/                 # API Routes (auth, properties, sync, etc.)
    │   ├── favoritos/           # Página de favoritos
    │   ├── login/               # Autenticación
    │   ├── perfil/              # Perfil de usuario
    │   ├── privacidad/          # Política de privacidad
    │   ├── properties/          # Detalle de propiedad
    │   ├── publicar/            # Flujo de publicación
    │   ├── search/              # Búsqueda avanzada
    │   ├── signup/              # Registro
    │   ├── terminos/            # Términos y condiciones
    │   ├── layout.tsx           # Layout raíz
    │   └── page.tsx             # Home
    ├── features/                # Módulos de dominio (Feature-First)
    │   ├── properties/          # Feature: Propiedades
    │   │   ├── components/      # Componentes específicos
    │   │   ├── hooks/           # Hooks de dominio
    │   │   └── types/           # Tipos TypeScript
    │   └── search/              # Feature: Búsqueda
    │       └── components/      # Componentes específicos
    ├── application/             # Casos de uso y puertos
    │   └── ports/               # Interfaces de repositorio
    ├── domain/                  # Entidades y objetos de valor
    │   ├── entities/            # Entidades del dominio
    │   └── value-objects/       # Value Objects
    ├── infrastructure/          # Implementaciones concretas
    │   └── repositories/        # Repositorios Prisma
    ├── components/              # Componentes compartidos UI
    │   ├── SwipeDeck.tsx        # Deck de tarjetas swipe
    │   ├── ContactButton.tsx    # Botón de contacto WhatsApp/Email
    │   ├── PropertyCard.tsx     # Tarjeta de inmueble
    │   ├── FilterPanel.tsx      # Panel de filtros
    │   └── ...
    ├── hooks/                   # Hooks globales
    ├── lib/                     # Utilidades y configuraciones
    │   ├── supabase/            # Clientes Supabase (cliente/servidor)
    │   ├── security/            # CSRF, auditoría, origen
    │   ├── persistence/         # Sesión anónima y filtros
    │   ├── motion/              # Tokens de animación
    │   └── geocoding.ts         # Integración con GeoRef
    ├── store/                   # Estado global (Zustand)
    ├── mocks/                   # Datos mock para desarrollo
    └── shared/                  # Datos y constantes compartidas
```

---

## 🚀 Instalación y Configuración Local

### Prerrequisitos

- **Node.js** 18.x o superior
- **npm** o **pnpm**
- **PostgreSQL** (Supabase recomendado)
- **Google Maps API Key** (para mapas y Street View)

### Paso a Paso

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd alpha

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
```

Editar `.env.local` y completar:

```env
# Base de datos (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Google Maps API (requerido para mapas)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

```bash
# 4. Generar cliente Prisma y aplicar migraciones
npm run db:generate
npm run db:push

# 5. (Opcional) Poblar base de datos con datos de prueba
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abrir [localhost:3000](http://localhost:3000) en el navegador.

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|

| `npm run dev` | Inicia el servidor de desarrollo (Next.js) |
| `npm run build` | Genera build de producción |
| `npm run start` | Inicia servidor en modo producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run db:generate` | Genera cliente Prisma |
| `npm run db:push` | Aplica schema a la base de datos |
| `npm run db:seed` | Pobla la base con datos de prueba |
| `npm run db:studio` | Abre Prisma Studio |
| `npm test` | Ejecuta tests E2E con Playwright |

---

## 🎨 Diseño y UX

### Paleta de Colores

| Token | Valor | Uso |
|-------|-------|-----|

| Fondo cálido | `#F5F2EB` | Fondos de página y cards |
| Texto principal | `#231F1D` | Títulos y cuerpo de texto |
| Acento terracota | `#C86D51` | CTAs y elementos destacados |
| Verde bosque | `#2D5A43` | Estados positivos, nav |

### Principios de Diseño

- **Calidez orgánica:** Evita el frío visual típico de las plataformas inmobiliarias.
- **Tipografía legible:** Jerarquía clara con buena entonación.
- **Animaciones sutiles:** Framer Motion para transiciones fluidas sin distraer.
- **Mobile-first:** Responsive completo con breakpoints de Tailwind.

---

## 🔒 Seguridad y Privacidad

- **Row Level Security (RLS)** en Supabase/PostgreSQL para aislamiento de datos.
- **CSRF Protection** en todas las mutaciones del servidor.
- **Validación de origen** para prevenir requests cruzados.
- **Consent flags** granulares por usuario para analítica.
- **Anonimización de datos** en telemetría B2B (sin PII).

---

## 📄 Licencia y Créditos

**PropFind** es un proyecto privado. Todos los derechos reservados.

---

**Desarrollado con dedicación por:**

> Adolfo Fabian Calle
> 📧 fabicalle@gmail.com
> 🔗 [linkedin.com/in/fabian-calle](https://linkedin.com/in/fabian-calle)

---

*Documentación generada el 02 de Septiembre de 2026.*
