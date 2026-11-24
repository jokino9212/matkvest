# v289 — teacher cabinet, PIN and pupil-management checkpoint
- Published v288 baseline: corrected preflight 45487009396 passed six stale-action cases in Vue 390/1280 and HTML fallback 390, including reset cancel/close, student back/delete request, old delete confirm and live keyboard cancellation. No runtime defects reproduced; no logic rewrite.
- Initial gate failed Git scope check after PWA sync. Fixed explicit checkout/HEAD and publisher version markers. Intermediate gate completed tests but publication refused; final gate 45490266539 SUCCESS.
- Published test-only commit 1c97826aa3c1993ee8f171ae881c89a4dba48191, HTML SHA256 0f70384de5feb13a77570a18d35cc1d5f40969a7c999feb0dde9eefb60d97c84, cache matkvest-iphone-v289. Only index.html and sw.js version/fingerprint changes. Prior full regression, keyboard, offline F5 and reward invariants passed.
- Main 2985f92 unchanged, no production/backend changes. PR #131 stays draft.
- Combine remaining v290–v292 into final frontend cycle: baseline audit, targeted fixes only if reproduced, one full gate, one release. No separate audit-only releases.
