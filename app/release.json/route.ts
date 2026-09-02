import { SITE_RELEASE } from "../data/site-release.ts";

export async function GET() {
  return Response.json(SITE_RELEASE, {
    headers: {
      "cache-control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
