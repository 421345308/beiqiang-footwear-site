export type InquiryOverviewTask = {
  kind: "project" | "inquiry";
  title: string;
  status: string;
  reference?: string;
  next?: string;
  updated_at?: string;
  notification_state?: "accepted" | "not_confirmed" | "unknown";
};

// This is a view of the existing inquiry tasks, never a second source of truth.
export function inquiryOverview(tasks: InquiryOverviewTask[] | undefined, connected: boolean) {
  if (!connected || !Array.isArray(tasks)) return { state: "unavailable" as const };
  const inquiries = tasks.filter(task => task.kind === "inquiry");
  const pending = inquiries.filter(task => task.status === "待处理")
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  return { state: "ready" as const, total: inquiries.length, pending: pending.length, items: pending.slice(0, 3),
    notificationNotConfirmed: inquiries.filter(item => item.notification_state === "not_confirmed").length,
    notificationUnknown: inquiries.filter(item => !item.notification_state || item.notification_state === "unknown").length };
}
