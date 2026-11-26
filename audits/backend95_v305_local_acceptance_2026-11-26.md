# v305 Rev4 — local PostgreSQL acceptance, 2026-11-26

Status: PASS for the specified isolated local acceptance scope; not authorized for production deployment.

- Source branch checkpoint: 9fb342f0bdeacdfcdf48e6fc1834844edc55b8fb.
- Frontend CI 45855561873, job 140032865987: success, including synthetic API, local answer focus at 390/1280, school queue, archive 40/80 and tutor regression.
- Accepted frontend HTML SHA256: 233b38def492eecc64cb45e13a72834084d23099bf6a29ac186698c016bc4c6f.
- Worker SHA256: 953c2057bf661dbe179ec06db54f8e79d149d052dafd8d7806b5d5b3ec947357.
- Server economy policy v302 SHA256: 81ddda0d0993f34aad16dfdf9d354a50691837049cd2ef25556c0daa7ae75953.
- Local gate revision: v305-rev4-local-origin.
- Local report SHA256: 4e8301d5552cd9ba572ec02e637962399379f69ca612a9a9dc893d0e31b86f1d.
- ZIP CRC, all manifest digests, actual JUnit testcase counts and candidate HTML/fixture digests verified.
- RESULT.json: PASS, gate_exit_code=0, postgresql_accepted=true.
- PostgreSQL JUnit: migrations/locks 7/7, current features 102/102; zero failures, errors or skips.
- Actual populated Alembic upgrade and downgrade refusal passed.
- Real HTTP and explicit origin/CSRF guards passed.
- Real Vue/PostgreSQL browser checks passed: offline F5 and one reward, purchase idempotency, tutor periods and revocation, retired pet archive and 40% refund.
- 80% refund is covered by the synthetic frontend and server regression, not asserted as a separate real-browser scenario.
- Rev4 changes concern test setup, including local origin configuration, CITEXT fixture, Windows temporary paths and process log lifecycle. No raw local report, database, credentials, or backend source uploaded to public GitHub.

Main remains 9f06afc8134e007c3e72eae231c8f9b519678fe5 (public v304); previous integration branch remains 3f18db0eda0dd6dd7b0ab29e357151c4cadafa06. No deployment, external server purchase, or production mutation performed. Next gate: reproducible private pilot release package, configuration/security and backup/restore review, then separate approval for any external deployment. Local PASS does not certify external hosting, production traffic or operations.
