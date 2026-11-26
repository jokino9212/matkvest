# Closed pilot R3 — local PostgreSQL recovery acceptance (2026-11-26)

Base checkpoint bc0d11d8ac92c8e0d017f45828c61bf5ca7931ae; R1 preparation journal af9b140bcd798aea01d62d860c9f53a0b8447a99.

Local synthetic rehearsal report v305-rev4-pilot-r3: PASS, stage complete, all ten stages PASS. ZIP CRC and RESULT.json SHA-256 verified. Report ZIP SHA-256 1391621309981460a5ccacdfabb33153d50402e360fc1d5101fb3caa8d9a9cd3. Local R3 candidate archive SHA-256 4f9c44b448c40455a215de7fe094adcdbe878654c093db94fc277c4c59808b69, 409 entries, CRC and all 408 manifest digests verified independently. Report identifies revision and base commit; it is not a cryptographic attestation binding the entire executed package.

PostgreSQL 16: 35 tables, 744 rows, all rows equal, no missing/extra tables or different schema objects. Columns, constraints, indexes, sequence definitions and state, extensions and Alembic revision 0011_retired_pets_v302 equal. Nine CHECK expressions differ only in the placement of varchar-to-text casts (array versus each literal); all nine diagnostics logical_equal=true. Backup 113341 bytes; reported dump SHA-256 a50bebc8fa88e6527dfdff294e14bc8207885529a506bbcefd7d8a9413bb3cb6. Dump bytes are not included in report, so its digest was not independently recomputed.

Source and restored probes PASS, including dedicated limited runtime DB role, auth/isolation, disabled test/admin writes, CSRF, purchase replay, training reward, retired pet quotes, tutor report and restored-session invalidation. Scope: synthetic local PostgreSQL backup/restore with ASGI HTTPS semantics only, no external listener. Actual TLS, browser in pilot mode, external hosting, dependency/CVE review and production backup schedule/recovery objectives are not yet accepted. Do not treat this as authorization to deploy.

Main remains 9f06afc8134e007c3e72eae231c8f9b519678fe5 (public v304); integration/backend95-v305-focus remains bc0d11d8ac92c8e0d017f45828c61bf5ca7931ae. No raw local report, database, credentials or private backend source uploaded. Next: isolated actual TLS/browser pilot validation, dependency audit and operational configuration review; no external purchase or deployment.
