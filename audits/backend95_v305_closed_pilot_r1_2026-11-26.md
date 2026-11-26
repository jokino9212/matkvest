# Closed pilot R1, preparation only — 2026-11-26

Base: accepted v305 Rev4, checkpoint bc0d11d8ac92c8e0d017f45828c61bf5ca7931ae. Main v304 unchanged. No external deployment or purchase.

Private local package: MatKvest_v305_Closed_Pilot_R1.zip, SHA-256 cd4e384a8097c1061f5767043de46749686ba28f307211ee9a4bda74caa3b6d5, 408 entries; CRC and 407 manifest digests checked. No backend code, private reports or credentials uploaded here.

Security review identified that the test-only economy mode also permits development actor headers, foundation writes and disabled login throttling. R1 adds a separate opt-in local pilot mode, explicit loopback HTTPS origin and dedicated PG runtime role, Secure cookies, CSRF, closed registration/reset, blocked dev/admin routes and foundation writes. Frontend and migrations remain byte-identical to Rev4. New backend code is a candidate, not covered by the old real PG PASS.

SQLite regression: 218/218 (201 existing +17 new), no failures/errors/skips; 7 PG-only tests explicitly excluded because no PG in assistant runtime. Initial unfiltered run had 6 missing POSTGRES_TEST_URL failures and 1 skip. Source/restore probe application logic exercised on SQLite, not actual backup/restore. Local Docker/psycopg absent, so new PG backup/restore NOT accepted.

Prepared disposable local PostgreSQL 16 rehearsal with distinct source and restore DBs, least-privilege app role, synthetic accounts, pg_dump/pg_restore, full row and schema comparisons, post-restore login and replay, archive refunds and tutor report checks. ASGI HTTPS semantics only, not a real TLS connection. Run RUN_PILOT_REHEARSAL.cmd and inspect PILOT_REPORT ZIP.

External pilot remains blocked: actual PG rehearsal, real browser regression in pilot mode, TLS/proxy/firewall, dependency/CVE audit, operational encrypted off-host backups and recovery, account provisioning and separate authorization. Proposed RPO/RTO and retention in private runbook are targets, not verified guarantees. Do not deploy test mode or turn on production.
