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

**Avances recientes:** Motor de búsqueda SQL optimizado con consultas parametrizadas, sincronización bidireccional UI–URL libre de race conditions, y rediseño completo de Swipe Cards con física 3D y badges reactivos.

---

## ✨ Características Principales

### 🔍 Búsqueda e Interacción Swipe

- **Motor de búsqueda avanzada** con filtros por ubicación, precio, tipo de propiedad y superficie.
- **Consultas SQL dinámicas optimizadas** vía `Prisma.$queryRawUnsafe` con cláusulas `IN` parametrizadas individualmente para jerarquías geográficas (`department_id` / `locality_id`).
- **Sincronización bidireccional UI–URL** (Query Params) con inicialización segura (`isUrlParamsReady`) que evita race conditions y re-ejecuciones innecesarias.
- **Priorización geográfica estricta**: si el usuario selecciona una localidad explícita (`localityIds`), se omite automáticamente la restricción por GeoIP/radio espacial.
- **Deck de tarjetas interactivo** (`SwipeDeck`) rediseñado: estética *Full-Height Hero*, degradados de lectura superior/inferior, física de inercia/arrastre en 3D con apilamiento (Stack Effect) y badges reactivos **ME INTERESA** / **PASAR**.
- **Favoritos y listas guardadas** persistentes por usuario (Zustand + Supabase).
- **Vista detallada** del inmueble con galería de imágenes, características y ubicación en mapa.

### 🗺️ Geolocalización Multicapa

- **GeoRef Argentina** para selects en cascada (provincia → localidad → barrio) con códigos normalizados y proxy API en `src/app/api/georef/search/route.ts`.
- **Mapas interactivos** con Google Maps / Street View en la ficha técnica del inmueble.
- **Detección por IP** mediante hook `useGeoIP` para sugerir ubicación inicial al usuario (fallback a Mendoza).

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
- **Repository Pattern** para abstraer el acceso a datos (Prisma/Supabase) con implementaciones intercambiables (`PrismaPropertyRepository` / `MockPropertyRepository`).

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
├── prisma/
│   ├── schema.prisma            # Schema de base de datos
│   ├── seed.ts                  # Datos semilla para desarrollo (26 propiedades HD)
│   └── migrations/              # Historial de migraciones (PostGIS, RLS, roles, isMock, embedding)
├── public/                      # Assets estáticos (imágenes, SVGs)
├── docs/                        # Documentación técnica y roadmap
└── src/
    ├── app/                     # Next.js App Router (rutas, layouts, API)
    │   ├── api/                 # API Routes
    │   │   ├── admin/           # Admin: reports, users
    │   │   ├── auth/            # Login, callback
    │   │   ├── b2b/             # Analytics B2B
    │   │   ├── contact/         # Contacto leads
    │   │   ├── csrf/            # CSRF token endpoint
    │   │   ├── georef/          # Proxy GeoRef Argentina
    │   │   ├── me/              # Perfil autenticado
    │   │   ├── properties/      # CRUD + búsqueda optimizada (/search)
    │   │   ├── swipe/           # Registro de interacciones swipe
    │   │   ├── sync/            # Sincronización magia
    │   │   ├── telemetry/       # Telemetría anonimizada
    │   │   ├── test-db/         # Health check DB
    │   │   └── user/            # Filtros, propiedades, mensajes, migración guest
    │   ├── admin/               # Panel de administración
    │   ├── favoritos/           # Página de favoritos
    │   ├── login/               # Autenticación
    │   ├── perfil/              # Perfil de usuario
    │   ├── privacidad/          # Política de privacidad
    │   ├── properties/          # Detalle de propiedad [id]
    │   ├── publicar/            # Flujo de publicación (stepper)
    │   ├── search/              # Búsqueda avanzada con MainSearchBar
    │   ├── signup/              # Registro
    │   ├── terminos/            # Términos y condiciones
    │   ├── layout.tsx           # Layout raíz
    │   └── page.tsx             # Home (Hero + SwipeDeck)
    ├── features/                # Módulos de dominio (Feature-First)
    │   ├── properties/          # Feature: Propiedades
    │   │   ├── components/      # ContactModal, LocationFilter, ReportModal
    │   │   ├── hooks/           # useGeoIP
    │   │   └── types/           # Tipos de ubicación
    │   └── search/              # Feature: Búsqueda
    │       └── components/      # MainSearchBar (searchbar unificada)
    ├── application/             # Casos de uso y puertos
    │   ├── ports/               # Interfaces PropertyRepository, InteractionRepository, PropertyReportRepository
    │   └── use-cases/           # SearchPropertiesUseCase, CreatePropertyUseCase
    ├── domain/                  # Entidades y objetos de valor
    │   ├── entities/            # Property, PropertyReport, User, PublisherProfile
    │   └── value-objects/       # SearchParams, PropertySearchFilters, BoundingBox, CreatePropertyInput
    ├── infrastructure/          # Implementaciones concretas
    │   └── repositories/        # PrismaRepositories (SQL optimizado, Haversine, IN parametrizado)
    ├── components/              # Componentes compartidos UI
    │   ├── SwipeDeck.tsx        # Deck de tarjetas swipe (Framer Motion 3D stack)
    │   ├── PropertyCard.tsx     # Tarjeta compuesta (Content + TopSection + BottomSection)
    │   ├── PropertyCardContent.tsx   # Imagen + gradientes + StreetView button
    │   ├── PropertyCardTopSection.tsx  # Badge operación + precio + título + ubicación
    │   ├── PropertyCardBottomSection.tsx # Stats grid (amb, m², baños) + amenities + acciones
    │   ├── PropertyCardActions.tsx     # Favorito, contactar, rechazar
    │   ├── ContactButton.tsx    # Botón WhatsApp/Email unificado
    │   ├── FilterPanel.tsx      # Panel lateral de filtros
    │   ├── PropertyDetailModal.tsx     # Modal detalle con slider, contacto, reporte
    │   └── ...
    ├── hooks/                   # Hooks globales
    │   ├── useSwipeDeck.ts      # Lógica de swipe (drag, threshold, queue)
    │   ├── useSwipeDeckSync.ts  # Sincronización store ↔ deck
    │   ├── useSwipeKeyboard.ts  # Atajos teclado (← → Z)
    │   ├── usePropertyImage.ts  # Carrusel de imágenes con fallback
    │   ├── usePropertyDetailSlider.ts # Slider modal detalle
    │   ├── useGeorefSearch.ts   # Búsqueda GeoRef con debounce
    │   ├── useFilterPanel.ts    # Estado panel filtros
    │   └── ...
    ├── lib/                     # Utilidades y configuraciones
    │   ├── supabase/            # Clientes Supabase (client.ts, server.ts)
    │   ├── security/            # CSRF (csrf.ts, withCsrf.ts), auditoría, validación origen
    │   ├── persistence/         # anonSession.ts, filterPersistence.ts (URL sync)
    │   ├── motion/              # tokens.ts (spring presets, motion tokens)
    │   ├── schemas/             # Zod: action-state, primitives, property-search, report-property
    │   ├── geocoding.ts         # Integración GeoRef + cache
    │   ├── mock-data-seeder.ts  # Seed 26 propiedades HD Unsplash
    │   ├── prisma.ts            # Cliente Prisma singleton
    │   ├── validators/          # image-validator.ts
    │   └── ...
    ├── store/                   # Estado global (Zustand)
    │   ├── useAppStore.ts       # Properties, filters, viewMode, swipeDeck
    │   ├── useSwipeStore.ts     # currentProperty, swipeQueue
    │   ├── useFavoritesStore.ts # Favoritos/descartes persistentes
    │   ├── useFilterStore.ts    # Filtros sincronizados con URL
    │   ├── useSessionStore.ts   # Auth session
    │   └── ...
    ├── mocks/                   # Datos mock para desarrollo
    │   ├── properties.ts        # 26 propiedades con imágenes HD + amenities
    │   └── repositories.ts      # MockPropertyRepository (paridad JS con Prisma)
    ├── proxy.ts                 # Proxy middleware
    └── shared/                  # Datos y constantes compartidas
        └── data/locations.ts    # Fallback localidades
```

---

## 🚀 Instalación y Configuración Local

### Prerrequisitos

- **Node.js** 18.x o superior
- **npm** o **pnpm**
- **PostgreSQL** (Supabase recomendado con PostGIS)
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
# Base de datos (Supabase PostgreSQL con PostGIS)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# Supabase Auth & Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Google Maps API (requerido para mapas y Street View)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."

# Modo desarrollo (opcional)
USE_MOCK_DATA="false"
```

```bash
# 4. Generar cliente Prisma y aplicar migraciones
npm run db:generate
npm run db:push

# 5. (Opcional) Poblar base de datos con datos de prueba (26 propiedades HD)
npm run db:seed

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abrir [localhost:3000](http://localhost:3000) en el navegador.

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|

| `npm run dev` | Inicia el servidor de desarrollo (Next.js 16 + Turbopack) |
| `npm run build` | Genera build de producción (prerender estático + dinámico) |
| `npm run start` | Inicia servidor en modo producción |
| `npm run lint` | Ejecuta ESLint (flat config) |
| `npm run db:generate` | Genera cliente Prisma (`prisma migrate dev`) |
| `npm run db:push` | Aplica schema a la base de datos (`prisma db push`) |
| `npm run db:seed` | Pobla la base con 26 propiedades mock HD (`tsx prisma/seed.ts`) |
| `npm run db:studio` | Abre Prisma Studio |

---

## 🎨 Diseño y UX

### Paleta de Colores (Tailwind v4 + tokens custom)

| Token | Valor | Uso |
|-------|-------|-----|

| Fondo cálido | `#F5F2EB` | Fondos de página y cards |
| Texto principal | `#231F1D` | Títulos y cuerpo de texto |
| Acento terracota | `#C86D51` | CTAs primarios, badges "ME INTERESA" |
| Verde bosque | `#2D5A43` | Estados positivos, nav, acento secundario |
| **Acento (nuevo)** | `#2D5A43` | Focus rings, active states |
| **Danger (nuevo)** | `#9E4242` | Errores, badges "PASAR", acciones destructivas |
| **Success (nuevo)** | `#2D5A43` | Confirmaciones, estados exitosos |
| **Warning (nuevo)** | `#D99B26` | Advertencias, estados pendientes |
| **Surface Secondary (nuevo)** | `#EAE6E1` | Cards elevadas, modales, tablas admin |

### Principios de Diseño

- **Calidez orgánica:** Evita el frío visual típico de las plataformas inmobiliarias.
- **Tipografía legible:** Jerarquía clara con buena entonación (font-display para headlines).
- **Animaciones sutiles:** Framer Motion con `motionTokens` (spring gentle/bouncy/snappy) para transiciones fluidas sin distraer.
- **Mobile-first:** Responsive completo con breakpoints de Tailwind.
- **Accesibilidad:** Contraste WCAG AA en todos los tokens, focus-visible rings, ARIA en modales y botones.

### Swipe Deck — Rediseño Técnico (Sep 2026)

- **Full-Height Hero:** `h-[calc(100vh-80px)]` con `aspect-[9/14]`, `max-h-[65vh]`.
- **Degradados de lectura:** `bg-gradient-to-b from-black/70 via-transparent to-black/85` para legibilidad sobre imagen.
- **Stack Effect 3D:** 3 tarjetas visibles con `scale: 1 - index * 0.05`, `y: index * 14`, `zIndex: 10 - index`.
- **Física de arrastre:** `drag="x"`, `dragElastic={0.7}`, `dragConstraints={{left:0,right:0}}`, threshold 120px.
- **Badges reactivos:** Opacidad vinculada a `x` via `useTransform` ([20,100]→[0,1] "ME INTERESA"; [-20,-100]→[0,1] "PASAR").
- **Modal unificado:** `PropertyDetailModal` con slider de imágenes, contacto WhatsApp/email, reporte, Street View.

---

## 🔒 Seguridad y Privacidad

- **Row Level Security (RLS)** en Supabase/PostgreSQL para aislamiento de datos.
- **CSRF Protection** en todas las mutaciones del servidor (`withCsrf` wrapper + double-submit cookie).
- **Validación de origen** (`rejectInvalidOrigin`) para prevenir requests cruzados.
- **Consent flags** granulares por usuario para analítica (analytics, marketing, personalization).
- **Anonimización de datos** en telemetría B2B (sin PII, session hash).
- **Enum casting explícito** en consultas SQL (`::"ListingType"`, `::"SellerType"`) para prevenir errores de tipo y inyección.
- **Parámetros individualizados** en cláusulas `IN` (evita parsing de arrays en `$queryRawUnsafe`).
- **Auditoría de seguridad** (`src/lib/security/auditLog.ts`) para eventos sensibles.

---

## 📄 Licencia y Créditos

**PropFind** es un proyecto privado. Todos los derechos reservados.

---

**Desarrollado con dedicación por:**

> Adolfo Fabian Calle
> 📧 fabicalle@gmail.com
> 🔗 [linkedin.com/in/fabian-calle](https://linkedin.com/in/fabian-calle)

---

*Documentación generada el 14 de Septiembre de 2026.*