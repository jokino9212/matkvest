# MatKvest v306 — feature release acceptance, 2026-11-27

Status: accepted on feature branch only. No Main/production deployment authorized.

- Base production v305: 01c66c215cb6d6b4dd53350203b22a391f5674e2
- Candidate source: 7ceee5dd73399487f1a6c078d1bf018213a2f3e7
- Exact materialized runtime: 5d8f626bf88cce4be6721e7fbedae468acf6ba84
- HTML SHA256: 7e6e2b8de44e1eb4888b34f012288c32e24643eafe9c350fe79e9881935cb318
- HTML Git blob: 43a214467b69d011befda04a1936e16474f58ee1
- SW Git blob: 172d993102faf0017184332266053cf59fd1543c
- SW cache: matkvest-iphone-v306
- Initial label gate: 46006668516 (28/28)
- Full regression: 46007637140 (16/16 suites plus materialize SUCCESS)
- Targeted job 140534754725: 28/28
- PWA job 140534755103: PASS_VERIFIED_REFRESH first=305 latest=306 at 390 and 1280; online, offline, offlineQuiz, storedProgress true; both offline storage recovery tests PASS.
- Storage job 140534755200: genuine v304 migration, 320/390/768; two profile IDs and balances preserved (271 XP/413 coins and 892 XP/124 coins), corrupt draft bytes, malformed legacy/authority preservation, zero failures.
- Pets job 140534755012: catalog cardinality including 65 avatars, unique king, 31 pet entries, art alpha 30/30, archival sale and reload, zero JS errors.
- Materialize job 140538847608: exact HTML verified, SW fingerprint synchronized; only index.html and sw.js changed; normal fast-forward push to feature branch.
- Full regression matrix: types, storage, pets, targeted, legacy-chest, store, keyboard, drafts, attempts, offline, pwa, profiles, mobile, media, collection, inputs.

Reward label mapping covers ten shop types; six actual chest categories and coin-only compensation exercised in Vue and HTML fallback at both widths. No new chest categories or economics introduced; price, rarity, XP and resale unchanged. The PWA harness uses prior production source and controlled script markers to simulate the CDN transition; this is isolated acceptance, not live Pages verification. All 44 chest reward IDs and protected old-tab/no-Web-Locks scenarios checked by targeted suite.

The one-shot writer is retired in this acceptance commit. Main remains at the v305 base; backend and server unchanged. Live production release requires explicit authorization and separate Pages/live update verification.
