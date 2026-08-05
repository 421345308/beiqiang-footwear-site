# Beiqiang B2B Footwear Site

Public B2B lead-generation site for Quanzhou Beiqiang Footwear & Apparel Co., Ltd. The production URL is `https://www.beiqiang.online/`. The site is designed to turn product discovery into qualified sample and quotation inquiries; it is not a retail checkout store.

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Production Deployment: GitHub to EdgeOne

- Private repository: `421345308/beiqiang-footwear-site`
- Production branch: `main`
- EdgeOne project: `beiqiang-footwear` (`makers-zsvtdpeh3qf1`)
- Framework preset: `Eleventy` (pure-static deployment path)
- Root directory: `edgeone-deploy`
- Install command: `npm ci --prefix ..`
- Build command: `npm run build`
- Output directory: `dist`

`edgeone-deploy/` is a deployment adapter, not a second application. It runs the root `edgeone:build` script and copies `edgeone-export-v1` into `edgeone-deploy/dist`. Keep the EdgeOne root directory on `edgeone-deploy`; pointing it back to the repository root causes EdgeOne to load a Next/OpenNext server adapter and look for `.next/required-server-files.json`, which this static export does not need.

## Change and Release Checklist

1. Tie the change to a sales outcome: discovery, trust, qualification, contact, follow-up, sample, quotation, or order.
2. Use only verified product facts and assets from the Beiqiang workspace.
3. Work on a `codex/*` branch, confirm Node.js `>=22.13.0`, and run `npm test` plus `npm run edgeone:build`.
4. Review the diff for product accuracy, contact details, links, mobile behavior, SEO, and unsupported claims.
5. Merge or push to `main`; EdgeOne deploys automatically.
6. Verify the deployment preview and then `https://www.beiqiang.online/`, including changed pages and every contact CTA.
7. Record the commit, deployment result, KPI hypothesis, and any follow-up in the operations archive.

For rollback, revert the problem commit and redeploy, or select the previous successful EdgeOne deployment. Do not use destructive resets on unreviewed local work.

## Inquiry Storage and Notification

The production form posts to `/api/inquiries`. EdgeOne Cloud Functions persist each validated inquiry in the `beiqiang-inquiries` Blob store before returning success. Conversion events are written to the separate `beiqiang-events` store. Blob storage is provided by EdgeOne Makers and does not require a database connection string.

Email notification is optional until these EdgeOne Production environment variables are configured. Never commit the QQ authorization code to GitHub:

- `SMTP_HOST=smtp.qq.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=421345308@qq.com`
- `SMTP_PASS=<QQ mailbox SMTP authorization code>`
- `SMTP_FROM=421345308@qq.com`
- `INQUIRY_NOTIFY_TO=421345308@qq.com`

After changing environment variables, create a new deployment because existing deployments do not inherit later environment changes. Test with a clearly marked internal inquiry and confirm both the on-page reference number and the received email.

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
