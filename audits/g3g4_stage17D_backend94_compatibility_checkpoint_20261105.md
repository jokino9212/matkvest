# МатКвест — stage17D: backend 9.4 compatibility checkpoint (read-only)

**Date:** 2026-11-05  
**Production:** `main` at `e58d84f15eaeb71a3e4d904cfb316724b2fd678d` (unchanged)  
**Release candidate:** `release/stage17-v50-20261105` at `10ae70be6d2a54528274ddc4f5678c9971b536c8` (unchanged)  
**PR:** #3, draft, not merged.

## Inputs recovered
- Backend archive from existing project Library: `/МАТКВЕСТ/matkvest_backend_9_4_final.zip` (123,616 bytes).
- Archive SHA-256: `aa43b770fd121aae046d1bfff504468c4c67acec24858d44854981240c094274`.
- Contains FastAPI backend, Alembic `0001`–`0004_entitlements`, API endpoints, tests, and `BASELINE_FOR_9_5.md`.
- No backend source was added to the public frontend repository.

## Checks performed in isolated local runtime
1. `pytest -q tests/test_entitlements_9_4.py -ra --maxfail=1`: **32 passed** (SQLite-based API/contract tests).
2. `pytest -q tests/test_config.py tests/test_database.py tests/test_health.py -ra`: **5 passed**.
3. Attempted full `pytest -q --disable-warnings --maxfail=1`: timed out after initial tests; **NOT PASSED / NOT CLAIMED**.
4. PostgreSQL 16 live E2E, Alembic migration on disposable PostgreSQL, browser-to-backend E2E, and production account migration: **NOT RUN**. Windows 81/81 Gate is documented in the archive, not independently reproduced in this environment.

## API/frontend integration contract
- Backend 9.4 exposes `/api/v1/me/entitlements`, `/api/v1/student/profiles/{profile_id}/topics/{grade}/{topic_id}/access`, `/api/v1/student/profiles/{profile_id}/training-starts`, tutor seat/license and admin policy endpoints.
- Local frontend v50 Release Gate confirms no `fetch()` / `XMLHttpRequest` / `WebSocket` API integration. Browser tests and local backend contract tests passing separately **do not imply end-to-end integration**.
- Backend's `BASELINE_FOR_9_5.md` explicitly records that the published HTML is not yet connected to backend and the actual grade/topic server catalog is not populated.
- The 9.5 phase is required for profile claim/migration, sync, server-authoritative quotas and rewards, conflict handling, and integration.

## New static risk identified in release candidate
- Current `sw.js` intercepts **any same-origin GET**, then caches successful non-navigation fetches without excluding `/api/`.
- When authenticated backend API is subsequently deployed on the same origin and inside SW scope, this could cache user-specific GET JSON, e.g. entitlements. Add an explicit API bypass and regression tests **before 9.5 integration**. Do not change current release candidate in this audit-only checkpoint.

## Release decision boundary
- Standalone learning/PWA release v50: previous frontend Release Gate PASS, PR #3 remains a draft pending owner release decision and later live post-deploy smoke test.
- Commercial/full server-connected product: **BLOCKED on 9.5 integration** and independent security/PG E2E.
- No merge/deploy, no edits to `index.html` or `sw.js`, no production database operations in this checkpoint.
