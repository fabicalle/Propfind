# Google Maps API Cost-Reduction Strategy

## Cost Drivers (2026 Pricing)

| API | Cost per 1000 calls | Monthly Free Tier |
|-----|---------------------|-------------------|
| Maps JavaScript API | $7.00 | $200 credit |
| Street View Static API | $7.00 | $200 credit |
| Geocoding API | $5.00 | $200 credit |
| Places API | $17.00 | $200 credit |

**Target: Stay within $200/month free tier for 90% of months.**

---

## 1. Dynamic Loading Pattern

```typescript
// Maps only load when user explicitly navigates to Map tab
// Never on initial page load
const loadGoogleMaps = async () => {
  if (window.__googleMapsLoaded) return;
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });
  await loader.load();
  window.__googleMapsLoaded = true;
};
```

**Savings: ~40%** — Eliminates Maps load for swipe-only users.

---

## 2. Street View Lazy Trigger

```
Street View NEVER loads automatically.
  → Only renders when user clicks "Street View" button on a PropertyCard
  → Uses IntersectionObserver to defer iframe until modal is visible
  → Unloads iframe on modal close (no background panorama calls)
```

**Savings: ~25%** — Street View is the 2nd most expensive API.

---

## 3. Session Tokens

```typescript
// Generate a unique session token per Maps session
// Google bills per session, not per map load
let mapsSessionToken: string | null = null;

const getSessionToken = () => {
  if (!mapsSessionToken) {
    mapsSessionToken = crypto.randomUUID();
  }
  return mapsSessionToken;
};

// Pass token to all Street View / Geocoding calls
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&key=${apiKey}&session=${getSessionToken()}`;
```

**Savings: ~30%** on Street View and Geocoding APIs.

---

## 4. Server-Side GeoJSON Caching with Redis

```typescript
// Cache property GeoJSON for bounding box queries
const cacheKey = `geojson:${bboxHash}:${filterHash}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await prisma.$queryRaw`...`;
await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
return result;
```

**Savings: ~50%** reduction in repeated identical queries.

---

## 5. Geocoding Cache Strategy

```
User searches by address:
  1. Check Redis for address → { lat, lng } (TTL: 30 days)
  2. Cache miss → Call Google Geocoding API
  3. Store result in Redis + PostgreSQL (geocoding_cache table)
  4. Future identical searches served from cache

Address normalization before cache lookup:
  - Lowercase
  - Remove punctuation
  - Expand abbreviations (St → Street, Ave → Avenue)
```

**Savings: ~70%** on Geocoding API calls.

---

## 6. Marker Clustering with Cost-Efficient Rendering

```typescript
// Use @googlemaps/markerclusterer — free, open-source
// Only render markers visible in current viewport
// Debounce viewport changes (300ms) before fetching new markers

const visibleMarkers = allMarkers.filter(m =>
  map.getBounds()?.contains({ lat: m.lat, lng: m.lng })
);

// Limit max markers rendered: 200 per viewport
// Beyond 200, switch to heatmap layer
```

**Savings: ~20%** — Fewer DOM elements, fewer map re-renders.

---

## 7. Fallback Maps (Leaflet) for Low-Bandwidth

```typescript
// Detect slow connection via Network Information API
const connection = (navigator as any).connection;
const isSlow = connection?.effectiveType === '2g' || connection?.saveData;

if (isSlow) {
  // Use Leaflet with OpenStreetMap tiles (FREE)
  // No Google Maps API calls at all
  return <LeafletMap />;
}
```

**Savings: ~100%** for users on slow connections.

---

## 8. Budget Alerts and Monitoring

```typescript
// Track daily spend via Google Cloud Billing API
// Alert thresholds:
const BUDGET_THRESHOLDS = {
  warning: 150,   // $150 — send Slack alert
  critical: 190,  // $190 — switch to Leaflet fallback for all users
  hard: 200,      // $200 — disable Google Maps entirely
};

// Monitoring dashboard:
// - Daily API call count by type
// - Cost per user session
// - Cache hit rate
// - Top geohash zones by query volume
```

---

## Summary of Savings

| Strategy | Estimated Savings |
|----------|------------------|
| Dynamic loading | 40% |
| Street View lazy trigger | 25% |
| Session tokens | 30% |
| Redis GeoJSON cache | 50% |
| Geocoding cache | 70% |
| Marker clustering | 20% |
| Leaflet fallback | 100% (for affected users) |
| **Combined** | **~80-90%** |

---

## Implementation Checklist

- [ ] Implement `useGoogleMapsLoader` with dynamic import
- [ ] Add session token generation and rotation
- [ ] Set up Redis with Upstash
- [ ] Create geocoding cache table + normalization
- [ ] Add Network Information API detection
- [ ] Implement Leaflet fallback component
- [ ] Set up Google Cloud billing alerts
- [ ] Add cost monitoring dashboard endpoint
- [ ] Configure budget threshold auto-fallback
