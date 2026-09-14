# PropFind: Multi-Agent Implementation Roadmap

## Agent 0: Orchestration & Review Manager

### Role
Lead Technical Architect & Code Reviewer. Owns task sequencing, Definition of Done enforcement, cross-agent integration review, and quality gatekeeping.

### Core Responsibilities
1. **Task Assignment & Ordering:** Unblock micro-tasks strictly by dependency order.
2. **Definition of Done (DoD) Enforcement:** Before each execution, publish a DoD checklist. After execution, inspect output against DoD.
3. **Code Review:** Evaluate performance (60 FPS, API call limits), guardrails (Google Maps cost controls, data anonymization), and TypeScript interface compatibility.
4. **Gatekeeping:** Issue APPROVED or REJECTED WITH CHANGES verdict before next task unblocks.
5. **Conflict Resolution:** Resolve interface mismatches between agents before integration.

### Boundary Definition
**Owns:** Task sequencing, DoD documents, approval verdicts, cross-agent interface contracts, final integration test plan.

**Does NOT own:** Feature implementation, database schema design, component code.

---

### Manager Agent Workflow (Per Micro-Task)

```
Step 1: PUBLISH DOOD
  - Receive current micro-task from execution queue
  - Publish Definition of Done checklist (performance, guardrails, integration)
  - Issue exact system prompt to execution agent

Step 2: RECEIVE & INSPECT
  - Execution agent returns file paths + summary
  - Manager reads changed files
  - Validates against DoD checklist

Step 3: APPROVAL VERDICT
  - APPROVED → Unblock next dependent task
  - REJECTED WITH CHANGES → Provide concrete feedback, re-queue same task
```

---

### Manager Agent System Prompt (Exact)

```
You are Agent 0: Orchestration & Review Manager for PropFind, a next-generation real estate search platform.

## Context
You are the Lead Technical Architect and Code Reviewer. You do NOT write feature code. Your job is to enforce quality, manage task sequencing, and gatekeep approvals.

## Current State
Project root: E:\alpha
Documentation: E:\alpha\docs\
Code: E:\alpha\src\, E:\alpha\prisma\

## Active Queue
[The current micro-task ID will be injected here, e.g., "Agent 1 Task 1.1"]

## Your Responsibilities for This Task

### 1. Publish Definition of Done
Before delegating, output a structured DoD checklist covering:
- Functional correctness (does it meet the acceptance criteria?)
- Performance (60 FPS, bundle size, API call limits)
- Guardrails (Google Maps cost controls, no PII leaks, consent checks)
- Integration (TypeScript interfaces compatible with dependent modules)
- Security (no secrets exposed, input validation present)

### 2. Delegate to Execution Agent
Issue the exact system prompt for the execution agent (already defined in roadmap.md).

### 3. Receive & Inspect
When the execution agent returns:
- Read every changed file
- Verify each DoD criterion
- Check for unintended side effects (unused imports, dead code, console.logs)

### 4. Issue Approval Verdict
Output one of:
- **APPROVED** — with brief rationale and list of unblocked next tasks
- **REJECTED WITH CHANGES** — with numbered, actionable feedback items

## Hard Rules
- NEVER skip the DoD publication step.
- NEVER approve code that violates guardrails (e.g., auto-loading Street View, exposing API keys).
- NEVER approve code with TypeScript errors or missing types.
- ALWAYS specify exact file paths and line numbers in rejection feedback.
- Keep verdicts concise. Maximum 10 lines for APPROVED, maximum 20 lines for REJECTED.

## Output Format
```
VERDICT: APPROVED | REJECTED WITH CHANGES

[If APPROVED]
Rationale: ...
Next Tasks: [list task IDs]

[If REJECTED]
Feedback:
1. [file:line] Issue description + fix
2. ...
```
```

## Agent Overview & Boundaries

| Agent | Domain | Ownership | Out-of-Scope |
|-------|--------|-----------|--------------|
| **Agent 0** | Orchestration & Review Manager | Task sequencing, DoD enforcement, code review, quality gatekeeping, cross-agent integration | Feature implementation, database schema design |
| **Agent 1** | Geospatial & Maps Engineer | Google Maps JS API, Street View, lazy loading, caching, session tokens, markers, clustering | Backend API routes, Zustand store, Framer Motion |
| **Agent 2** | UI/UX & Interactions Engineer | Swipe Deck, Framer Motion, 60 FPS transforms, pre-fetch queue, keyboard fallbacks, undo stack, PropertyCard | Google Maps integration logic, API contracts |
| **Agent 3** | Core Backend & Data Engineer | PostgreSQL/PostGIS schema, Prisma ORM, API routes (`/api/properties/search`, `/api/swipe`, `/api/user/filters`), auth middleware | Street View proxy, B2B aggregation pipeline |
| **Agent 4** | B2B Telemetry & Analytics Engineer | Event ingestion pipeline, B2B aggregation cron, anonymized metrics, developer dashboard API (`/api/b2b/metrics`) | Frontend dashboard UI, swipe gesture logic |
| **Agent 5** | QA, Security & Guardrails Engineer | Testing strategy, mock services, privacy compliance, cost guardrails, performance budgets | Feature implementation |

---

## Agent 1: Geospatial & Maps Engineer

### Core Responsibilities
- Dynamic Google Maps JS API loader with singleton pattern
- Street View lazy-load proxy (never auto-triggers)
- Session tokens for Dynamic Maps API
- Server-side geocoding cache architecture (Redis)
- Custom marker rendering with price metadata
- Marker clustering with cost-efficient DOM updates
- Bounding box search integration with PostGIS backend

### Boundary Definition
**Owns:** `src/hooks/useGoogleMapsLoader.ts`, `src/components/MapView.tsx`, `src/components/StreetViewModal.tsx`, `src/app/api/properties/:id/street-view/route.ts`, `src/lib/geo.ts` (client helpers), Redis cache layer for geo queries.

**Does NOT own:** API route business logic for swipes, Zustand store, Framer Motion animations, database migrations.

---

### Micro-Tasks (Sequential)

#### Task 1.1: Dynamic Google Maps Loader Hook
**Goal:** Load Google Maps JS API only when MapView or StreetViewModal mounts. Single instance per page.

**Inputs:**
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` from env
- Session token string (generated client-side)

**Outputs:**
- `useGoogleMapsLoader.ts` returning `{ isLoaded, loadError, google }`
- Singleton promise so concurrent calls share one load

**Acceptance Criteria:**
- Script tag injected into `<head>` only once
- Returns immediately if already loaded
- Exposes `window.google.maps` after load
- Handles quota exhaustion gracefully

#### Task 1.1a: Mock Google Maps Provider (Dev Sandbox)
**Goal:** In development, load a strict mock of `google.maps` instead of the real API.

**Inputs:**
- `NODE_ENV === 'development'`

**Outputs:**
- `src/lib/mocks/googleMaps.ts` with Map, Marker, StreetViewPanorama, geometry stubs
- `useGoogleMapsLoader.ts` detects dev mode and loads mock
- Mock never calls external APIs

**Acceptance Criteria:**
- In dev, `isLoaded` becomes true within 50ms (no network call)
- Mock Map accepts constructor options
- Mock Marker has `setMap`, `setPosition`
- Mock StreetViewPanorama has `getPosition`, `setVisible`
- `google.maps.geometry` stubs return sensible defaults
- Real API key is NEVER loaded in dev mode

---

#### Task 1.2: Street View Proxy API Route
**Goal:** Server-side proxy for Street View Static/Dynamic API to avoid exposing API key and enforce lazy triggers.

**Inputs:**
- Property `id` or `lat`/`lng`
- `x-session-id` header (anonymous session continuity)

**Outputs:**
- `src/app/api/properties/[id]/street-view/route.ts`
- Returns Street View metadata (panorama ID, lat/lng) OR redirects to static image

**Acceptance Criteria:**
- Validates session exists
- Checks consent flag for tracking
- Rate-limited per session (max 10 Street View loads/minute)
- Returns 429 with Retry-After if exceeded
- Does NOT call Google Street View API on every request — use cached metadata first

---

#### Task 1.3: Street View Modal Component
**Goal:** Lazy-loaded modal that only mounts and fetches Street View when user clicks "View Street View" button on PropertyCard.

**Inputs:**
- Property `id`, `lat`, `lng`
- Open/close state from parent

**Outputs:**
- `StreetViewModal.tsx` with IntersectionObserver-deferred iframe
- `StreetView` API call only after modal is fully visible

**Acceptance Criteria:**
- Iframe `src` is set ONLY after `open === true`
- Modal uses `next/dynamic` with `ssr: false`
- Close button stops Street View panorama
- Loading skeleton shown while panorama initializes

---

#### Task 1.4: MapView Component with Custom Markers
**Goal:** Interactive map inside the app's split-view/map tab. Custom markers show price. Clustering enabled for zoomed-out views.

**Inputs:**
- Bounding box from user drag-selection
- Property GeoJSON from `/api/properties/search`
- `isLoaded` from `useGoogleMapsLoader`

**Outputs:**
- `MapView.tsx` with `google.maps.Map`, `Marker`, `MarkerClusterer`
- `onBoundsChanged` callback to parent for search trigger

**Acceptance Criteria:**
- Map renders only after `isLoaded === true`
- Custom marker template shows formatted price (e.g., "$450K")
- Clusters show count badge; expands on zoom
- Debounced bounds change (300ms) to prevent API spam
- Fallback to Leaflet if Google Maps fails to load (cost fallback)

---

#### Task 1.5: Geocoding Cache Layer (Redis)
**Goal:** Server-side caching of Geocoding API responses to reduce cost and latency.

**Inputs:**
- Address string from property ingestion pipeline
- Google Geocoding API response

**Outputs:**
- Redis key `geocode:{sha256(address)}` with TTL 30 days
- Helper function `src/lib/geo.ts` → `getCachedGeocode(address)`

**Acceptance Criteria:**
- Cache hit returns lat/lng without calling Google
- Cache miss calls Google, stores result with TTL
- Handles ZERO_RESULTS (cache empty result to avoid repeat calls)
- Redis connection pooling for serverless environments

---

#### Task 1.6: Session Token Management
**Goal:** Generate and persist Google Maps session tokens to reduce Dynamic Maps cost.

**Inputs:**
- User anonymous session ID
- Map bounds or center

**Outputs:**
- `src/hooks/useSessionToken.ts` returning `sessionToken`
- Token regenerated on bounds change (debounced)

**Acceptance Criteria:**
- Token passed to `MapOptions.sessionToken`
- Token regenerated only when user significantly moves map (>500m)
- Stored in Zustand to persist across component remounts
- Documented cost impact (Dynamic Maps with session tokens: ~50% cheaper)

---

#### Task 1.7: OpenStreetMap POI Distance Calculations for Walk Score
**Goal:** Implement OSM Overpass API integration to compute Point-of-Interest proximity and derive a Walk Score for each property.

**Inputs:**
- Property `lat`/`lng`
- OSM Overpass API endpoint
- POI category weights (e.g., grocery, transit, park, school)

**Outputs:**
- `src/lib/walkScore.ts` with `calculateWalkScore(lat, lng)` function
- `src/app/api/properties/[id]/walk-score/route.ts` proxy endpoint
- Cached walk score JSON per property

**Acceptance Criteria:**
- Queries OSM Overpass API within a configurable radius (default 800m / 0.5mi)
- Counts POIs by category: grocery, restaurant, park, transit, school, gym, pharmacy
- Applies weighted scoring algorithm (0-100 scale)
- Result cached in Redis with key `walkscore:{propertyId}` TTL 7 days
- Falls back to `null` if Overpass API is unreachable (no hard failure)
- API route rate-limited to prevent Overpass abuse (max 20 req/min per session)
- Does NOT use Google Maps Distance Matrix API (cost optimization)

---

### Integration Contracts (Inputs/Outputs with Other Agents)

| Receives From | Data | Used For |
|---------------|------|----------|
| Agent 2 (UI/UX) | `openStreetView(propertyId)` callback | Trigger Street View Modal |
| Agent 2 (UI/UX) | `onBoundsChanged(bbox)` callback | Trigger property search |
| Agent 3 (Backend) | Property GeoJSON array `[{ id, lat, lng, price, ... }]` | Render markers |
| Agent 3 (Backend) | `/api/properties/[id]/street-view` response | Populate Street View Modal |
| Agent 5 (QA) | Mock `google.maps` object | Unit tests without API key |

| Sends To | Data | Used For |
|----------|------|----------|
| Agent 2 (UI/UX) | `isLoaded`, `loadError` | Conditional rendering of MapView |
| Agent 2 (UI/UX) | `openStreetView` prop | PropertyCard button handler |
| Agent 3 (Backend) | `x-session-id` header | Session validation on API routes |
| Agent 4 (Telemetry) | `telemetryEvent({ type: 'street_view_opened', propertyId })` | Anonymous event tracking |

---

## Agent 2: UI/UX & Interactions Engineer

### Core Responsibilities
- Swipe Deck with Framer Motion (60 FPS)
- PropertyCard component (image gallery, metrics, swipe gestures)
- Pre-fetch queue for next 3 cards
- Undo stack with visual countdown
- Keyboard/button fallbacks
- FilterPanel with auto-save
- Analytics Consent Banner

### Boundary Definition
**Owns:** `src/components/SwipeDeck.tsx`, `src/components/PropertyCard.tsx`, `src/hooks/useSwipeDeck.ts`, `src/store/useAppStore.ts` (frontend-only state), `src/components/FilterPanel.tsx`, `src/components/AnalyticsConsentBanner.tsx`.

**Does NOT own:** Google Maps API integration, backend API implementation, database schema, B2B aggregation logic.

---

### Micro-Tasks (Sequential)

#### Task 2.1: Zustand Store — Frontend State Shape
**Goal:** Define all client-side state with no server coupling.

**Inputs:**
- Property queue from Agent 3 API
- Anonymous session ID from cookie/localStorage

**Outputs:**
- `useAppStore.ts` with slices: `deck`, `filters`, `session`, `consent`, `ui`

**Acceptance Criteria:**
- Deck slice: `currentCard`, `queue[]`, `discarded[]`, `undoStack[]`
- Filters slice: `priceRange`, `rooms`, `propertyTypes`, `bbox`
- Session slice: `sessionId`, `userId` (null if anonymous)
- Consent slice: `analytics`, `marketing`, `personalization`
- UI slice: `activeTab` ('swipe' | 'map'), `isStreetViewOpen`

#### Task 2.1a: Telemetry Event Tracking in Store
**Goal:** Add type-safe telemetry event queue and sender to Zustand store.

**Inputs:**
- `AnalyticsEvent` type from `src/lib/telemetry.ts`
- Consent flags from store

**Outputs:**
- Store slice: `pendingTelemetryEvents[]`, `trackEvent()` action
- Auto-flush when array reaches 5 events or on `beforeunload`

**Acceptance Criteria:**
- `trackEvent()` pushes event to queue
- Events flushed in batch via `POST /api/telemetry`
- Flush skipped if `analyticsConsent === false`
- Queue persisted to sessionStorage (not localStorage) to avoid PII retention

---

#### Task 2.2: useSwipeDeck Hook — Gesture Engine
**Goal:** Pointer event handlers with velocity detection, 60 FPS transforms, pre-fetch trigger.

**Inputs:**
- Current card data
- Queue length
- Undo stack capacity (max 10)

**Outputs:**
- `handlers` object: `onPointerDown`, `onPointerMove`, `onPointerUp`
- `velocity` and `offset` state
- `prefetchTrigger` callback

**Acceptance Criteria:**
- Uses `transform: translate3d(...) rotate(...)` for GPU acceleration
- `will-change: transform` set during drag, removed on release
- Swipe threshold: 100px horizontal or velocity > 0.5
- Pre-fetch triggers when `queue.length < 3` → calls `/api/swipe` with `action: 'prefetch'`
- Undo available for 10 seconds after swipe (visual countdown)

---

#### Task 2.3: PropertyCard Component
**Goal:** Render card with image gallery, metrics, swipe indicators, Street View trigger button.

**Inputs:**
- Property object from queue
- Swipe direction from hook
- `onStreetViewOpen` callback

**Outputs:**
- `PropertyCard.tsx` with `motion.div` from Framer Motion
- Image carousel with touch swipe
- Price, area, rooms, amenities badges
- Overlay indicators (green heart / red X / blue star)

**Acceptance Criteria:**
- Images lazy-loaded with `loading="lazy"`
- WebP/AVIF via `next/image`
- Street View button never auto-triggers map load
- Card exit animation plays before removal from DOM
- Keyboard hints shown only on desktop (`matchMedia('(hover: hover)')`)

---

#### Task 2.4: SwipeDeck Container
**Goal:** Stack renderer, pre-fetch orchestration, undo button, empty state.

**Inputs:**
- Queue from store
- Pre-fetch callback from hook
- Undo callback

**Outputs:**
- `SwipeDeck.tsx` rendering top 2 cards (current + next for depth)
- "Undo" button with disabled state
- Empty state with "Load More" or filter suggestions

**Acceptance Criteria:**
- Renders at most 2 cards for performance
- Next card visible behind current with scale(0.95) and y-offset
- Undo restores last discarded card to front of queue
- Pre-fetch calls API when queue drops below 3
- Touch-action: none on card to prevent page scroll while swiping

#### Task 2.4a: Deck Depth & Filter Relaxation
**Goal:** Prevent empty deck by relaxing filters when yield is low.

**Inputs:**
- `activeFilter` from store
- `queue.length` from deck
- `relaxFilters()` from `src/lib/filterRelaxation.ts`

**Outputs:**
- `useSwipeDeck.ts` triggers relaxation when `queue.length < 3`
- Store actions: `setRelaxedFilter()`, `resetFilters()`
- UI banner in `SwipeDeck.tsx`: "Showing more results — filters relaxed"

**Acceptance Criteria:**
- Relaxation triggers when queue drops below 3 AND API returns < 5 results
- Relaxations applied in strict order: price ±20% → area ±20% → rooms ±1 → bbox +10% → remove 1 amenity → bbox +10% more
- Original filter preserved in `originalFilter` state for one-click reset
- User sees visual indicator (yellow border on filter panel) when relaxed
- `filter_relaxation` telemetry event fired with anonymized filter diff
- If all relaxations exhausted and still empty, show "No more properties" with reset button

---

#### Task 2.5: FilterPanel Component
**Goal:** Price range, rooms, property type, amenities filters with auto-save.

**Inputs:**
- Current filters from store
- Saved filters list from `/api/user/filters`

**Outputs:**
- `FilterPanel.tsx` with debounced auto-save (500ms)
- Saved filter presets dropdown

**Acceptance Criteria:**
- Debounced save to prevent API spam
- Visual indicator when filter changes are unsaved
- Clear all filters button resets to default
- Responsive: collapsible on mobile, sidebar on desktop

---

#### Task 2.6: Analytics Consent Banner
**Goal:** GDPR-compliant consent banner before any telemetry fires.

**Inputs:**
- Consent state from store
- Accept/decline handlers

**Outputs:**
- `AnalyticsConsentBanner.tsx` fixed at bottom
- Granular toggles: Analytics, Marketing, Personalization

**Acceptance Criteria:**
- Blocks all telemetry until user interacts
- Stores consent in cookie + localStorage
- Re-shows if consent withdrawn
- "Accept All" and "Essential Only" options
- Never shown again if previously accepted (stored preference)

---

#### Task 2.7: Head-to-Head Comparison Modal & Total Cost Slider
**Goal:** Design and implement a comparison modal for saved properties and a Total Cost slider in the filter drawer.

**Inputs:**
- Saved properties list from `/api/user/saved`
- Property cost breakdowns (price, HOA, taxes, insurance, maintenance estimate)
- Active filter state from store

**Outputs:**
- `src/components/ComparisonModal.tsx` with side-by-side property cards
- `src/components/filters/TotalCostSlider.tsx` for filter drawer
- Updated `FilterCriteria` type to include `totalMonthlyCost` range

**Acceptance Criteria:**
- Comparison Modal opens from Saved Listings page
- Displays up to 3 properties side-by-side with swipeable image galleries
- Shows key metrics: price, area, rooms, walk score, total monthly cost
- Highlights differences with color-coded deltas (green = better, red = worse)
- Total Cost Slider allows users to set `totalMonthlyMin` / `totalMonthlyMax`
- Slider updates search query in real-time with debounce (300ms)
- Slider shows tooltip with cost breakdown on hover
- Responsive: modal is full-screen on mobile, centered dialog on desktop
- Keyboard accessible: Escape closes modal, Tab navigates between properties

---

### Integration Contracts (Inputs/Outputs with Other Agents)

| Receives From | Data | Used For |
|---------------|------|----------|
| Agent 1 (Maps) | `isLoaded`, `loadError` | Show/hide MapView tab |
| Agent 1 (Maps) | `onBoundsChanged` callback | Trigger property search on map drag |
| Agent 3 (Backend) | Property objects, swipe response | Render cards, update deck |
| Agent 3 (Backend) | Saved filters list | Populate FilterPanel |
| Agent 4 (Telemetry) | `trackEvent(type, metadata)` function | Fire telemetry on swipe, view |

| Sends To | Data | Used For |
|----------|------|----------|
| Agent 1 (Maps) | `openStreetView(propertyId)` | Trigger Street View Modal |
| Agent 3 (Backend) | `POST /api/swipe` payload | Record interaction, get next card |
| Agent 3 (Backend) | `POST /api/telemetry` payload | Send anonymous events |
| Agent 4 (Telemetry) | Swipe events, card view duration | Aggregate metrics |
| Agent 5 (QA) | Component props interface | Type-safe test mocks |

---

## Agent 3: Core Backend & Data Engineer

### Core Responsibilities
- Prisma schema + PostGIS migrations
- API routes: `/api/properties/search`, `/api/swipe`, `/api/user/filters`
- Auth middleware (anonymous session + JWT)
- Property ingestion seed script
- Redis cache integration for geo queries

### Boundary Definition
**Owns:** `prisma/schema.prisma`, `src/app/api/properties/search/route.ts`, `src/app/api/swipe/route.ts`, `src/app/api/user/filters/route.ts`, `src/lib/prisma.ts`, `src/lib/geo.ts` (server helpers), seed scripts.

**Does NOT own:** Street View proxy route (Agent 1), B2B aggregation cron (Agent 4), frontend components.

---

### Micro-Tasks (Sequential)

#### Task 3.1: Prisma Schema + PostGIS Migration
**Goal:** Create schema matching `docs/database-schema.md` with PostGIS geography types.

**Inputs:**
- Database connection string
- PostGIS extension availability

**Outputs:**
- `prisma/schema.prisma` with 7 models, 3 enums
- `prisma/migrations/001_init/` migration SQL
- `prisma/seed.ts` with 50 sample properties

**Acceptance Criteria:**
- `geog` column uses `Geography("Point", 4326)` in Prisma
- Raw SQL for triggers: `set_geog` and `set_geo_hash`
- Indexes created: GiST on `geog`, B-tree on `geo_hash`, `price`, `created_at`
- Seed data spans 3 neighborhoods with varied prices/types

---

#### Task 3.2: GeoService — Bounding Box Search
**Goal:** PostGIS query returning properties within bbox + filters.

**Inputs:**
- Bbox: `{ north, south, east, west }`
- Filters: `priceMin`, `priceMax`, `rooms`, `propertyTypes`, `amenities`

**Outputs:**
- `GET /api/properties/search?bbox=...&priceMin=...`
- JSON array of properties with `id`, `lat`, `lng`, `price`, `images`, `amenities`

**Acceptance Criteria:**
- Uses `ST_Intersects(geog, ST_MakeEnvelope(...)::geography)`
- Filters applied in SQL (not in-memory)
- Results cached in Redis with key `search:{sha256(queryString)}` TTL 5min
- Max 50 results per page, cursor-based pagination

---

#### Task 3.3: Swipe Service — Record + Deduplication
**Goal:** Record swipe, return next card excluding seen properties.

**Inputs:**
- `POST /api/swipe` body: `{ propertyId, interactionType, swipeDirection, sessionId }`

**Outputs:**
- `user_interactions` INSERT
- Next unseen property from same bbox/filters
- Or `{ status: 'empty', message: 'No more properties' }`

**Acceptance Criteria:**
- Deduplication: `WHERE property_id NOT IN (SELECT property_id FROM user_interactions WHERE session_id = $1)`
- Returns property in same format as search API
- If empty, suggests filter adjustment
- Anonymous users tracked by `sessionId` in cookie

---

#### Task 3.4: Auth Middleware — Anonymous + JWT
**Goal:** Support both anonymous sessions and authenticated users transparently.

**Inputs:**
- `x-session-id` header (anonymous)
- `Authorization: Bearer <token>` header (authenticated)

**Outputs:**
- `req.user` object with `{ id, isAnonymous, sessionId }`
- 401 for invalid JWT, auto-generate session for anonymous

**Acceptance Criteria:**
- Anonymous: generate UUID session, set cookie `session_id` (httpOnly, 30d)
- Authenticated: verify JWT, attach user
- Middleware runs on all `/api/*` routes
- Session continuity: if anonymous user later authenticates, merge interactions

---

#### Task 3.5: Saved Filters API
**Goal:** CRUD for user filter presets.

**Inputs:**
- `GET /api/user/filters` — list presets
- `POST /api/user/filters` — create preset
- `PUT /api/user/filters/:id` — update preset
- `DELETE /api/user/filters/:id` — delete preset

**Outputs:**
- JSON array of `{ id, filterName, criteria, isDefault }`

**Acceptance Criteria:**
- Auth required for all endpoints
- One default filter per user enforced
- Criteria stored as JSONB with schema validation

---

#### Task 3.6: Redis Cache Integration
**Goal:** Server-side caching for geocoding and search results.

**Inputs:**
- Redis connection from env
- Cache keys from geo/search services

**Outputs:**
- `src/lib/cache.ts` with `get`, `set`, `del`, `invalidatePattern`
- Integrated into GeoService and search route

**Acceptance Criteria:**
- Connection pooling (ioredis with `maxRetriesPerRequest`)
- TTL: 5min for search, 30d for geocoding
- Graceful degradation if Redis is down (falls back to DB)

---

#### Task 3.7: Total Monthly Cost Range & POI Proximity Spatial Queries
**Goal:** Extend the database schema and search API to support `total_monthly_cost` ranges and PostGIS-based POI proximity queries.

**Inputs:**
- Existing `properties` table schema
- `/api/properties/search` query builder
- PostGIS spatial functions

**Outputs:**
- Prisma migration adding `total_monthly_cost NUMERIC(10,2)` to `properties`
- Updated `searchProperties()` in `src/lib/geo.ts` with `totalMonthlyMin`/`totalMonthlyMax` filters
- New PostGIS query: `ST_DWithin(geog, poi_geog, radius_meters)` for proximity search
- `/api/properties/search?poiTypes=grocery,transit&poiRadius=500` support

**Acceptance Criteria:**
- `total_monthly_cost` column added with index for range queries
- Search API accepts `totalMonthlyMin` and `totalMonthlyMax` query params
- POI proximity filter: returns properties within X meters of specified POI types
- Uses PostGIS `ST_DWithin` with geography cast for accurate meter-based distance
- POI types mapped from OSM tags: `shop=supermarket` → grocery, `public_transport=*` → transit, etc.
- Query plan uses GiST index on `geog` for both bbox and POI proximity
- Graceful degradation if POI data is missing (returns all properties, no filter applied)
- Migration is reversible (`prisma migrate dev` and `prisma migrate reset` safe)

---

### Integration Contracts (Inputs/Outputs with Other Agents)

| Receives From | Data | Used For |
|---------------|------|----------|
| Agent 1 (Maps) | `x-session-id` header | Session validation on Street View route |
| Agent 2 (UI/UX) | Search query from map bounds | Return filtered properties |
| Agent 2 (UI/UX) | Swipe payload | Record interaction, return next card |
| Agent 5 (QA) | Test database, mock requests | Integration testing |

| Sends To | Data | Used For |
|----------|------|----------|
| Agent 1 (Maps) | Street View metadata API | Populate Street View Modal |
| Agent 2 (UI/UX) | Property JSON, swipe response | Render cards, update deck |
| Agent 2 (UI/UX) | Saved filters JSON | Populate FilterPanel |
| Agent 4 (Telemetry) | Raw `user_interactions` rows | Aggregate into B2B metrics |
| Agent 5 (QA) | Prisma mock, test fixtures | Mock API responses |

---

## Agent 4: B2B Telemetry & Analytics Engineer

### Core Responsibilities
- Telemetry ingestion API (`/api/telemetry`)
- Anonymous event validation (consent check)
- B2B aggregation pipeline (cron job)
- Aggregated metrics API (`/api/b2b/metrics`)
- Developer dashboard data layer

### Boundary Definition
**Owns:** `src/app/api/telemetry/route.ts`, `src/app/api/b2b/metrics/route.ts`, `src/lib/telemetry.ts`, cron job script, aggregation SQL/queries.

**Does NOT own:** Frontend dashboard UI, swipe gesture logic, database schema (uses Agent 3's schema).

---

### Micro-Tasks (Sequential)

#### Task 4.1: Telemetry Ingestion API
**Goal:** Accept anonymous events, validate consent, write to `search_telemetry` or `user_interactions`.

**Inputs:**
- `POST /api/telemetry` body: `{ sessionId, eventType, metadata, timestamp }`
- Consent flag from user record

**Outputs:**
- 204 No Content on success
- 403 if consent.analytics === false

**Acceptance Criteria:**
- No PII in payload — only `sessionId` (not user ID unless consented)
- Event types: `search_performed`, `filter_changed`, `street_view_opened`, `card_viewed`, `swipe`
- Writes to `search_telemetry` for map/search events
- Writes to `user_interactions` for swipe events (delegated from `/api/swipe`)
- Rate limited: max 100 events/minute per session

---

#### Task 4.2: Consent Validation Middleware
**Goal:** Ensure telemetry and B2B endpoints respect user privacy preferences.

**Inputs:**
- Session ID or user ID
- Consent flags from `users.consent_flags`

**Outputs:**
- Middleware that blocks telemetry if `analytics === false`
- Anonymous session fallback if user not found

**Acceptance Criteria:**
- Checks consent BEFORE writing to any analytics table
- Logs consent violations for audit (without PII)
- Does not break app flow if consent middleware fails (fail-open for UX, fail-closed for privacy)

---

#### Task 4.3: B2B Aggregation Cron Job
**Goal:** Every 15 minutes, aggregate raw interactions into `b2b_aggregated_metrics`.

**Inputs:**
- Raw `user_interactions` and `search_telemetry` from past 15 min
- GeoHash zones from property data

**Outputs:**
- Upserted rows in `b2b_aggregated_metrics`
- No PII — grouped by `zone_geo_hash` and `time_bucket`

**Acceptance Criteria:**
- SQL aggregation: `COUNT(*)`, `AVG(price)`, rate calculations
- Upsert using unique index on `(metric_type, zone_geo_hash, neighborhood, time_bucket, bucket_start)`
- Handles empty zones gracefully (no rows inserted)
- Cron trigger: Vercel Cron or GitHub Actions

---

#### Task 4.4: B2B Metrics API
**Goal:** Serve anonymized market insights to developer dashboard.

**Inputs:**
- `GET /api/b2b/metrics?zone=...&metric=...&timeRange=7d`

**Outputs:**
- JSON array of `{ metricType, zoneGeoHash, neighborhood, timeBucket, bucketStart, metricValue, sampleSize }`

**Acceptance Criteria:**
- No `user_id` or `session_id` in response
- Aggregated only — minimum sample size of 10 enforced
- Time range max 90 days (prevents reverse-engineering PII)
- Rate limited per API key (developer portal auth)

---

#### Task 4.5: Telemetry Event Schema & Validation
**Goal:** Strict TypeScript schema for all telemetry events.

**Inputs:**
- Frontend event payloads from Agent 2

**Outputs:**
- `src/lib/telemetry.ts` with Zod schemas
- Type-safe event creators

**Acceptance Criteria:**
- Zod validates all fields before DB write
- Unknown event types rejected with 400
- Metadata shape varies by event type (strictly typed)
- Example events: `search_performed`, `filter_changed`, `street_view_opened`, `swipe`

#### Task 4.5a: Telemetry Schema v1.0 Definition
**Goal:** Define the canonical `AnalyticsEvent` payload structure on Day 1.

**Inputs:**
- B2B reporting requirements (aggregated by zone, feature, price)
- GDPR constraints (no PII)

**Outputs:**
- `src/lib/telemetry.ts` with:
  - `AnalyticsEvent` interface
  - `EventType` enum
  - `EventPayload` discriminated union
  - Zod schemas for each payload variant
  - Type-safe `createEvent()` factory functions

**Acceptance Criteria:**
- All 8 event types defined with strict payload shapes
- B2B-safe fields only: `zoneBoundingBox`, `swipeDirection`, `filterMutations`, `pricePoint`, `features`, `sessionDurationMs`
- Prohibited fields rejected by Zod: `email`, `name`, `phone`, `address`, `ipAddress`, `deviceId`
- Version field included for forward compatibility
- Consent flags validated on every event
- Factory functions prevent invalid event construction

---

### Integration Contracts

| Receives From | Data | Used For |
|---------------|------|----------|
| Agent 2 (UI/UX) | Telemetry event payloads | Ingest into `search_telemetry` |
| Agent 3 (Backend) | Raw `user_interactions` table access | Aggregate into B2B metrics |
| Agent 5 (QA) | Mock event payloads | Test consent validation |

| Sends To | Data | Used For |
|----------|------|----------|
| Agent 2 (UI/UX) | Telemetry event tracking function | Fire events from frontend |
| Agent 5 (QA) | Aggregation test fixtures | Validate B2B pipeline |

---

## Agent 5: QA, Security & Guardrails Engineer

### Core Responsibilities
- Unit/integration test strategy (Vitest + Playwright)
- Mock services for Google Maps, PostGIS
- Privacy compliance audit (GDPR checklists)
- Google Maps cost guardrails (budget alerts, quota monitoring)
- Performance budgets (60 FPS, bundle size)
- Security headers, rate limiting, input validation

### Boundary Definition
**Owns:** `vitest.config.ts`, `playwright.config.ts`, `__mocks__/`, `tests/`, `src/middleware.ts` (security headers), cost monitoring scripts.

**Does NOT own:** Feature implementation, database schema design.

---

### Micro-Tasks (Sequential)

#### Task 5.1: Test Infrastructure Setup
**Goal:** Vitest for unit/integration, Playwright for E2E.

**Inputs:**
- Existing Next.js project structure

**Outputs:**
- `vitest.config.ts` with path aliases
- `playwright.config.ts` with baseURL
- `tests/setup.ts` with global mocks

**Acceptance Criteria:**
- `npm run test` runs Vitest
- `npm run test:e2e` runs Playwright
- Coverage threshold: 80% for core logic (swipe, geo, telemetry)

---

#### Task 5.2: Google Maps Mock Service
**Goal:** Mock `google.maps` for tests without API key.

**Inputs:**
- Google Maps JS API type definitions

**Outputs:**
- `__mocks__/googleMaps.ts` with Map, Marker, StreetViewPanorama stubs
- `tests/hooks/useGoogleMapsLoader.test.ts`

**Acceptance Criteria:**
- Map constructor does not call external API
- Marker.setMap works in memory
- StreetViewPanorama returns mock position
- Loader hook returns `isLoaded: true` immediately in test env

---

#### Task 5.3: Privacy Compliance Audit
**Goal:** Verify no PII leaks to B2B or telemetry.

**Inputs:**
- All API route handlers
- Telemetry event schemas

**Outputs:**
- `tests/audit/privacy.test.ts`
- Automated check: no `email`, `name`, `phone` in B2B responses
- Automated check: telemetry rejects PII fields

**Acceptance Criteria:**
- Test fails if `user_interactions.user_id` appears in `/api/b2b/metrics` response
- Test fails if telemetry accepts `email` field
- GDPR consent flow tested end-to-end

---

#### Task 5.4: Google Maps Cost Guardrails
**Goal:** Prevent API credit exhaustion in production.

**Inputs:**
- Google Cloud billing alert thresholds
- API usage metrics

**Outputs:**
- `scripts/monitor-gmaps-cost.ts`
- Environment variable guards: `MAX_GMAPS_REQUESTS_PER_DAY`
- Middleware that blocks Maps API if budget exceeded

**Acceptance Criteria:**
- Daily request counter in Redis
- Alerts at 80% and 95% of daily budget
- Falls back to Leaflet if budget exceeded
- Street View proxy enforces per-session rate limit (10/min)

---

#### Task 5.5: Performance Budget Tests
**Goal:** Enforce 60 FPS and bundle size limits.

**Inputs:**
- SwipeDeck component
- Bundle analyzer config

**Outputs:**
- `tests/performance/swipe-deck-fps.test.ts` (Playwright)
- Bundle size check in CI
- Lighthouse CI config

**Acceptance Criteria:**
- FPS test: 100 swipes maintain >55 FPS on mid-range device emulation
- Bundle: `SwipeDeck` chunk < 50KB gzipped
- Google Maps loaded in separate chunk (dynamic import verified)
- CI fails if budget exceeded

---

#### Task 5.6: Security Hardening
**Goal:** Headers, rate limiting, input validation.

**Inputs:**
- All API routes
- Next.js config

**Outputs:**
- `src/middleware.ts` with security headers (CSP, HSTS)
- Rate limiting utility (upstash-redis or in-memory for dev)
- Zod validation on all POST bodies

**Acceptance Criteria:**
- CSP blocks inline scripts except `'nonce-...'`
- Rate limit: 100 req/min per IP on public routes
- All POST bodies validated with Zod before handler logic
- No secrets in client-side code (verified by grep)

---

### Integration Contracts

| Receives From | Data | Used For |
|---------------|------|----------|
| All Agents | Component/API code | Test, mock, audit |
| Agent 1 (Maps) | Map component | Mock Google Maps, test lazy loading |
| Agent 2 (UI/UX) | SwipeDeck, PropertyCard | Performance tests, FPS validation |
| Agent 3 (Backend) | API routes, Prisma schema | Integration tests, SQL audit |
| Agent 4 (Telemetry) | Telemetry schemas, B2B API | Privacy audit, data validation tests |

| Sends To | Data | Used For |
|----------|------|----------|
| Agent 1 (Maps) | Mock `google.maps` | Unit tests without API key |
| Agent 2 (UI/UX) | Performance budgets, mocks | FPS tests, component tests |
| Agent 3 (Backend) | Test database, seed data | Integration tests |
| Agent 4 (Telemetry) | Privacy audit results, test fixtures | Validate no PII leaks |

---

## Execution Order & Dependencies

```
Phase 0: Manager Warmup
  └── Agent 0: Publish DoD for Phase 1 Task 1.1

Phase 1 (Parallel Foundation):
  ├── Agent 3: Task 3.1 (Prisma schema + migration)
  ├── Agent 1: Task 1.1 (Google Maps loader hook)
  └── Agent 5: Task 5.1 (Test infrastructure)

  After each task:
    └── Agent 0: Review → APPROVED / REJECTED WITH CHANGES

Phase 2 (API + Core UI):
  ├── Agent 3: Tasks 3.2 → 3.3 → 3.4 → 3.5 → 3.6
  ├── Agent 2: Tasks 2.1 → 2.2 → 2.3 → 2.4
  └── Agent 1: Tasks 1.2 → 1.3 → 1.4 → 1.5 → 1.6

  Gate: Agent 0 reviews each task before next unblocks

Phase 2.5 (Feature Extensions):
  ├── Agent 3: Task 3.7 (total_monthly_cost & POI proximity queries)
  ├── Agent 2: Task 2.7 (Head-to-Head Comparison Modal & Total Cost Slider)
  └── Agent 1: Task 1.7 (OSM POI distance calculations for Walk Score)

  Gate: Agent 0 reviews each task before next unblocks

Phase 3 (Telemetry + Polish):
  ├── Agent 4: Tasks 4.1 → 4.2 → 4.3 → 4.4 → 4.5
  └── Agent 5: Tasks 5.2 → 5.3 → 5.4 → 5.5 → 5.6

  Gate: Agent 0 reviews each task before next unblocks

Phase 4 (Integration):
  └── Agent 0: Cross-agent integration review
      ├── TypeScript interface compatibility check
      ├── End-to-end API contract validation
      └── Final security & privacy audit
```

---

## Critical Cross-Cutting Requirements

These requirements apply to ALL agents and must be implemented in Phase 1-2.

### 1. Development Sandboxing (Google Maps)

**Rule:** Real Google Maps API keys must ONLY be loaded in Staging/Production. In development (`NODE_ENV=development`), a strict Mock Provider must be used.

**Implementation:**
- `src/lib/mocks/googleMaps.ts` — Mock `google.maps` namespace with Map, Marker, StreetViewPanorama, geometry stubs
- `src/hooks/useGoogleMapsLoader.ts` — Detect `NODE_ENV === 'development'` and load mock instead of real script
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must NOT be present in `.env.local` during development
- CI/CD must inject real key only in staging/production pipelines

**Guardrail:** If `NODE_ENV=development` and no mock is present, the app must render a fallback Leaflet map or a placeholder, never attempt to load the real Google Maps script.

---

### 2. Telemetry Schema Architecture (Day 1)

**Rule:** All telemetry events must use a strict, versioned payload schema defined before any tracking code is written.

**AnalyticsEvent Payload Structure:**
```typescript
interface AnalyticsEvent {
  version: '1.0';
  sessionId: string;
  userId?: string; // Only if authenticated and consented
  timestamp: string; // ISO 8601
  type: EventType;
  payload: EventPayload;
  consentFlags: {
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
  };
}

type EventType = 
  | 'search_performed'
  | 'filter_changed'
  | 'street_view_opened'
  | 'card_viewed'
  | 'swipe'
  | 'property_saved'
  | 'map_pan'
  | 'bounds_changed';

// Strict payload per event type
type EventPayload = 
  | SearchPerformedPayload
  | FilterChangedPayload
  | StreetViewOpenedPayload
  | CardViewedPayload
  | SwipePayload
  | PropertySavedPayload
  | MapPanPayload
  | BoundsChangedPayload;
```

**B2B-Safe Fields (NO PII):**
- `zoneBoundingBox` — geohash or bbox (never exact user location)
- `swipeDirection` — left/right/up
- `filterMutations` — which filters were added/removed
- `pricePoint` — price of viewed/swiped property (aggregated only)
- `features` — amenities array (aggregated only)
- `sessionDurationMs` — aggregated per zone

**Prohibited in Telemetry:**
- `email`, `name`, `phone`, `address`, `ipAddress`, `deviceId`

**Implementation:**
- `src/lib/telemetry.ts` — Zod schemas + type-safe event creators
- `src/app/api/telemetry/route.ts` — Validation middleware using Zod
- All frontend events must pass through `src/lib/telemetry.ts` before hitting the API

---

### 3. Deck Depth & Fallback Logic

**Rule:** Never show an empty deck. When property yield drops below threshold, automatically relax filters and notify user.

**Filter Relaxation Algorithm:**

```
Input: activeFilter, currentResultsCount, MIN_DECK_DEPTH = 5

Step 1: If resultsCount >= MIN_DECK_DEPTH, return activeFilter (no change)

Step 2: If resultsCount < MIN_DECK_DEPTH, apply relaxations IN ORDER:
  a. Expand price range by ±20%
  b. Expand area range by ±20%
  c. Add ±1 room tolerance
  d. Expand bbox by 10% in each direction
  e. Remove one amenity filter
  f. Expand bbox by additional 10%

Step 3: Re-run search with relaxed filters

Step 4: If still < MIN_DECK_DEPTH after all relaxations:
  - Show "No more properties" with suggestion to reset filters
  - Auto-save original filter preset for one-click restoration

Step 5: Always show user a toast/banner:
  "Showing more results — filters relaxed to [list changed filters]"
```

**Implementation:**
- `src/lib/filterRelaxation.ts` — Pure function `relaxFilters(original, attempt)`
- `src/store/useAppStore.ts` — Add `relaxedFilter`, `relaxationCount`, `resetFilters` actions
- `src/hooks/useSwipeDeck.ts` — Trigger relaxation when `queue.length < 3`
- `src/components/FilterPanel.tsx` — Show relaxed filters with visual indicator (e.g., yellow border)
- API must accept `relaxedFrom` param to track relaxation events for B2B analytics

**B2B Tracking:**
- Log `filter_relaxation` event with:
  - `originalFilters` (anonymized)
  - `relaxedFilters` (anonymized)
  - `relaxationStep` (1-6)
  - `yieldAfterRelaxation`

---

## Agent 1 System Prompt (Exact)

```
You are Agent 1: Geospatial & Maps Engineer for PropFind, a next-generation real estate search platform.

## Context
You are working in an established Next.js 14/15 project at E:\alpha. The database schema, API contracts, and frontend architecture are already documented in E:\alpha\docs/. Do NOT modify those documents — only implement code.

## Current Task
Implement Task 1.1: Dynamic Google Maps Loader Hook.

## Requirements
1. Create `src/hooks/useGoogleMapsLoader.ts` that dynamically loads the Google Maps JavaScript API.
2. Use a singleton promise pattern so concurrent calls share one load operation.
3. Inject the script tag into `<head>` with `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
4. Return `{ isLoaded, loadError, google }` from the hook.
5. If `window.google?.maps` already exists, return immediately.
6. Handle quota exhaustion (API key invalid/restricted) gracefully — set `loadError`.
7. Generate a session token client-side and expose it via `useSessionToken()` or return it from this hook.
8. Do NOT load Street View in this hook. Street View is loaded separately in `StreetViewModal.tsx` only on explicit user click.

## Guardrails
- NEVER hardcode API keys. Use `process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
- NEVER auto-trigger Street View. All Street View loading must be lazy and user-initiated.
- Follow existing TypeScript conventions in the project.
- Use `next/dynamic` only for components, not for the loader hook itself.
- The script URL must include `libraries=places` and `v=weekly` (or latest stable).

## Acceptance Criteria
- Hook returns `{ isLoaded: false }` immediately on first call.
- After script loads, subsequent calls return `{ isLoaded: true, google: ... }`.
- If Google returns error (403, 429), `loadError` is set and `isLoaded` remains false.
- Session token is a UUID v4 generated once per page load and reused.

## Output
Write the file `src/hooks/useGoogleMapsLoader.ts`. Do not write any other files. Do not modify existing files.
```

---

## Agent 1 System Prompt (Task 1.7 — Walk Score)

```
You are Agent 1: Geospatial & Maps Engineer for PropFind, a next-generation real estate search platform.

## Context
You are working in an established Next.js 14/15 project at E:\alpha. The database schema, API contracts, and frontend architecture are already documented in E:\alpha\docs/. Do NOT modify those documents — only implement code.

## Current Task
Implement Task 1.7: OpenStreetMap POI Distance Calculations for Walk Score.

## Requirements
1. Create `src/lib/walkScore.ts` with a `calculateWalkScore(lat: number, lng: number): Promise<number | null>` function.
2. Query the OSM Overpass API (public endpoint `https://overpass-api.de/api/interpreter`) for POIs within 800m of the property.
3. Count POIs by category: grocery, restaurant, park, transit_station, school, gym, pharmacy.
4. Apply a weighted scoring algorithm (0-100) based on POI density and variety.
5. Create `src/app/api/properties/[id]/walk-score/route.ts` as a server-side proxy.
6. Cache results in Redis with key pattern `walkscore:{propertyId}` and TTL 7 days.
7. Rate-limit the API route to max 20 requests/minute per session (use `x-session-id` header).

## Guardrails
- NEVER call Google Maps Distance Matrix API. Use only OSM Overpass API.
- NEVER expose raw API keys or endpoints to the client. All OSM calls must go through the API route.
- Handle Overpass API failures gracefully — return `null` walk score, do not crash.
- Respect Overpass API usage policy: include a meaningful User-Agent, do not spam requests.
- Do NOT store exact POI coordinates in cache or DB — only the computed walk score.
- Cache misses should query OSM, cache hits should return immediately without network calls.

## Acceptance Criteria
- `calculateWalkScore()` returns a number 0-100 or null on failure.
- Walk score API route returns `{ walkScore: number | null, cached: boolean }`.
- Redis cache reduces OSM API calls for repeat property views.
- Rate limiter returns 429 with Retry-After when exceeded.
- Unit tests mock Overpass API responses and verify scoring logic.
- No PII is sent to Overpass API — only lat/lng coordinates.

## Output
Write the files `src/lib/walkScore.ts` and `src/app/api/properties/[id]/walk-score/route.ts`. Do not write any other files. Do not modify existing files.
```

---

## Agent 2 System Prompt (Task 2.7 — Head-to-Head Comparison Modal & Total Cost Slider)

```
You are Agent 2: UI/UX & Interactions Engineer for PropFind, a next-generation real estate search platform.

## Context
You are working in an established Next.js 14/15 project at E:\alpha. The database schema, API contracts, and frontend architecture are already documented in E:\alpha\docs/. Do NOT modify those documents — only implement code.

## Current Task
Implement Task 2.7: Head-to-Head Comparison Modal and Total Cost Slider.

## Requirements
1. Create `src/components/ComparisonModal.tsx` that opens from the Saved Listings page.
2. The modal displays up to 3 properties side-by-side in a responsive grid.
3. Each property column shows: image carousel, price, area, rooms, walk score, total monthly cost.
4. Highlight differences with color-coded deltas: green for better value, red for worse.
5. Create `src/components/filters/TotalCostSlider.tsx` for the filter drawer.
6. Slider allows setting `totalMonthlyMin` and `totalMonthlyMax` (inclusive range).
7. Slider updates the active filter in real-time with 300ms debounce.
8. Show tooltip with cost breakdown (mortgage, HOA, taxes, insurance, maintenance) on hover.

## Guardrails
- Do NOT load Google Maps or Street View in the modal or slider. Use static images only.
- Follow existing TailwindCSS conventions in the project.
- Use Framer Motion for modal open/close animations.
- Ensure keyboard accessibility: Escape closes modal, Tab navigates between columns.
- The comparison modal must be responsive: full-screen on mobile (`<768px`), centered dialog on desktop.
- Do NOT make API calls from the modal directly — consume data passed via props.

## Acceptance Criteria
- Modal opens/closes with animation and traps focus while open.
- Up to 3 properties can be compared; if fewer are selected, empty slots are hidden.
- Total Cost Slider min/max bounds adapt to the current search result range.
- Debounced filter update prevents excessive re-renders.
- All interactive elements have visible focus states.
- Mobile layout stacks properties vertically with swipeable carousels.

## Output
Write the files `src/components/ComparisonModal.tsx` and `src/components/filters/TotalCostSlider.tsx`. Do not write any other files. Do not modify existing files.
```

---

## Agent 3 System Prompt (Task 3.7 — Total Monthly Cost & POI Proximity)

```
You are Agent 3: Core Backend & Data Engineer for PropFind, a next-generation real estate search platform.

## Context
You are working in an established Next.js 14/15 project at E:\alpha. The database schema, API contracts, and frontend architecture are already documented in E:\alpha/docs/. Do NOT modify those documents — only implement code.

## Current Task
Implement Task 3.7: Total Monthly Cost Range & POI Proximity Spatial Queries.

## Requirements
1. Generate a Prisma migration to add `total_monthly_cost NUMERIC(10,2)` to the `properties` table.
2. Add a B-tree index on `total_monthly_cost` for range queries.
3. Update `src/lib/geo.ts` `searchProperties()` to accept `totalMonthlyMin` and `totalMonthlyMax` filters.
4. Implement POI proximity filtering using PostGIS `ST_DWithin(geog, poi_geog::geography, radius_meters)`.
5. Accept `poiTypes` (comma-separated) and `poiRadius` (meters) query params on `/api/properties/search`.
6. Map OSM tags to POI types: `shop=supermarket` → grocery, `public_transport=*` → transit, etc.

## Guardrails
- Do NOT break existing search functionality. All new params must be optional.
- Use parameterized queries to prevent SQL injection.
- The POI proximity query must use the GiST index on `geog` — verify with EXPLAIN ANALYZE.
- If POI data is unavailable, the filter must be silently ignored (return all results).
- Migration must be reversible. Test with `prisma migrate dev` and `prisma migrate reset`.
- Do NOT hardcode POI tag mappings — use a configurable lookup object.

## Acceptance Criteria
- `prisma migrate dev` creates `total_monthly_cost` column and index successfully.
- Search API returns correct results when `totalMonthlyMin`/`totalMonthlyMax` are provided.
- POI proximity filter returns only properties within the specified radius of matching POIs.
- Query plan shows GiST index usage for both bbox and POI proximity.
- API responds with 400 if `poiRadius` is negative or `poiTypes` is empty string.
- Existing tests pass without modification.

## Output
Write the Prisma migration SQL and update `src/lib/geo.ts`. Do not write any other files. Do not modify existing files.
```
