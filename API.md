# Deep Research Engine API Documentation

## Base URL
All API requests should be prefixed with `/api/v1`

---

## 1. Research Endpoint

The primary endpoint to submit a query, scrape results, and get a generated summary.

**POST** `/api/v1/search`

### Headers
- `Content-Type: application/json`

### Request Body
```json
{
  "query": "elon musk",
  "deep_mode": false,
  "max_results": 10,
  "context_query": "",
  "no_cache": false
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `query` | string | **Required** | The primary search string (min 2, max 200 chars). |
| `deep_mode` | boolean | `false` | If true, runs multiple follow-up background searches to fetch deeper context. |
| `max_results` | integer | `10` | The maximum number of articles to return in the payload (max 20). |
| `context_query` | string | `""` | Optional string to prefix the search with for follow-up conversational memory. |
| `no_cache` | boolean | `false` | If true, bypasses the Redis cache and enforces a fresh search. |

### Response (200 OK)

```json
{
  "query": "elon musk",
  "summary": "Elon Musk is a business magnate, investor, and engineer. He is the founder, CEO, and chief engineer of SpaceX, as well as the CEO and product architect of Tesla...",
  "key_points": [
    "Born June 28, 1971 in Pretoria, South Africa",
    "Founded SpaceX in 2002",
    "Major investor and CEO of Tesla"
  ],
  "profiles": [
    {
      "platform": "Twitter/X",
      "url": "https://x.com/elonmusk",
      "username": "elonmusk"
    }
  ],
  "articles": [
    {
      "title": "Elon Musk - Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Elon_Musk",
      "snippet": "Elon Reeve Musk is a business magnate, investor, and engineer...",
      "score": 0.89,
      "publishedDate": "2024-05-01T00:00:00.000Z"
    }
  ],
  "sources": [
    "https://en.wikipedia.org/wiki/Elon_Musk",
    "https://x.com/elonmusk"
  ],
  "meta": {
    "totalResults": 25,
    "processingTimeMs": 3450,
    "fromCache": false,
    "cachedAt": "2024-05-01T08:15:30.000Z"
  }
}
```

---

## 2. Health & Cache Endpoints

**GET** `/health`
Returns the operational status of the API and its Redis connection.

**GET** `/api/v1/search/health`
Returns basic health check timestamp for the search router specifically.

**GET** `/api/v1/cache/stats`
Returns system memory and keyspace stats from the connected Redis instance.

**DELETE** `/api/v1/cache/:query`
Invalidates and deletes a specific cached query result.
- *URL Param*: `query` (URL encoded string)
