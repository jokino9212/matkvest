# v305 feature acceptance — 2026-11-27

Scope: feature/v305-learning-chest-rewards only. Main 9f06afc8134e007c3e72eae231c8f9b519678fe5; exact published runtime 55cbaf122c2f4a934dc1064236403286107c22f2. Tested source edfbc6d4ce6ad9e0785351f4a8de966a29a9dccd. HTML SHA256 1e225be71d2aeed493be494c150f2ebaedda392c9f90701f331923ad5b7d6227, matching published SW. Publisher run 45994386321 job 140489985763 succeeded and confirmed exact tested hash and branch push; retired to read-only historical check in a4909f926e38459de0e64a04d7d437c0023f81f0. No repeated materialization.

## Evidence
- Runs 45993624970 and 45994069667: each eight of eight suites successful; latter targeted job 140488925859: 28 PASS scenarios, PWA job 140488925846 successful. Earlier PWA job 140487415711 successful.
- Actual old runtime: expected/actual 2810 coins, 10174 XP, own sale and chest receipts retained, sold item not restored. Unversioned old quarantine and legacy economic conflict PASS; no Web Locks Vue and fallback PASS.
- PWA verified refresh v304 to v305 at 390 and 1280, online/offline quiz and stored progress PASS. Collection exhaustion covers 44 unique items, 60/40/20 XP and compensation; no new balance simulation performed.
- Artifact 15194813841 from exact candidate run: ZIP SHA256 d4acdad4c18dcce36d70e9847fdcd70f7c611a45838f92ec90e4a700245f965a independently verified after download. Both PNGs manually inspected: king-390.png (390x850), king-1280.png (1280x850). Centered viewer, intact crown and face, visible label and close button, no apparent clipping or overlap. Visual acceptance limited to these two captured states. Automated offline avatar tests report cached and active, price 480, level 8.

## Scope audit
Compare Main to published runtime: ahead 25, behind 0, merge base equals Main, 24 changed paths, no backend paths. Runtime/UI/art: index.html, sw.js, assets/ui/knowledge-map.js, assets/source/avatars/avatar_clash_king.svg, frontend/knowledge-map/CollectionSection.vue, frontend/knowledge-map/StoreChestResult.vue (six paths); remaining 18 workflow/audit paths. This is a path-level comparison, not a new exhaustive line-by-line code review. No new runtime modifications in acceptance stage.

## Release boundary
Feature functional and captured visual acceptance PASS. Public release not authorized. Backend audit a3183605 only: R7-R5 functional baseline, 398 tests passed historically, 33 unresolved upstream build findings; closed pilot package not container-tested, strict deployment preflight remains blocking. No Main, production or server branch changes, no force push, no price/probability changes, no repeat of 50000 simulation. Historical verification workflow result to be checked separately if pending.
