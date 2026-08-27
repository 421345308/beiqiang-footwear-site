"use client";

import { useState } from "react";
import type { BuyerMeetingRequestRecord } from "./BuyerMeetingRequest";

export default function BuyerMeetingChangeRequest({
  reference,
  accessCode,
  meeting,
  locale = "en",
  onSaved,
  onStatus,
}: {
  reference: string;
  accessCode: string;
  meeting: BuyerMeetingRequestRecord;
  locale?: "en" | "zh";
  onSaved: () => Promise<void>;
  onStatus: (message: string) => void;
}) {
  const zh = locale === "zh";
  const pending = meeting.changeRequests?.find(
    (item) => item.status === "pending",
  );
  const [action, setAction] = useState<"reschedule" | "cancel">("reschedule");
  const [timezone, setTimezone] = useState(meeting.timezone || "");
  const [slots, setSlots] = useState(["", "", ""]);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  function updateSlot(index: number, value: string) {
    setSlots((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    onStatus(
      zh ? "正在保存会议变更申请……" : "Saving your meeting change request…",
    );
    try {
      const response = await fetch("/api/meeting-change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          accessCode,
          meetingId: meeting.id,
          action,
          timezone,
          preferredSlots: action === "reschedule" ? slots.filter(Boolean) : [],
          reason,
          buyerConfirmation: confirmed,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.message ||
            (zh
              ? "会议变更申请未能保存。"
              : "The meeting change request could not be saved."),
        );
      onStatus(
        zh
          ? "变更申请已保存；原确认时间在业务员批准前保持不变。"
          : result.message,
      );
      await onSaved();
    } catch (error) {
      onStatus(
        error instanceof Error
          ? error.message
          : zh
            ? "会议变更申请未能保存。"
            : "The meeting change request could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="buyer-meeting-change">
      <h4>{zh ? "需要改期或取消？" : "Need to reschedule or cancel?"}</h4>
      {pending ? (
        <div className="buyer-meeting-change-pending">
          <strong>
            {zh ? "变更申请等待审核" : "Change request awaiting review"}
          </strong>
          <p>
            {pending.action === "reschedule"
              ? zh
                ? `候选时间：${pending.preferredSlots.join(" / ")}（${pending.timezone}）`
                : `Proposed times: ${pending.preferredSlots.join(" / ")} (${pending.timezone})`
              : zh
                ? "买家已申请取消会议。"
                : "The buyer requested cancellation."}
          </p>
          <small>
            {zh
              ? "原确认会议仍然有效，直到贝强批准此申请。"
              : "The original confirmed meeting remains active until Beiqiang approves this request."}
          </small>
        </div>
      ) : (
        <details>
          <summary>
            {zh ? "提交改期 / 取消申请" : "Request rescheduling / cancellation"}
          </summary>
          <form onSubmit={submit}>
            <label>
              {zh ? "申请类型" : "Request type"}
              <select
                value={action}
                onChange={(event) =>
                  setAction(event.target.value as "reschedule" | "cancel")
                }
              >
                <option value="reschedule">
                  {zh ? "申请改期" : "Request rescheduling"}
                </option>
                <option value="cancel">
                  {zh ? "申请取消" : "Request cancellation"}
                </option>
              </select>
            </label>
            {action === "reschedule" ? (
              <>
                <label>
                  {zh ? "您的时区 / 城市" : "Your time zone / city"}
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    placeholder="Europe/Berlin or UTC+2"
                  />
                </label>
                <fieldset>
                  <legend>
                    {zh ? "新的候选当地时间" : "New proposed local times"}
                  </legend>
                  {slots.map((slot, index) => (
                    <label key={index}>
                      {zh
                        ? `候选${index + 1}${index === 2 ? "（可选）" : ""}`
                        : `Option ${index + 1}${index === 2 ? " (optional)" : ""}`}
                      <input
                        type="datetime-local"
                        required={index < 2}
                        min={`${today}T00:00`}
                        value={slot}
                        onChange={(event) =>
                          updateSlot(index, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              </>
            ) : null}
            <label>
              {zh ? "变更原因" : "Reason for change"}
              <textarea
                required
                minLength={8}
                maxLength={600}
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={
                  zh
                    ? "说明时间冲突或取消原因，请勿填写密码或付款资料。"
                    : "Explain the timing conflict or cancellation reason. Do not include passwords or payment details."
                }
              />
            </label>
            <label className="buyer-meeting-check">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                {zh
                  ? "我理解原确认会议在贝强批准此申请前仍然有效。"
                  : "I understand the original confirmed meeting remains active until Beiqiang approves this request."}
              </span>
            </label>
            <button type="submit" disabled={saving}>
              {saving
                ? zh
                  ? "保存中……"
                  : "Saving…"
                : zh
                  ? "提交人工审核"
                  : "Submit for human review"}
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
