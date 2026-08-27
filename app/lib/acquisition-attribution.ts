export const ACQUISITION_CHANNELS = ["email", "linkedin", "whatsapp", "alibaba", "google", "tiktok", "partner"] as const;
export type AcquisitionChannel = (typeof ACQUISITION_CHANNELS)[number];

const MEDIUM_BY_CHANNEL: Record<AcquisitionChannel, string> = {
  email: "outbound_email",
  linkedin: "social_outreach",
  whatsapp: "direct_message",
  alibaba: "marketplace",
  google: "organic_search",
  tiktok: "social_content",
  partner: "referral",
};

export function campaignSlug(value: string, max = 48) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/g, "");
}

export function buildTrackedAcquisitionUrl({ channel, destination, campaign, content = "" }: { channel: AcquisitionChannel; destination: string; campaign: string; content?: string }) {
  if (!ACQUISITION_CHANNELS.includes(channel)) throw new Error("Choose a supported acquisition channel.");
  if (!destination.startsWith("/") || destination.startsWith("//") || destination.includes(":") || destination.includes("\\")) throw new Error("Choose a website destination.");
  const safeCampaign = campaignSlug(campaign); const safeContent = campaignSlug(content);
  if (safeCampaign.length < 3) throw new Error("Use a campaign code with at least 3 letters or numbers.");
  const url = new URL(destination, "https://www.beiqiang.online");
  url.searchParams.set("utm_source", channel);
  url.searchParams.set("utm_medium", MEDIUM_BY_CHANNEL[channel]);
  url.searchParams.set("utm_campaign", safeCampaign);
  if (safeContent) url.searchParams.set("utm_content", safeContent);
  return url.toString();
}
