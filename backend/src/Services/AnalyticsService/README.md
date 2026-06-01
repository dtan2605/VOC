AnalyticsService
================

Minimal scaffold for Phase 6 analytics service.

Endpoints (placeholders):
- GET /api/analytics/stats?userId=
- GET /api/analytics/streaks?userId=
- GET /api/analytics/mastery?userId=

Run locally:
1. dotnet restore
2. dotnet run

Migrations:
- A manual initial migration has been added under `Migrations/` as a starting point.

Using MySQL / Pomelo provider (production):
- To use MySQL in production, add the Pomelo provider to the project:

	1. The project is preconfigured to use Pomelo/MySQL. Set env `ANALYTICS_DB` to your MySQL connection string, for example:

		 `Server=mysql;Database=voc_analytics;User=root;Password=root;`

	2. The service will fail to start if `ANALYTICS_DB` is not set (to avoid accidental SQLite fallback).

	3. To run locally with Docker Compose, use `docker-compose.analytics.yml` which defines a `mysql` service and sets `ANALYTICS_DB` accordingly.

Docker-compose example:
- See `docker-compose.analytics.yml` at repo root for a sample setup.

Notes:
- The project currently includes a SQLite provider for local development; switch to Pomelo when ready for MySQL.

