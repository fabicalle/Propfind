# API Contract

## Authentication Flow

```
Anonymous User:
  1. Client generates sessionId (UUID) → stored in localStorage
  2. Sent as X-Session-Id header on every request
  3. Server creates anonymous user record on first interaction

Authenticated User:
  1. OAuth via NextAuth.js (Google, Apple, Email)
  2. JWT issued with userId claim
  3. Sent as Authorization: Bearer <token> header
  4. sessionId still sent for continuity

Both: sessionId links anonymous history to authenticated user on login
```

---

## Endpoints

### POST /api/properties/search

Search properties within a bounding box with filters.

**Request:**
```json
{
  "bbox": {
    "south": 40.7128,
    "west": -74.0060,
    "north": 40.7580,
    "east": -73.9855
  },
  "filters": {
    "priceMin": 500000,
    "priceMax": 1500000,
    "areaMin": 50,
    "areaMax": 200,
    "rooms": [2, 3, 4],
    "propertyTypes": ["apartment", "condo"],
    "amenities": ["gym", "parking"],
    "listingType": "sale"
  },
  "excludeIds": ["uuid-1", "uuid-2"],
  "limit": 10,
  "offset": 0
}
```

**Response (200):**
```json
{
  "properties": [
    {
      "id": "uuid",
      "title": "Modern 2BR in Tribeca",
      "price": 1250000,
      "area_m2": 95,
      "rooms": 2,
      "lat": 40.7128,
      "lng": -74.0060,
      "images": [{ "url": "...", "width": 1200, "height": 800 }],
      "neighborhood": "Tribeca",
      "amenities": ["gym", "doorman"]
    }
  ],
  "total": 342,
  "hasMore": true
}
```

---

### POST /api/swipe

Record a swipe interaction and return the next card.

**Request:**
```json
{
  "propertyId": "uuid",
  "direction": "right",
  "metadata": {
    "swipeVelocity": 1.5,
    "timeOnCardMs": 3200,
    "source": "deck"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "nextProperty": {
    "id": "uuid-2",
    "title": "...",
    "price": 980000,
    "images": [...],
    "lat": 40.7200,
    "lng": -74.0100
  },
  "remainingInQueue": 2
}
```

**Response (204):** No more properties in queue (trigger re-fetch)

---

### POST /api/telemetry

Ingest anonymous telemetry events. Requires consent.

**Request:**
```json
{
  "events": [
    {
      "type": "SEARCH_PERFORMED",
      "timestamp": "2026-08-26T12:00:00Z",
      "payload": {
        "filtersApplied": { "priceMax": 1000000 },
        "resultsCount": 45,
        "searchDurationMs": 230
      }
    },
    {
      "type": "MAP_INTERACTION",
      "timestamp": "2026-08-26T12:00:15Z",
      "payload": {
        "zoomLevel": 14,
        "clickPosition": { "lat": 40.7128, "lng": -74.0060 }
      }
    }
  ]
}
```

**Response (202):**
```json
{ "accepted": 2, "rejected": 0 }
```

**Response (403):** Consent not granted

---

### POST /api/user/filters

Save a filter configuration.

**Request:**
```json
{
  "filterName": "Downtown 2BR",
  "criteria": {
    "priceMin": 500000,
    "priceMax": 1500000,
    "rooms": [2],
    "bbox": { "south": 40.71, "west": -74.01, "north": 40.76, "east": -73.98 }
  },
  "isDefault": false
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "filterName": "Downtown 2BR",
  "criteria": { ... },
  "isDefault": false,
  "createdAt": "2026-08-26T12:00:00Z"
}
```

### GET /api/user/filters

List user's saved filters.

**Response (200):**
```json
{
  "filters": [
    { "id": "uuid", "filterName": "...", "criteria": {}, "isDefault": true }
  ]
}
```

---

### GET /api/properties/:id/street-view

Proxy endpoint for Street View metadata. Returns panorama ID and heading.

**Response (200):**
```json
{
  "panoId": "CAoSLEFGMVFpcE5f...",
  "heading": 270,
  "pitch": 0,
  "lat": 40.7128,
  "lng": -74.0060
}
```

**Response (404):** No Street View available for this location

---

### GET /api/b2b/metrics

Serve aggregated, anonymized market insights.

**Query Parameters:**
- `metricType` (required): One of the metric_type enum values
- `zone` (optional): GeoHash or neighborhood name
- `timeBucket` (required): hourly | daily | weekly | monthly
- `from` (required): ISO date
- `to` (required): ISO date

**Response (200):**
```json
{
  "metricType": "SWIPE_RIGHT_RATE",
  "zone": "dr5ru",
  "timeBucket": "daily",
  "data": [
    { "bucketStart": "2026-08-25T00:00:00Z", "value": 0.342, "sampleSize": 1289 },
    { "bucketStart": "2026-08-26T00:00:00Z", "value": 0.358, "sampleSize": 1456 }
  ]
}
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/properties/search | 30 req | 1 minute |
| /api/swipe | 60 req | 1 minute |
| /api/telemetry | 100 req | 1 minute |
| /api/user/filters | 20 req | 1 minute |
| /api/b2b/metrics | 10 req | 1 minute |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

## Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid bounding box coordinates",
    "details": [{ "field": "bbox.north", "issue": "must be greater than south" }]
  }
}
```
