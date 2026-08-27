"use client";

import { useState } from "react";

export type MeetingChangeRequest = {
  id: string;
  action: "reschedule" | "cancel";
  reason: string;
  timezone: string;
  preferredSlots: string[];
  status: "pending" | "approved" | "declined";
  submittedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  reviewNote: string;
  approvedSlot: string;
};
export type MeetingRequest = {
  id: string;
  meetingType: string;
  preferredChannel: string;
  timezone: string;
  preferredSlots: string[];
  agenda: string;
  attendees: string;
  language: string;
  status: "pending" | "confirmed" | "declined" | "cancelled" | "completed";
  submittedAt: string;
  confirmedSlot: string;
  confirmedChannel: string;
  durationMinutes: number;
  meetingLink: string;
  reviewNote: string;
  reviewedAt: string;
  reviewedBy: string;
  completedAt: string;
  outcomeSummary: string;
  notificationStatus: string;
  changeRequests?: MeetingChangeRequest[];
};

type RecordLike = {
  reference: string;
  receivedAt: string;
  owner?: string;
  meetingRequests?: MeetingRequest[];
};
type ChangeAction = "approve_change" | "decline_change";

function ChangeReview({
  change,
  saving,
  onReview,
}: {
  change: MeetingChangeRequest;
  saving: boolean;
  onReview: (
    action: ChangeAction,
    changeRequestId: string,
    confirmedSlot: string,
    note: string,
  ) => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState(
    change.preferredSlots?.[0] || "",
  );
  const [note, setNote] = useState("");
  return (
    <div className="meeting-change-review">
      <strong>
        Buyer {change.action} request · {change.id}
      </strong>
      <p>{change.reason}</p>
      {change.action === "reschedule" ? (
        <label>
          Buyer-proposed replacement
          <select
            value={selectedSlot}
            onChange={(event) => setSelectedSlot(event.target.value)}
          >
            {change.preferredSlots.map((value) => (
              <option key={value} value={value}>
                {value} · {change.timezone}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Buyer-safe decision note
        <textarea
          required
          minLength={5}
          maxLength={600}
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Explain the approved replacement or why the original meeting remains unchanged"
        />
      </label>
      <div>
        <button
          type="button"
          disabled={saving || note.trim().length < 5}
          onClick={() =>
            onReview("approve_change", change.id, selectedSlot, note)
          }
        >
          Approve {change.action}
        </button>
        <button
          type="button"
          disabled={saving || note.trim().length < 5}
          onClick={() =>
            onReview("decline_change", change.id, selectedSlot, note)
          }
        >
          Decline change
        </button>
      </div>
      <small>
        The original meeting remains active until approval. Approving
        cancellation closes it; approving rescheduling creates the current
        calendar time.
      </small>
    </div>
  );
}

function ReviewCard<T extends RecordLike>({
  record,
  item,
  token,
  onSaved,
}: {
  record: T;
  item: MeetingRequest;
  token: string;
  onSaved: (record: T) => void;
}) {
  const [slot, setSlot] = useState(item.preferredSlots[0] || "");
  const [channel, setChannel] = useState(item.preferredChannel || "video_call");
  const durationMinutes = String(item.durationMinutes || 30);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function act(
    action: "confirm" | "decline" | "cancel" | "complete" | ChangeAction,
    changeRequestId = "",
    replacementSlot = slot,
    decisionNote = note,
  ) {
    setSaving(true);
    setMessage("Saving meeting review…");
    try {
      const response = await fetch("/api/admin/meeting-request", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference: record.reference,
          receivedAt: record.receivedAt,
          requestId: item.id,
          changeRequestId,
          action,
          actor: record.owner || "Sales team",
          confirmedSlot: replacementSlot,
          confirmedChannel: channel,
          durationMinutes: Number(durationMinutes),
          meetingLink: link,
          note: decisionNote,
          outcomeSummary: outcome,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(result.message || "Meeting review could not be saved.");
      onSaved(result.record as T);
      setMessage(
        action === "complete"
          ? "Meeting outcome saved."
          : action === "approve_change"
            ? `Meeting change approved${result.notificationSent ? " and buyer emailed" : "; buyer email was not sent"}.`
            : action === "decline_change"
              ? `Meeting change declined${result.notificationSent ? " and buyer emailed" : "; buyer email was not sent"}.`
              : `Meeting ${action === "confirm" ? "confirmed" : action === "decline" ? "declined" : "cancelled"}${result.notificationSent ? " and buyer emailed" : "; buyer email was not sent"}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Meeting review could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  const pendingChanges =
    item.changeRequests?.filter((change) => change.status === "pending") || [];
  return (
    <article className={`meeting-review-card meeting-review-${item.status}`}>
      <div>
        <strong>
          {item.id} · {item.meetingType.replaceAll("_", " ")}
        </strong>
        <span>
          {item.preferredChannel.replaceAll("_", " ")} · {item.language} ·{" "}
          {item.timezone}
        </span>
        <small>Submitted {new Date(item.submittedAt).toLocaleString()}</small>
        <p>{item.agenda}</p>
        {item.attendees ? (
          <small>Attendees / roles: {item.attendees}</small>
        ) : null}
      </div>
      {item.status === "pending" ? (
        <div className="meeting-review-actions">
          <label>
            Buyer-proposed slot
            <select
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
            >
              {item.preferredSlots.map((value) => (
                <option key={value} value={value}>
                  {value} · {item.timezone}
                </option>
              ))}
            </select>
          </label>
          <label>
            Confirmed channel
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
            >
              <option value="video_call">Video call</option>
              <option value="whatsapp_call">WhatsApp call</option>
              <option value="phone">Phone</option>
            </select>
          </label>
          {channel === "video_call" ? (
            <label>
              Approved meeting link
              <input
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://meet.google.com/…"
              />
            </label>
          ) : null}
          <label>
            Buyer-safe confirmation / rejection note
            <textarea
              rows={3}
              maxLength={600}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Preparation note, dialling detail or reason the request cannot be confirmed"
            />
          </label>
          <div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void act("confirm")}
            >
              Confirm selected time
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void act("decline")}
            >
              Decline request
            </button>
          </div>
        </div>
      ) : item.status === "confirmed" ? (
        <div className="meeting-review-actions">
          <p>
            <strong>Confirmed:</strong> {item.confirmedSlot} · {item.timezone} ·{" "}
            {item.confirmedChannel.replaceAll("_", " ")}
          </p>
          {item.meetingLink ? (
            <a href={item.meetingLink} target="_blank" rel="noreferrer">
              Open meeting link
            </a>
          ) : null}
          {pendingChanges.map((change) => (
            <ChangeReview
              key={change.id}
              change={change}
              saving={saving}
              onReview={(
                action,
                changeRequestId,
                confirmedSlot,
                decisionNote,
              ) =>
                void act(action, changeRequestId, confirmedSlot, decisionNote)
              }
            />
          ))}
          <label>
            Factual meeting outcome
            <textarea
              rows={3}
              minLength={8}
              maxLength={1000}
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              placeholder="What was actually discussed, what evidence remains missing, and the agreed next action"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void act("complete")}
          >
            Mark completed with outcome
          </button>
          <label>
            Buyer-safe cancellation reason
            <textarea
              rows={2}
              minLength={5}
              maxLength={600}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void act("cancel")}
          >
            Cancel confirmed meeting
          </button>
        </div>
      ) : (
        <div className="meeting-review-resolution">
          <strong>{item.status.replaceAll("_", " ")}</strong>
          <p>
            {item.outcomeSummary ||
              item.reviewNote ||
              "No buyer-safe note recorded."}
          </p>
          <small>
            {item.reviewedAt
              ? new Date(item.reviewedAt).toLocaleString()
              : "Time unavailable"}{" "}
            · {item.reviewedBy || "Sales team"}
          </small>
        </div>
      )}
      <p aria-live="polite">{message}</p>
    </article>
  );
}

export default function MeetingRequestCenter<T extends RecordLike>({
  record,
  token,
  onSaved,
}: {
  record: T;
  token: string;
  onSaved: (record: T) => void;
}) {
  const requests = record.meetingRequests || [];
  if (!requests.length) return null;
  const active = requests.filter((item) =>
    ["pending", "confirmed"].includes(item.status),
  );
  const history = requests.filter(
    (item) => !["pending", "confirmed"].includes(item.status),
  );
  return (
    <details className="admin-meeting-center" open={Boolean(active.length)}>
      <summary>
        Sourcing meetings ({active.length} active · {history.length} closed)
      </summary>
      <div className="admin-meeting-boundary">
        <strong>Human confirmation only</strong>
        <p>
          A buyer request is not a booking. Confirm only an offered local-time
          slot after checking the stated time zone, channel, language
          availability and responsible salesperson. Meeting discussion never
          replaces written sample, quotation, Trade Assurance or contract terms.
        </p>
      </div>
      {active.map((item) => (
        <ReviewCard
          key={item.id}
          record={record}
          item={item}
          token={token}
          onSaved={onSaved}
        />
      ))}
      {history.length ? (
        <details className="admin-meeting-history">
          <summary>Closed meeting history ({history.length})</summary>
          {[...history].reverse().map((item) => (
            <ReviewCard
              key={item.id}
              record={record}
              item={item}
              token={token}
              onSaved={onSaved}
            />
          ))}
        </details>
      ) : null}
    </details>
  );
}
