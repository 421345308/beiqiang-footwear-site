# Catalogue parity release gate

The existing `npm run verify:deployments` command now checks three sources:
the checked-out published-product registry, each deployed frontend's English
product URLs in `/sitemap.xml`, and the VPS inquiry whitelist loaded from its
current release. It compares exact code sets, not counts. Missing, unexpected,
duplicate codes, unavailable SSH, HTTP failures and invalid data all produce
`ALERT CATALOG_PARITY` and a nonzero process exit. JSON output includes differences.

Run after every product/frontend or API deployment, from the intended release
checkout on the existing operator computer with the `beiqiang-vps` SSH alias:

```sh
npm run verify:deployments -- --json
# Optional explicit frontend target, otherwise both existing default sites:
npm run verify:deployments -- https://www.beiqiang.online --json
```

Do not mark a publication complete on failure. Existing callers/monitoring of
this command must retain stderr/stdout and honor its exit status. This change
does not create a scheduler, external notification subscription, or promise
background alerts when nobody runs the command. The alert is in the existing
release-check output; an inaccessible VPS is UNKNOWN/failure, never a green pass.

The SSH operation is a fixed read-only command with BatchMode and a 20-second
deadline. It reads only release identity and public style codes. It does not
read credentials or customer data, query the database, open a public/private API,
submit an inquiry, change permissions, restart services or deploy anything.
Raw SSH errors are suppressed to avoid leaking connection details.

On mismatch: verify the intended published registry; run the existing local
`catalog:check`; review missing/extra codes; separately authorize/perform the
appropriate normal deployment with task checks, backup and rollback. Then rerun
this gate. Never automatically redeploy or replay tasks to make the check pass.
An operator running an older checkout may legitimately see unexpected codes;
first check the release revision, do not remove live products to match stale code.

Offline regression tests use injected SSH/fetch fixtures and no production I/O:
`node --experimental-strip-types --test tests/catalog-parity.test.mjs`.
They cover same-count substitutions, duplicate/invalid sets, frontend drift,
unavailable VPS, HTTP errors and the existing command's failure integration.
