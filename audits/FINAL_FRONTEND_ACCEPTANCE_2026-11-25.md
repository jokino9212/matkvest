# Final frontend acceptance scope (v290–v292 combined)
## Already covered
81 Vue components, 66 mount exports. Lifecycle refresh of model/actions/view and teardown on ancestor removal. Existing v288 inventory: 284 lexical event references in 112 rough owners; not active defect counts. Legacy fallback and math generators retained.
Existing PWA suite checks export one/all, invalid profile, cancel replace, repeat unchanged import, skip same-name conflict, full restore, storage quota failure/retry, original corrupt bytes, offline F5, developer test-only isolation and keyboard.
## New targeted probes
Delayed file read after switching or closing, two reads completed out of order, detached preview/replace and conflict buttons, same/different/skip decisions, repeat import, old profile editor callbacks, recovery with no Vue/adapter. Use synthetic isolated browser profiles only. Source inspection must identify runtime function and later overrides; never mass-delete inline handlers.
## Final gate
Run distinct existing contracts and prior browser suites once on candidate; full PWA refresh suite, responsive offline 320/390/768, targeted new checks, profile isolation, corrupted data safety, no duplicate rewards, deterministic bundle, SHA fingerprints. Exact branch/head, publish only tested runtime files. Do not change main, backend or production. No assertion of server sync readiness beyond frontend contract; real Android and multi-device backend remain separate.
