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

## Final frontend CI and local backend candidate — 26 November 2026
- CI 45799968202: all three jobs now completed SUCCESS, including pet-regression 139840327131. Synthetic integration acceptance is complete for the tested head, with the old v290 server policy only.
- User provided original v300 PostgreSQL acceptance archive; CRC OK, 205 files. Recovered new policy from exact old JSON, SHA256 matches accepted 81ddda0d0993f34aad16dfdf9d354a50691837049cd2ef25556c0daa7ae75953.
- Prepared separate LOCAL backend candidate archive, not published in GitHub. Migration 0011_retired_pets_v302 after 0010, retirement and equipment normalization, preserve purchases, receipt replay, 40/80 percent refunds and legacy ownership. Actual SQLite full regression 199 passed (three PG-only modules excluded), fresh Alembic upgrade, populated 0010 -> 0011 and repeat upgrade, real HTTP analytics smoke PASS.
- PostgreSQL gate attempted: blocked by missing local Docker CLI. Added PG-only archived sale concurrency tests and populated upgrade gate; not executed on PG. No PostgreSQL PASS claimed.
- Local candidate SHA256 94823b1d11e2be9543167cdb647a757c8213b1682bb10341486fac7a1f8638b3. Archive delivered in chat, retain it locally. No server sources uploaded. New client policy validation and real Vue+API+PG acceptance still required; release remains blocked. Main and production untouched.

## v302 strict client-policy integration checkpoint — 26 November 2026
- Confirmed backend candidate ZIP SHA256 94823b1d11e2be9543167cdb647a757c8213b1682bb10341486fac7a1f8638b3 and exact policy SHA256 81ddda0d0993f34aad16dfdf9d354a50691837049cd2ef25556c0daa7ae75953 against actual backend source.
- 55d3e619: guarded build-only overlay retains v300 baseline; v302 client compares all catalogue content to exact pinned module, archives three pets separately, prohibits selection and omits them from shop including preview; sale requires server quotes.
- acd3dc9b: full CI 45806425056. At checkpoint baseline SUCCESS; combined overlay, build, module version fence and strict model tests SUCCESS; synthetic new-policy browser and full pet regressions still running. Test-only combined site artifact is uploaded only after combined tests succeed; not deployment approved.
- Local gate archive MatKvest_Backend_9_5_v302_local_gate.zip SHA256 d5247ba838544b65a2fbebd19ad0b1aaed460a3bb25e532549170b328fc5fd85; 217 files, CRC OK. Adds site policy/fingerprint checks, enables isolated PG browser gate with v302 site, adds archive/refund browser scenario. Python compilation passed; new PG tests not run. Original 199 SQLite PASS from prior accepted backend; no backend runtime or migration changes. Repeat SQLite command reached 100% but timed out before final summary; no new full PASS claimed.
- Native PostgreSQL and Docker missing; DNS prevents package installation. Local Windows Docker procedure in RUN_V302_LOCAL_GATE.md; no remote database, public backend upload or deployment. Need successful new CI and real PG/HTTP/Vue gate before release. Main remains 2985f92b6bd1a26dfcc316917f1752602b099572.

## Completed new-policy CI and assembled local kit — 26 November 2026
- CI 45806425056 tested head acd3dc9bab600583e5b50a2ca653dc3b516eabce: all three jobs SUCCESS. Combined job 139862812672 logged PASS_V302_ARCHIVE_COMPENSATION_UI 40/80 and reload, PASS_V302_EXACT_POLICY_AND_ARCHIVE_MODEL, PASS_V302_MODULE_VERSION_FENCE, offline F5 at mobile/desktop widths, same UUID retry and teacher/queue tests. Full pet fallback/PWA job 139862812450 and v300 baseline 139862812926 SUCCESS. No new confirmed defects.
- Downloaded exact test-only Vue artifact 15109247723, 182 files, CRC OK; ZIP SHA256 329fe68d7dc586fc4253ff94d6f9713eb52a18049e5b9c0e122177264f096049. Backend local gate ZIP SHA256 d5247ba838544b65a2fbebd19ad0b1aaed460a3bb25e532549170b328fc5fd85, 217 files CRC OK. Local verify_v302_site.py PASS: index, all pinned module hashes, exact server/client catalogue, version fence. Actual FastAPI TestClient catalogue/state responses on SQLite accepted by built v302 validateEconomy (PASS_ACTUAL_API_CATALOG_ACCEPTED_BY_V302_CLIENT); targeted archive regression also ran without failures (exit zero). Previous 199/199 remains the full SQLite evidence.
- Attempted actual local browser on disposable SQLite with test-only adapted diagnostic script outside the kit: fresh upgrade/seed and HTTP startup succeeded; Chromium blocked loopback navigation ERR_BLOCKED_BY_ADMINISTRATOR. No real-browser PASS. Original PG browser gate unchanged. Actual PG gate refused safely because Docker CLI absent. No PostgreSQL PASS claimed.
- Delivered combined ZIP MatKvest_v302_Vue_Backend_Local_PostgreSQL.zip, 404 files, 7584432 bytes, SHA256 c13a36037287ad238e7e813ff31902116223e8e55db57fe5348637f7fbdad932; verified every manifest hash and CRC. Includes exact site, backend, Russian readme, Windows RUN_LOCAL_GATE.cmd (not executed on Windows here), local evidence. No DB, secrets, backend source upload or deployment. Next hard gate: run the local PG suite and return XML/console output. Release remains BLOCKED until actual PG and browser acceptance.

## Local PostgreSQL gate review revision 2 — 26 November 2026
- Verified all 403 file hashes in original combined kit c13a36037287ad238e7e813ff31902116223e8e55db57fe5348637f7fbdad932. PostgreSQL executables, psycopg and Docker absent in current runtime; no local PG acceptance. Network/package checks did not provide an installation route.
- Static confirmed mismatch in historical PG phase C test: expected intermediate revision 0009 after refused downgrade, contrary to Alembic PostgreSQL transactional DDL and default outer transaction. Fixed test to require original 0011 revision, same tables, counts, profiles and archived learning records. PG scenario itself not executed. Added actual populated 0011 downgrade refusal CLI test; SQLite upgrade/repeat/refusal PASS, unchanged wallet, inventory, selected slots, revisions and history. No changes to application code, migrations or site bytes.
- Repeat SQLite suite produced 199 testcases, 0 failures/errors/skips in complete JUnit XML; parent invocation timed out after XML creation, so not a clean process-exit PASS. Earlier 199/199 clean result remains valid. Site policy and PWA hashes PASS.
- New local report wrapper creates fresh PG_GATE_REPORT ZIP (console, JUnit, result, digests); actual missing-Docker invocation correctly generated BLOCKED_OR_FAILED and exit 1. Classifier synthetic tests verify missing/skipped reports and nonzero exit cannot yield PASS. Windows launcher updated, not executed on Windows here.
- Delivered MatKvest_v302_Local_Gate_Rev2.zip, 409 files, 7594156 bytes, SHA256 3881d725108cd8ae7b292e74fdccb01097c011d55419f174a8cc0ae38c21e458; ZIP CRC and manifest verified. Only gate/test/report/documentation changes; all site, app and migration hashes unchanged. No server code uploaded. Next gate: run RUN_LOCAL_GATE.cmd on local Docker Desktop with Python, provide report ZIP. Release remains blocked by actual PostgreSQL/browser gate.
