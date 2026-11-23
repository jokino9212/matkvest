#!/usr/bin/env python3
"""Prepare a PRIVATE Vue PWA v267 candidate from the verified v266 snapshot.

Run after npm run build:knowledge-map; never run on production/main.
This changes only versioned script URLs, the worker cache version, and
requires the existing independent fingerprint synchronizer afterward.
"""
from pathlib import Path
import re
import subprocess

BRANCH = "fix/vue-mount-actions-20261123"
OLD, NEW = 266, 267
current_branch = subprocess.check_output(
    ["git", "branch", "--show-current"], text=True
).strip()
if current_branch != BRANCH:
    raise SystemExit(f"Refusing to modify branch {current_branch!r}; expected {BRANCH!r}")

html_path, worker_path = Path("index.html"), Path("sw.js")
html, worker = html_path.read_bytes(), worker_path.read_text("utf-8")
old_url, new_url = f"?v={OLD}".encode(), f"?v={NEW}".encode()
if new_url in html:
    raise SystemExit("Candidate URLs already present; fail closed")
n = html.count(old_url)
if n != 26:
    raise SystemExit(f"Expected exactly 26 v{OLD} script URLs, found {n}")
before = re.findall(rb'<script src="((?:g5-[\\w-]+|g[123478]-textbook)\\.js)\\?v=(\\d+)"></script>', html)
vue = re.findall(rb'const knowledgeMapUrl = "\\./(assets/ui/knowledge-map\\.js)\\?v=(\\d+)";', html)
if len(before) != 25 or len(vue) != 1 or any(v != str(OLD).encode() for _, v in before + vue):
    raise SystemExit(f"Versioned script inventory mismatched: scripts={len(before)}, vue={len(vue)}")
declaration = f'const CACHE_NAME = "matkvest-iphone-v{OLD}";'
if worker.count(declaration) != 1:
    raise SystemExit("Expected one v266 cache declaration")
replacement = f'const CACHE_NAME = "matkvest-iphone-v{NEW}";'
html_path.write_bytes(html.replace(old_url, new_url))
worker_path.write_text(worker.replace(declaration, replacement), encoding="utf-8")
print(f"Prepared PRIVATE PWA v{NEW}: {n} cache-busted URLs; visible 8.78 unchanged")
print("Run audits/g7_stage12_sync_pwa.py and --check before testing")
