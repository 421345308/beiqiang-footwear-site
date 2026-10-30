"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./operations.module.css";

type Fields = { internal_note: string; next_action: string; handling_status: "open" | "handled" };
type Handling = Fields & { version: number; updated_at?: string; effective_status?: string; pending?: boolean };
type Proposal = { id: string; fields: Fields; created_at: string; generated_by_ai: false; decision: { decision: string; reviewed_at: string } | null };
type Item = { reference: string; name: string; company: string; country: string; styleCode: string; quantity: string; receivedAt?: string; updatedAt?: string; internalTest?: boolean; pending: boolean; source_hash: string; handling: Handling };
type Detail = { inquiry: Item & { email?: string; requirements?: string; whatsapp?: string; status?: string; messages?: Array<Record<string, string>>; attachments?: Array<Record<string, string | number>> }; handling: Handling; proposals: Proposal[]; source_hash: string; updated_at: string };
type Listing = { items: Item[]; total: number; pending_total: number; pagecursor: string | null; updated_at: string };
type Request = <T>(path: string, body?: object) => Promise<T>;
const when = (value?: string) => value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "未记录";
const empty: Fields = { internal_note: "", next_action: "", handling_status: "open" };
const labels: Record<keyof Fields, string> = { internal_note: "内部处理意见", next_action: "下一动作", handling_status: "待办状态" };
const textValue = (key: keyof Fields, value: string) => key === "handling_status" ? value === "handled" ? "本次已处理" : "待处理" : value || "（未填写）";

export default function InquiryOperations({ request }: { request: Request }) {
  const [view, setView] = useState<"pending" | "all">("pending");
  const [includeTests, setIncludeTests] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reference, setReference] = useState("");
  const [fields, setFields] = useState<Fields>(empty);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const mounted = useRef(true);
  const listSequence = useRef(0);
  const detailSequence = useRef(0);
  const loadingList = useRef(false);
  const expandedList = useRef(false);

  const refresh = useCallback(async (cursor?: string) => {
    const sequence = ++listSequence.current;
    loadingList.current = true;
    try {
      const result = await request<Listing>(`/api/operations?view=${view}&include_tests=${includeTests ? "1" : "0"}&limit=30${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      if (!mounted.current || sequence !== listSequence.current) return;
      expandedList.current = Boolean(cursor);
      setListing(previous => cursor && previous ? { ...result, items: [...new Map([...previous.items, ...result.items].map(item => [item.reference, item])).values()] } : result);
      setRefreshError("");
    } catch (error) {
      if (mounted.current && sequence === listSequence.current) setRefreshError(error instanceof Error ? error.message : "询盘读取失败。");
    } finally {
      if (sequence === listSequence.current) { loadingList.current = false; if (mounted.current) setLoading(false); }
    }
  }, [request, view, includeTests]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !loadingList.current && !expandedList.current) void refresh();
    }, 30000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  const open = async (id: string) => {
    const sequence = ++detailSequence.current;
    setReference(id); setDetail(null); setProposal(null); setNotice(""); setBusy(true);
    try {
      const result = await request<Detail>(`/api/operations?reference=${encodeURIComponent(id)}`);
      if (!mounted.current || sequence !== detailSequence.current) return;
      setDetail(result);
      setFields({ internal_note: result.handling.internal_note, next_action: result.handling.next_action, handling_status: result.handling.pending ? "open" : result.handling.handling_status });
    } catch (error) { if (mounted.current && sequence === detailSequence.current) setNotice(error instanceof Error ? error.message : "读取失败。"); }
    finally { if (mounted.current && sequence === detailSequence.current) setBusy(false); }
  };
  const prepare = async () => {
    if (!detail) return;
    setBusy(true); setNotice("");
    try {
      const result = await request<{ proposal: Proposal }>("/api/operations", { action: "prepare", reference, source_hash: detail.source_hash, expected_version: detail.handling.version, fields, method: "manual" });
      if (mounted.current) { setProposal(result.proposal); setNotice("处理方案已保存，请核对差异后采纳。尚未更新处理记录。"); }
    } catch (error) { if (mounted.current) setNotice(error instanceof Error ? error.message : "保存方案失败。"); }
    finally { if (mounted.current) setBusy(false); }
  };
  const review = async (decision: "accept" | "reject") => {
    if (!proposal) return;
    setBusy(true); setNotice("");
    try {
      await request("/api/operations", { action: "review", reference, proposal_id: proposal.id, decision });
      await open(reference); await refresh();
      if (mounted.current) setNotice(decision === "accept" ? "已采纳，处理记录已保存到这条询盘。没有发送客户邮件。" : "未采纳，方案保留在审阅记录中。");
    } catch (error) { if (mounted.current) setNotice(error instanceof Error ? error.message : "审阅失败。"); }
    finally { if (mounted.current) setBusy(false); }
  };
  const newer = detail && listing?.items.find(item => item.reference === reference)?.source_hash;
  const changed = newer && newer !== detail?.source_hash && Date.parse(listing!.updated_at) > Date.parse(detail!.updated_at);

  return <section className={s.root} aria-labelledby="inquiry-operations-title">
    <div className={s.heading}><div><span className={s.kicker}>直接连接网站原记录</span><h1 id="inquiry-operations-title">网站询盘</h1><p>从客户需求开始，把处理意见和下一动作留在同一条询盘中。</p></div><button onClick={() => void refresh()} disabled={loading}>刷新网站询盘</button></div>
    <div className={s.summary}><strong>{listing ? listing.pending_total : "—"}<small>条待处理</small></strong><span>首屏每 30 秒读取，展开更多时暂停自动刷新 · 最近成功：{listing ? when(listing.updated_at) : "尚未读取"}</span></div>
    {refreshError && <p className={s.error} role="alert">{refreshError} {listing && "当前保留上次成功读取的内容。"}</p>}
    <label className={s.help}><input type="checkbox" checked={includeTests} onChange={event => { setLoading(true); setListing(null); setIncludeTests(event.target.checked); }}/> 显示内部测试记录</label>
    <div className={s.layout}>
      <section className={s.list} aria-label="询盘列表"><div className={s.filters}><button aria-pressed={view === "pending"} onClick={() => { if (view !== "pending") { setLoading(true); setListing(null); setView("pending"); } }}>待处理</button><button aria-pressed={view === "all"} onClick={() => { if (view !== "all") { setLoading(true); setListing(null); setView("all"); } }}>全部询盘</button></div>
        {loading && !listing && <p className={s.empty}>正在读取网站询盘…</p>}
        {listing && !listing.items.length && <p className={s.empty}>{view === "pending" ? "目前没有待处理询盘。已处理记录可在“全部询盘”查看。" : "网站还没有询盘记录。"}</p>}
        {listing?.items.map(item => <button key={item.reference} className={`${s.item} ${reference === item.reference ? s.selected : ""}`} disabled={busy} onClick={() => void open(item.reference)}><div className={s.row}><strong>{item.company || item.name || "未填写公司"}</strong><span>{item.pending ? "待处理" : "本次已处理"}</span></div><span>{item.country || "市场待了解"} · {item.styleCode || "选款待了解"}{item.internalTest && " · 内部测试"}</span><p>{item.handling.next_action || "尚未记录下一动作"}</p><small>{item.reference} · {when(item.receivedAt)}</small></button>)}
        {listing && <div className={s.pagination}>已显示 {listing.items.length} / {listing.total} 条{listing.pagecursor && <button onClick={() => void refresh(listing.pagecursor!)}>加载更多</button>}</div>}
      </section>
      <section className={s.detail} aria-label="询盘处理">
        {!reference && <div className={s.empty}><h2>选择一条询盘</h2><p>在这里查看原需求、整理处理意见、核对方案并保存。</p></div>}
        {reference && !detail && <p className={s.empty}>{busy ? "正在读取询盘…" : "询盘读取未完成。"}</p>}
        {notice && <p className={s.notice} role="status">{notice}</p>}
        {detail && <>
          <div className={s.heading}><div><span className={s.kicker}>{reference}</span><h2>{detail.inquiry.company || detail.inquiry.name || "网站询盘"}</h2></div><button disabled={busy} onClick={() => void open(reference)}>重新读取详情</button></div>
          {changed && <p className={s.error}>网站原记录已有变化。请先重新读取详情，再核对并提交处理方案。</p>}
          <dl className={s.facts}><div><dt>联系人</dt><dd>{detail.inquiry.name || "未填写"}</dd></div><div><dt>邮箱</dt><dd>{detail.inquiry.email || "未填写"}</dd></div><div><dt>市场</dt><dd>{detail.inquiry.country || "未填写"}</dd></div><div><dt>款号 / 数量</dt><dd>{detail.inquiry.styleCode || "待了解"} / {detail.inquiry.quantity || "待了解"}</dd></div></dl>
          <h3>客户原需求</h3><p className={s.original}>{detail.inquiry.requirements || "未填写文字需求，请结合选款及往来了解。"}</p>
          {!!detail.inquiry.messages?.length && <details className={s.messages}><summary>查看往来记录（{detail.inquiry.messages.length}）</summary>{detail.inquiry.messages.map((message, index) => <article key={message.id || index}><small>{message.author || message.sender || message.role || "记录"} · {when(message.createdAt || message.at || message.sentAt)}</small><p>{message.text || message.message || message.body || message.content || "（没有文字）"}</p></article>)}</details>}
          {!!detail.inquiry.attachments?.length && <p className={s.help}>原询盘含 {detail.inquiry.attachments.length} 个附件。本页暂显示文字需求，附件下载仍沿原网站流程。</p>}
          <hr/><h3>整理处理意见</h3><p className={s.help}>这些是内部经营记录；“本次已处理”不代表已发信或已成交。原需求出现新变化后会重新进入待办。</p>
          <form onSubmit={event => { event.preventDefault(); void prepare(); }} className={s.form}>
            <label htmlFor="ops-note">内部处理意见</label><textarea id="ops-note" value={fields.internal_note} maxLength={6000} rows={4} disabled={busy} onChange={event => { setFields({ ...fields, internal_note: event.target.value }); setProposal(null); }} placeholder="已确认什么、仍缺什么，以及本次判断…"/>
            <label htmlFor="ops-next">下一动作</label><textarea id="ops-next" value={fields.next_action} maxLength={2000} rows={2} disabled={busy} onChange={event => { setFields({ ...fields, next_action: event.target.value }); setProposal(null); }} placeholder="留下一个具体、可接续的动作…"/>
            <label htmlFor="ops-status">待办状态</label><select id="ops-status" value={fields.handling_status} disabled={busy} onChange={event => { setFields({ ...fields, handling_status: event.target.value as Fields["handling_status"] }); setProposal(null); }}><option value="open">待处理</option><option value="handled">本次已处理</option></select>
            <button className={s.primary} disabled={busy || !!changed}>预览处理方案</button>
          </form>
          {proposal && !proposal.decision && <section className={s.proposal} aria-label="处理方案预览"><h3>核对处理方案</h3><p className={s.help}>依据当前询盘及你填写的内容保存，未调用 AI，也未发送给客户。</p>{(Object.keys(labels) as Array<keyof Fields>).map(key => <div className={s.diff} key={key}><h4>{labels[key]}</h4><div><span>当前记录</span><p>{textValue(key, detail.handling[key])}</p></div><div><span>采纳后</span><p>{textValue(key, proposal.fields[key])}</p></div></div>)}<div className={s.actions}><button className={s.primary} disabled={busy || !!changed} onClick={() => void review("accept")}>采纳并保存处理记录</button><button disabled={busy} onClick={() => void review("reject")}>不采纳</button></div></section>}
          {!!detail.proposals?.length && <details className={s.history}><summary>方案与审阅记录（{detail.proposals.length}）</summary>{detail.proposals.map(item => <div key={item.id}><span>{when(item.created_at)} · {item.decision?.decision === "accept" ? "已采纳" : item.decision ? "未采纳" : "待审阅"}</span><p>{item.fields.next_action || item.fields.internal_note || "状态调整"}</p>{!item.decision && <button disabled={busy} onClick={() => setProposal(item)}>查看此方案</button>}</div>)}</details>}
        </>}
      </section>
    </div>
  </section>;
}
