"use client";

import { useState } from "react";
import type { BuyerMeetingRequestRecord } from "./BuyerMeetingRequest";

export default function MeetingCalendarDownload({ reference, accessCode, requests, locale = "en", onStatus }: { reference: string; accessCode: string; requests: BuyerMeetingRequestRecord[]; locale?: "en" | "zh"; onStatus: (message: string) => void }) {
  const meeting = [...requests].reverse().find((item) => item.status === "confirmed"); const [saving, setSaving] = useState(false); const zh = locale === "zh";
  if (!meeting) return null;
  async function download() {
    setSaving(true); onStatus(zh ? "正在生成受保护的日历文件……" : "Preparing the protected calendar file…");
    try {
      const response = await fetch("/api/meeting-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, accessCode, requestId: meeting.id }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || (zh ? "日历文件暂时无法生成。" : "The calendar file could not be generated.")); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `beiqiang-${meeting.id.toLowerCase()}.ics`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); onStatus(zh ? "日历文件已下载，请在保存前核对时间、时区和会议方式。" : "Calendar file downloaded. Review the time, time zone and channel before saving it.");
    } catch (error) { onStatus(error instanceof Error ? error.message : (zh ? "日历文件暂时无法生成。" : "The calendar file could not be generated.")); } finally { setSaving(false); }
  }
  return <section className="meeting-calendar-download"><div><p className="eyebrow">{zh ? "已确认会议" : "CONFIRMED MEETING"}</p><h3>{zh ? "添加到您的日历" : "Add to your calendar"}</h3><p>{meeting.confirmedSlot} · {meeting.timezone} · {meeting.durationMinutes || 30}{zh ? "分钟" : " minutes"}</p></div><button className="button button-secondary" type="button" disabled={saving} onClick={() => void download()}>{saving ? (zh ? "生成中……" : "Preparing…") : (zh ? "下载 .ics 日历文件" : "Download .ics calendar")}</button><small>{zh ? "文件不会暴露项目访问码，也不会自动确认、修改或取消会议。请以私密项目页中的最新状态为准。" : "The file does not expose the project access code and cannot confirm, change or cancel the meeting. The private project page remains the current source of status."}</small></section>;
}
