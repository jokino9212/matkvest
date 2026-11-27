# v305 final audit — 2026-11-27

Baseline: e2a76f9df8e08990b3b5402f22829b2c44a2770f. Learning gate 45983267025 passed. Chest candidate targeted Vue and fallback tests passed. Full gate 45987309099 was still in progress at preparation time; no runtime acceptance is claimed here.

## Additional gate

The read-only workflow runs four two-tab scenarios in Vue and HTML fallback (one affordable chest, two affordable chests, same-item sale, distinct-item sale), exhaustion using actual transactions, and offline king artwork at 390/1280 px. It uploads screenshots even if the gate fails. A failed gate must block promotion; investigate storage races before changing transaction code. Do not write to main, production or the backend branch.

## Economy model

50,000 seeded Python trials (seed 305), initially all 19 rare, 15 epic and 10 legendary items available, all sold once at floor(price/2), total gross refund 13,337. Assumptions: each roll independently uses 70/25/5 unless pity forces legendary after 11 misses or epic/legendary after 3 rare rolls (5/6 and 1/6); exhausted tiers pay 100/150/200; pity advances by rarity even for compensation. Stop at exhaustion. Chest cost 200. No pre-owned items, no extra earning or buying back. This is a model, not proof of actual runtime behavior.
- 86.76 openings on average, including 42.76 compensation rolls.
- Net coins mean +820.34, median +787, 5th/95th percentiles -763/+2487; 78.568% positive.
- Upper bound on net resale proceeds (no compensation costs) +4537, assuming no duplicates or stale overwrite. Unique rewards total 1940 XP (1140+600+200); exhausted tiers must never create positive net coins or XP.
- Prices and probabilities unchanged; owner decision needed before rebalancing.

## King artwork

Fetched exact SVG blob 1c7e00b08c86cf5a86c07710290c3c587001121a; reproduced Git hash locally and rendered to PNG at 512x512. Visually readable crown, blue costume and beard; original stylization, not official game artwork. Browser cache, catalog inclusion, profile viewer and offline persistence remain pending the new gate. Candidate price 480, level 8, epic.

## Server boundary

Read-only review of integration/backend95-v305-closed-pilot at a318360571c073fb6892f8a23d7ec41572711c89: economy_operations.mjs uses POST /student/profiles/{id}/economy/operations and idempotency keys; economy_read.mjs validates pinned catalog build/digest/count and server quotes; v302 acceptance preserves store refund rules 40/80 and historic chest receipts. New item, chest sale provenance and 50% quote, bonus XP and duplicate prevention need a coordinated server-authoritative versioned policy, migrations preserving old ownership/receipts, and real HTTP/DB regression including concurrency and lost-receipt retry. Existing server policy must not be bypassed or treated as compatible. The server and integration branch are unchanged; server acceptance is not established.
