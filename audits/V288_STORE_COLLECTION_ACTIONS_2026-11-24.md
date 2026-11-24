# v288 — consolidated store / collection / pets (2026-11-24)
- Inventory 45481691966: 284 lexical inline/event assignments, not 284 active defects.
- Baseline preflight 45481819849: Vue 390/1280 and HTML fallback 390; detached header closes later shop, old collection tab reroutes, old purchase charges 60 test coins (3/3 each). Pet choice already guarded (3/3 inert).
- Candidate: originating live host/profile guard for store header, catalog actions and collection navigation, delegated native fallback. Existing economics/persistence and pet logic unchanged.
- First gate 45482505605 failed at nested-close assertion; test expected home instead of previous shop route. Corrected assertion and two outdated publisher version markers in 6964b50.
- Final gate 45483115491 SUCCESS, targeted keyboard and stale actions, contracts v271–v288, deterministic bundle, 12 skip checks, prior full browser suites, online/offline refresh 390/1280, responsive offline 320/390/768, rewards without duplicates.
- Published test branch only: 5dce0741f544246ee10fb5ee4e18e872b97a9f84, cache matkvest-iphone-v288, HTML SHA256 b06b8c407f827596eca66083dea4bd93e9831056793feb47a57cde7491310504.
- Main 2985f92b6bd1a26dfcc316917f1752602b099572 unchanged; production/backend untouched. Next v289 teacher cabinet/PIN/student management, then v290 import/settings, v291 final audit, v292 final gate.
