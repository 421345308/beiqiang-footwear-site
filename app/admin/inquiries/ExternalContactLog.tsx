"use client";

import { useState } from "react";

export type ExternalContact = { id: string; channel: string; direction: "outbound" | "inbound"; outcome: string; occurredAt: string; summary: string; actor: string; recordedAt: string };
type ContactRecord = { reference: string; receivedAt: string; email: string; whatsapp: string; owner?: string; preferredContactMethod?: string; preferredResponseLanguage?: string; buyerTimezone?: string; preferredContactWindow?: string; externalContacts?: ExternalContact[] };

function localDateTimeValue() {
  const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function whatsappHref(value: string) {
  const digits = value.replace(/\D/g, ""); return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : "";
}

export default function ExternalContactLog<T extends ContactRecord>({ record, token, onSaved }: { record: T; token: string; onSaved: (record: T) => void }) {
  const preferred = record.preferredContactMethod;
  const initialChannel = preferred === "whatsapp" ? "whatsapp" : preferred === "email" ? "email" : record.email ? "email" : record.whatsapp ? "whatsapp" : "other";
  const [channel, setChannel] = useState(initialChannel); const [direction, setDirection] = useState("outbound"); const [outcome, setOutcome] = useState("sent");
  const [occurredAt, setOccurredAt] = useState(""); const [summary, setSummary] = useState(""); const [actor, setActor] = useState(record.owner || "Beiqiang sales team");
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  const history = [...(record.externalContacts || [])].reverse(); const waHref = whatsappHref(record.whatsapp || "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("Saving append-only contact evidence…");
    try {
      const response = await fetch("/api/admin/external-contact", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ reference: record.reference, receivedAt: record.receivedAt, channel, direction, outcome, occurredAt: new Date(occurredAt).toISOString(), summary, actor }) });
      const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.message || "Contact evidence could not be saved.");
      onSaved(result.record); setSummary(""); setOccurredAt(localDateTimeValue()); setMessage(`Saved ${result.contact.id}. This records a manual statement, not channel delivery verification.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Contact evidence could not be saved."); }
    finally { setSaving(false); }
  }

  return <details className="admin-external-contact"><summary>External contact evidence ({history.length})</summary><div className="external-contact-context"><div><small>BUYER-PROVIDED PREFERENCE</small><strong>{preferred || "No channel preference"}{record.preferredResponseLanguage ? ` · ${record.preferredResponseLanguage}` : ""}</strong><span>{[record.buyerTimezone, record.preferredContactWindow].filter(Boolean).join(" · ") || "No time-zone preference recorded"}</span></div><nav>{record.email && <a href={`mailto:${record.email}`}>Open email</a>}{waHref && <a href={waHref} target="_blank" rel="noreferrer">Open WhatsApp</a>}</nav></div><form onSubmit={submit}><div><label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="alibaba">Alibaba</option><option value="phone">Phone</option><option value="video_call">Video call</option><option value="other">Other verified channel</option></select></label><label>Direction<select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="outbound">Beiqiang → buyer</option><option value="inbound">Buyer → Beiqiang</option></select></label><label>Outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option value="sent">Sent / completed</option><option value="replied">Reply received</option><option value="no_answer">No answer</option><option value="meeting_scheduled">Meeting scheduled</option><option value="information_requested">Information requested</option><option value="other">Other documented outcome</option></select></label><label>Actual date and time<input required type="datetime-local" value={occurredAt} min={record.receivedAt.slice(0, 16)} onChange={(event) => setOccurredAt(event.target.value)} /></label><label>Responsible salesperson<input required minLength={2} maxLength={100} value={actor} onChange={(event) => setActor(event.target.value)} /></label></div><label>Evidence summary<textarea required minLength={2} maxLength={800} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What was actually sent, received or agreed? Do not paste passwords, payment data or unsupported claims." /></label><button className="button button-small" type="submit" disabled={saving || !occurredAt}>{saving ? "Saving…" : "Append contact evidence"}</button><p aria-live="polite">{message}</p></form>{history.length ? <ol className="external-contact-history">{history.map((item) => <li key={item.id}><div><strong>{item.channel.replaceAll("_", " ")} · {item.direction}</strong><time>{new Date(item.occurredAt).toLocaleString()}</time></div><p>{item.summary}</p><small>{item.outcome.replaceAll("_", " ")} · recorded by {item.actor} at {new Date(item.recordedAt).toLocaleString()}</small></li>)}</ol> : <p>No external-channel evidence recorded for this inquiry.</p>}<small className="external-contact-boundary">This is a salesperson-recorded audit note. It does not prove delivery, email open, buyer identity, agreement, payment or an order. Website messages remain separately system-timestamped.</small></details>;
}
