"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Inquiry = {
  reference: string;
  receivedAt: string;
  status: string;
  notificationSent?: boolean;
  internalTest?: boolean;
  styleCode: string;
  styleLabel: string;
  name: string;
  company: string;
  buyerType: string;
  market: string;
  quantity: string;
  email: string;
  whatsapp: string;
  requirements: string;
  attribution?: { utmSource?: string; utmMedium?: string; utmCampaign?: string };
  page?: string;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function InquiryAdminPage() {
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<Inquiry[]>([]);
  const [status, setStatus] = useState("Enter the EdgeOne inquiry dashboard token to load records.");
  const [loading, setLoading] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const businessRecords = useMemo(() => records.filter((record) => !record.internalTest), [records]);
  const visibleRecords = showTests ? records : businessRecords;
  const notified = businessRecords.filter((record) => record.notificationSent).length;

  async function loadRecords(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("Loading inquiry records…");
    try {
      const response = await fetch("/api/admin/inquiries", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "Records could not be loaded.");
      setRecords(result.records || []);
      setStatus(`${(result.records || []).filter((record: Inquiry) => !record.internalTest).length} business inquiries loaded. Internal tests are excluded by default.`);
    } catch (error) {
      setRecords([]);
      setStatus(error instanceof Error ? error.message : "Records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const headers = ["Reference", "Received at", "Status", "Email notified", "Style", "Name", "Company", "Buyer type", "Market", "Quantity", "Email", "WhatsApp", "Requirements", "UTM source", "UTM medium", "UTM campaign", "Page"];
    const rows = visibleRecords.map((record) => [record.reference, record.receivedAt, record.status, record.notificationSent ? "Yes" : "No", record.styleCode, record.name, record.company, record.buyerType, record.market, record.quantity, record.email, record.whatsapp, record.requirements, record.attribution?.utmSource, record.attribution?.utmMedium, record.attribution?.utmCampaign, record.page]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `beiqiang-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-shell">
      <header className="admin-header"><div><p className="eyebrow">BEIQIANG INTERNAL</p><h1>Inquiry ledger</h1><p>Review website sourcing requests, confirm email notifications and export follow-up data.</p></div><Link className="text-link" href="/">Return to website <span aria-hidden="true">↗</span></Link></header>
      <section className="admin-access-card">
        <form onSubmit={loadRecords}><label>Dashboard access token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" required placeholder="Stored only in this page session" /></label><button className="button" type="submit" disabled={loading}>{loading ? "Loading…" : "Load inquiries"}</button></form>
        <p className="admin-status" aria-live="polite">{status}</p>
      </section>
      <section className="admin-metrics" aria-label="Inquiry summary"><article><small>BUSINESS INQUIRIES</small><strong>{businessRecords.length}</strong></article><article><small>EMAIL NOTIFIED</small><strong>{notified}</strong></article><article><small>INTERNAL TESTS</small><strong>{records.length - businessRecords.length}</strong></article><article><small>STYLE COUNT</small><strong>{new Set(businessRecords.map((record) => record.styleCode)).size}</strong></article></section>
      <section className="admin-ledger">
        <div className="admin-toolbar"><label><input type="checkbox" checked={showTests} onChange={(event) => setShowTests(event.target.checked)} /> Show internal tests</label><button type="button" className="button button-small" onClick={exportCsv} disabled={!visibleRecords.length}>Export CSV</button></div>
        <div className="admin-table-wrap"><table><thead><tr><th>Received</th><th>Reference / style</th><th>Buyer</th><th>Market / quantity</th><th>Reply channel</th><th>Source</th><th>Notification</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={record.reference}><td>{record.receivedAt ? new Date(record.receivedAt).toLocaleString() : "—"}</td><td><strong>{record.reference}</strong><small>{record.styleCode}</small></td><td><strong>{record.company}</strong><small>{record.name} · {record.buyerType}</small></td><td><strong>{record.market}</strong><small>{record.quantity}</small></td><td><strong>{record.email || record.whatsapp || "—"}</strong><small>{record.requirements || "No extra requirements"}</small></td><td><strong>{record.attribution?.utmSource || "Direct"}</strong><small>{record.attribution?.utmCampaign || record.page || "—"}</small></td><td><span className={record.notificationSent ? "status-pill status-ok" : "status-pill"}>{record.notificationSent ? "Sent" : "Not sent"}</span></td></tr>)}</tbody></table>{!visibleRecords.length && <p className="admin-empty">No records to display.</p>}</div>
      </section>
    </main>
  );
}
