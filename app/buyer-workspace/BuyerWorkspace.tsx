"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ActionKind = "buyer_action" | "beiqiang_review" | "formal_order" | "closed";
type Project = { reference: string; receivedAt: string; updatedAt: string; status: { code: string; label: string; step: number }; styleCodes: string[]; styleLabel: string; quantity: string; destination: string; buyerUpdate: string; action: { kind: ActionKind; eyebrow: string; title: string; summary: string; label: string; anchor: string; rank: number }; hasIssuedQuotation: boolean; hasOrder: boolean; hasOpenRepeatProject: boolean };

export default function BuyerWorkspace() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState("Enter the exact email used for your Beiqiang sourcing request.");
  const [sending, setSending] = useState(false); const [loading, setLoading] = useState(false); const [projects, setProjects] = useState<Project[] | null>(null);
  const [filter, setFilter] = useState<"all" | ActionKind>("all"); const [query, setQuery] = useState("");
  const filteredProjects = useMemo(() => (projects || []).filter((project) => filter === "all" || project.action.kind === filter).filter((project) => !query.trim() || [project.reference, project.styleLabel, project.styleCodes.join(" "), project.status.label, project.action.title].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [projects, filter, query]);
  const counts = useMemo(() => ({ all: projects?.length || 0, buyer_action: projects?.filter((project) => project.action.kind === "buyer_action").length || 0, beiqiang_review: projects?.filter((project) => project.action.kind === "beiqiang_review").length || 0, formal_order: projects?.filter((project) => project.action.kind === "formal_order").length || 0, closed: projects?.filter((project) => project.action.kind === "closed").length || 0 }), [projects]);

  async function loadProjects(sessionToken: string) {
    setLoading(true); setMessage("Loading your buyer workspace…");
    try {
      const response = await fetch("/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` }, cache: "no-store" });
      const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.message || "The buyer workspace could not be loaded.");
      setProjects(result.projects || []); setMessage(`Secure workspace loaded · ${result.projects?.length || 0} project${result.projects?.length === 1 ? "" : "s"}.`);
    } catch (error) { sessionStorage.removeItem("beiqiang_buyer_workspace_session"); setProjects(null); setMessage(error instanceof Error ? error.message : "The buyer workspace could not be loaded."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const token = params.get("token"); const savedSession = sessionStorage.getItem("beiqiang_buyer_workspace_session") || "";
    if (!token) { if (savedSession) { const timer = window.setTimeout(() => void loadProjects(savedSession), 0); return () => window.clearTimeout(timer); } return; }
    window.history.replaceState({}, "", "/buyer-workspace/");
    void (async () => {
      setLoading(true); setMessage("Verifying your one-time workspace link…");
      try {
        const response = await fetch("/api/buyer-workspace-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        const result = await response.json().catch(() => ({})); if (!response.ok || !result.ok) throw new Error(result.message || "This workspace link is invalid or expired.");
        sessionStorage.setItem("beiqiang_buyer_workspace_session", result.sessionToken); await loadProjects(result.sessionToken);
      } catch (error) { setProjects(null); setMessage(error instanceof Error ? error.message : "This workspace link is invalid or expired."); setLoading(false); }
    })();
  // The workspace intentionally redeems the URL token once on first render.
  }, []);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setSending(true); setMessage("Preparing a secure link…");
    try { const response = await fetch("/api/buyer-workspace-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const result = await response.json().catch(() => ({})); setMessage(result.message || "If the email matches a record, a secure link will arrive shortly."); setEmail(""); }
    catch { setMessage("If the email matches a record, a secure link will arrive shortly. Contact Beiqiang if it does not arrive."); }
    finally { setSending(false); }
  }

  function signOut() { sessionStorage.removeItem("beiqiang_buyer_workspace_session"); setProjects(null); setFilter("all"); setQuery(""); setMessage("Workspace closed on this browser. Request a new secure link when needed."); }

  return <>
    <section className="workspace-hero"><div><p className="eyebrow eyebrow-light">SECURE BUYER WORKSPACE</p><h1>One view for every sourcing project.</h1><p>Use the business email submitted with your inquiries to review project references, current stages and next actions. No password account is created.</p><div className="workspace-boundaries"><span>15-minute one-time email link</span><span>8-hour browser session</span><span>Private code still required for decisions</span></div></div><form onSubmit={requestLink}><h2>Email me a secure link</h2><label>Business email<input type="email" required autoComplete="email" maxLength={180} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="buyer@company.com" /></label><button className="button" disabled={sending}>{sending ? "Sending…" : "Send secure workspace link"}</button><small>For privacy, the response is the same whether or not an email exists in our records.</small></form></section>
    <section className="workspace-content" aria-live="polite"><div className="workspace-content-heading"><div><p className="eyebrow">YOUR SOURCING RECORDS</p><h2>{projects ? "Projects associated with your email" : "Continue securely from your email"}</h2></div>{projects ? <button className="text-button" type="button" onClick={signOut}>Close workspace</button> : <Link href="/inquiry-status/">Open one project with reference + code →</Link>}</div><p className="workspace-message">{loading ? "● " : ""}{message}</p>
      {projects ? <><div className="workspace-action-summary" aria-label="Project action summary"><button className={filter === "all" ? "active" : ""} type="button" onClick={() => setFilter("all")}><strong>{counts.all}</strong><span>All projects</span></button><button className={filter === "buyer_action" ? "active" : ""} type="button" onClick={() => setFilter("buyer_action")}><strong>{counts.buyer_action}</strong><span>Your action</span></button><button className={filter === "beiqiang_review" ? "active" : ""} type="button" onClick={() => setFilter("beiqiang_review")}><strong>{counts.beiqiang_review}</strong><span>Beiqiang review</span></button><button className={filter === "formal_order" ? "active" : ""} type="button" onClick={() => setFilter("formal_order")}><strong>{counts.formal_order}</strong><span>Formal orders</span></button><button className={filter === "closed" ? "active" : ""} type="button" onClick={() => setFilter("closed")}><strong>{counts.closed}</strong><span>Closed</span></button></div><label className="workspace-search"><span>Find a project</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reference, style code, stage or action" /></label><div className="workspace-results-note">Showing {filteredProjects.length} of {projects.length} projects · buyer decisions appear first.</div><div className="workspace-projects">{filteredProjects.length ? filteredProjects.map((project) => <article key={project.reference} className={`workspace-project workspace-project-${project.action.kind}`}><div className="workspace-project-top"><div><small>{project.reference}</small><h3>{project.styleCodes.join(" · ") || project.styleLabel}</h3></div><span className={`workspace-status workspace-status-${project.status.code}`}>{project.status.label}</span></div><section className={`workspace-action workspace-action-${project.action.kind}`}><p>{project.action.eyebrow}</p><h4>{project.action.title}</h4><span>{project.action.summary}</span></section><dl><div><dt>Indicative quantity</dt><dd>{project.quantity}</dd></div><div><dt>Destination</dt><dd>{project.destination}</dd></div><div><dt>Last updated</dt><dd>{new Date(project.updatedAt).toLocaleDateString()}</dd></div></dl><p><strong>Latest buyer-safe update</strong>{project.buyerUpdate}</p><div className="workspace-flags">{project.hasIssuedQuotation && <span>Quotation activity</span>}{project.hasOrder && <span>Formal order recorded</span>}{project.hasOpenRepeatProject && <span>Next project active</span>}</div><Link className="button button-secondary" href={`/inquiry-status/?reference=${encodeURIComponent(project.reference)}`}>{project.action.label}</Link><small>Enter this project&apos;s private access code to view supporting details or submit a decision.</small></article>) : <div className="workspace-empty"><h3>No projects match this view.</h3><p>Change the action filter or search term. Contact Beiqiang only if a known project is still missing.</p></div>}</div></> : <div className="workspace-explanation"><article><span>01</span><h3>Request</h3><p>Enter the exact email used on your website sourcing request.</p></article><article><span>02</span><h3>Verify</h3><p>Open the one-time link sent to that mailbox within 15 minutes.</p></article><article><span>03</span><h3>Review</h3><p>Compare all references and open the correct project with its private code.</p></article></div>}
      <div className="workspace-security"><strong>Commercial and security boundary</strong><p>This workspace is a buyer-safe project index. It is not proof of identity for payment, a purchase order, a quotation acceptance, stock confirmation or production authorization. Verify formal terms in Alibaba Trade Assurance or the signed contract.</p></div>
    </section>
  </>;
}
