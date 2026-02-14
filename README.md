# Weather Service (NWS-backed) + OpenAPI + Swagger UI + Docker

## Requirements
- Node.js 20+ (uses built-in `fetch`)
- npm

## Setup (local)
```bash
npm install
cp .env.example .env
# Edit .env and set NWS_USER_AGENT to your contact info
npm run dev
```

## Call the API
```bash
curl "http://localhost:3000/v1/forecast?lat=39.7456&lon=-97.0892"
```

## Swagger UI
- Browse: `http://localhost:3000/docs`
- Raw spec:
  - `http://localhost:3000/openapi.yaml`
  - `http://localhost:3000/openapi.json`

## Run tests
```bash
npm test
```

## Docker
```bash
docker build -t weather-service .
docker run -p 3000:3000 -e NWS_USER_AGENT="weather-service (you@example.com)" weather-service
```

Then visit:
- `http://localhost:3000/docs`


## Authentication (minimal)
This service uses HTTP Basic Auth for `/v1/forecast`, `/docs`, and `/openapi.*`.

Example:
```bash
curl -u demo:{password} "http://localhost:3000/v1/forecast?lat=39.7456&lon=-97.0892"
```

Set these in `.env` (only the Argon2id hash is stored by the service):
- `AUTH_USERNAME`
- `AUTH_PASSWORD_HASH`

## Contributing
This repository does **not** accept automated pull requests from GitHub Copilot or other automated agents. All changes should be intentionally requested by repository maintainers. See [`.github/COPILOT.md`](.github/COPILOT.md) for details.
