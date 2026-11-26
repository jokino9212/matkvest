# v302 isolated integration acceptance checkpoint — 2026-11-26

Status: combined synthetic browser acceptance PASS; migration input preflight PASS.
Overall release remains BLOCKED pending final full PWA CI and real server acceptance.
No deployment, no main change, no external server, no database writes.

## Verified source and evidence
- Main unchanged: 2985f92b6bd1a26dfcc316917f1752602b099572.
- Backend v300 source: 6526923968b26279da601edcc70d2d70c923af73; CI 45719396934 PASS.
- Pet candidate source: 658f543e1c5fec571e2711662ea2f415ab6b25d3; CI 45771127040 PASS.
- Test-only merge PR 132, commit c7eb0e8d2639ab67a6248f07ec73bfaadce32b5f.
- Combined CI 45799968202, exact tested head c25170df602ccc3ec626cec9f0da423becc7cbb0:
  - job 139840327474 backend-baseline SUCCESS;
  - job 139840327584 combined-diagnostic SUCCESS;
  - job 139840327131 pet-regression: guarded patch, pet behavior, existing Vue/fallback/school regression SUCCESS; final PWA offline/refresh step still running at checkpoint.
- Earlier F5 defect: integration imports retained ?v=300 while worker required ?v=302. Corrected output modules, regenerated verified hashes, added version fence; mobile 390 and desktop 1280 browser tests PASS.
- Combined browser log confirms offline logout/reload, profile isolation, 18 supported school topics, IndexedDB queue, keyboard, shared quota, lost receipt retry with same UUID, 80% mission, tutor reports and offline F5. Synthetic API only, original server economy policy intentionally used.
- Migration input script source: 2c2d3b277b2dd15d3a57c94f0edd00f3ce9e9915.
- Independent preflight branch integration/backend95-pets-v302-preflight, head 9b64bf7edeb88e8023bfadf30182ccee1604e770, CI 45800533525, job 139842274991 SUCCESS. Compilation, normal/optimized Python, export byte digests, existing output directory rejection, incorrect digest, modified chest price and re-enabled retired pet rejected. No DB writes.
- No new confirmed defects requiring code changes at this checkpoint.

## Exact policy delta
Old build bec1537186acb23b7483d98f8fabf3b3870def64e255cfcec5208d659851ecce
Old policy e12e0b972331ecf508f40a0e9a5b285d205807844222d2191260d91a88e54c43
New build 2027d86fd81013019c376b14eb20f07e95ba3c361c4310944904e1b6dc37f18d
New policy 81ddda0d0993f34aad16dfdf9d354a50691837049cd2ef25556c0daa7ae75953
261 IDs retained; buyable 184 -> 181; pools rare 20 -> 19, epic 16 -> 15, legendary 11 -> 10. Chest 200, rates 70/25/5, compensation 100/150/200, refunds 40/80 unchanged. Only retired IDs pet_robotx, pet_wisecat, pet_royal_dragon and build identity differ in policy. Both exact inputs embedded in audits/prepare_backend95_pet_migration_v302.py.

## Remaining hard gates
1. Confirm final pet-regression and overall CI result at exact tested head. Do not label whole run PASS until completed.
2. Recover actual v300 backend archive (МатКвест_Backend_9_5_аналитика_v300_кандидат.zip or МатКвест_v300_полный_комплект_локальной_приёмки.zip). Not available in current workspace; prior chat links are not current file bytes.
3. Implement and verify actual server migration from 0010 against real models. Coordinate new server policy and client validation; reject stale policy safely; preserve ownership, historic receipts, refunds, missions, chest history and wallets. No automatic refund. Normalize retired equipped slots.
4. Real PostgreSQL on disposable local/test-only environment: upgrade + fresh install, actual server tests, transaction and replay/concurrency tests and real Vue + API browser integration. No production or external server.
5. Candidate still applies pet patch in ephemeral CI checkout; repository index.html remains pinned original. No ready-to-deploy combined product source or artifact claimed.
