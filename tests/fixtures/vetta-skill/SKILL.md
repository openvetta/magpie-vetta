---
name: vetta-resource-probe
description: Read the attached resource and run the approved verification script.
---

# Vetta resource probe

Read `references/payload.txt` relative to this Skill directory. When script execution is approved, run `node scripts/read-payload.mjs` from this directory and check that its output includes `skill-resource-ok:attached-resource`.
