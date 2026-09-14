# PropFind System Architecture

## High-Level System Diagram

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        A[Next.js App Router]
        B[Swipe Deck + Framer Motion]
        C[Lazy Google Maps]
        D[Zustand Store]
        E[Analytics Consent Banner]
    end

    subgraph Edge["Edge Layer"]
        F[Next.js Middleware<br/>Rate Limiting + Auth]
        V[CDN / Vercel Edge]
    end

    subgraph API["API Layer (Route Handlers)"]
        G[/api/properties/search]
        H[/api/swipe]
        I[/api/telemetry]
        J[/api/user/filters]
        K[/api/properties/:id/street-view]
        L[/api/b2b/metrics]
    end

    subgraph Services["Service Layer"]
        M[Property Service]
        N[Swipe Service]
        O[Telemetry Service]
        P[GeoService]
        Q[B2B Analytics Service]
    end

    subgraph Data["Data Layer"]
        R[(PostgreSQL + PostGIS)]
        S[(Redis Cache)]
        T[(S3 / Object Storage)]
    end

    subgraph External["External APIs"]
        U[Google Maps JavaScript API]
        V2[Google Street View API]
        W[Google Geocoding API]
    end

    subgraph B2B["B2B Reporting"]
        X[Aggregated Metrics Pipeline]
        Y[Developer Dashboard]
        Z[CSV/JSON Export]
    end

    A --> B & C & D & E
    A --> F
    F --> G & H & I & J & K & L
    G --> M
    H --> N
    I --> O
    K --> P
    L --> Q
    M --> R & S
    N --> R
    O --> R
    P --> R & S
    Q --> R
    C --> U & V2
    P --> W
    M --> T
    R --> X
    X --> Y & Z
```

## Data Flow: Client → Geospatial DB → Analytics → B2B

```mermaid
sequenceDiagram
    participant User
    participant Client as Next.js Client
    participant API as API Routes
    participant Cache as Redis
    participant DB as PostgreSQL/PostGIS
    participant Pipeline as Analytics Pipeline
    participant B2B as B2B Dashboard

    User->>Client: Open app / Set filters
    Client->>API: POST /api/properties/search (bbox, filters)
    API->>Cache: Check cached results
    alt Cache Hit
        Cache-->>API: Cached property IDs
    else Cache Miss
        API->>DB: ST_Intersects(geog, bbox) + filters
        DB-->>API: Property rows
        API->>Cache: Store results (TTL 5min)
    end
    API-->>Client: Property cards (first 10)

    User->>Client: Swipe right on property
    Client->>API: POST /api/swipe (propertyId, SWIPE_RIGHT)
    API->>DB: INSERT INTO user_interactions
    API->>DB: Fetch next property (excluding seen)
    API-->>Client: Next property card

    Client->>API: POST /api/telemetry (anonymous events)
    API->>DB: INSERT INTO search_telemetry

    Note over Pipeline: Every 15 minutes (cron)
    Pipeline->>DB: Aggregate interactions by geohash + time bucket
    Pipeline->>DB: INSERT INTO b2b_aggregated_metrics

    B2B->>API: GET /api/b2b/metrics (zone, timeRange)
    API->>DB: SELECT aggregated metrics (no PII)
    API-->>B2B: Anonymized market insights
```

## Component Interaction Flow

```mermaid
graph LR
    subgraph Pages
        P[page.tsx]
    end

    subgraph Components
        SD[SwipeDeck]
        PC[PropertyCard]
        MV[MapView]
        SV[StreetViewModal]
        FP[FilterPanel]
        CB[ConsentBanner]
    end

    subgraph Hooks
        US[useSwipeDeck]
        GL[useGoogleMapsLoader]
    end

    subgraph Store
        ST[Zustand Store]
    end

    P --> SD & MV & FP & CB
    SD --> PC
    PC --> SV
    SD --> US
    MV --> GL
    US --> ST
    GL --> ST
    FP --> ST
    CB --> ST
```

## Service Responsibilities

| Service | Responsibility |
|---------|---------------|
| **Property Service** | Geospatial queries, bounding box search, property CRUD |
| **Swipe Service** | Record interactions, manage seen-property deduplication, queue next cards |
| **Telemetry Service** | Ingest anonymous events, validate consent, batch-write to DB |
| **GeoService** | PostGIS helpers, GeoJSON generation, distance calc, geocoding cache |
| **B2B Analytics Service** | Aggregate metrics pipeline, serve anonymized insights |

## Infrastructure Notes

- **Vercel Edge** for global low-latency API routing
- **Supabase** or **Railway** for managed PostgreSQL + PostGIS
- **Upstash Redis** for serverless-compatible caching
- **Google Cloud** for Maps API with billing alerts
- **Cron job** (Vercel Cron or GitHub Actions) for B2B aggregation every 15 min
