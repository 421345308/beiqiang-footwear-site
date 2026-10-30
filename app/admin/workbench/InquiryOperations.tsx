"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./operations.module.css";
import type { DispatchReadiness } from "./ExecutionReadiness";

type Fields = { internal_note: string; next_action: string; handling_status: "open" | "handled" };
type Handling = Fields & { version: number; updated_at?: string; effective_status?: string; pending?: boolean };
type Proposal = { id: string; fields: Fields; created_at: string; generated_by_ai: boolean; source_hash?: string; handling_version?: number; stale?: boolean; method?: string; summary?: string; model?: string; run_id?: string; decision: { decision: string; reviewed_at: string } | null };
type Item = { reference: string; name: string; company: string; country: string; styleCode: string; quantity: string; receivedAt?: string; updatedAt?: string; internalTest?: boolean; pending: boolean; source_hash: string; handling: Handling };
type AgentRun = { id: string; status: string; model?: string; summary?: string; error?: string; created_at?: string; updated_at?: string; source_hash?: string; handling_version?: number; stale?: boolean };
type Draft = { fields: Fields; sourceHash: string; version: number };
const runLabels: Record<string, string> = { queued: "排队等候", running: "正在分析", awaiting_review: "待审阅", accepted: "已采纳", rejected: "未采纳", failed: "运行失败", interrupted: "运行中断", cancelled: "已取消" };
type Detail = { inquiry: Item & { email?: string; requirements?: string; whatsapp?: string; status?: string; messages?: Array<Record<string, string>>; attachments?: Array<Record<string, string | number>> }; handling: Handling; proposals: Proposal[]; agent_runs?: AgentRun[]; source_hash: string; updated_at: string };
type Listing = { items: Item[]; total: number; pending_total: number; pagecursor: string | null; updated_at: string };
type Request = <T>(path: string, body?: object) => Promise<T>;
const when = (value?: string) => value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "未记录";
const empty: Fields = { internal_note: "", next_action: "", handling_status: "open" };
const labels: Record<keyof Fields, string> = { internal_note: "内部处理意见", next_action: "下一动作", handling_status: "待办状态" };
const textValue = (key: keyof Fields, value: string) => key === "handling_status" ? value === "handled" ? "本次已处理" : "待处理" : value || "（未填写）";

export default function InquiryOperations({ request, cloudInstruction, active = true, requestedReference, requestKey = 0, execution }: { request: Request; cloudInstruction: (id: string) => string; active?: boolean; requestedReference?: string; requestKey?: number; execution?: DispatchReadiness }) {
  const manualCloud = !execution || execution.mode === "manual_cloud";
  const autoReady = execution?.mode === "self_hosted" && execution.enabled && execution.ready;
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
  const [instruction, setInstruction] = useState("");
  const [cloudText, setCloudText] = useState("");
  const [detailError, setDetailError] = useState("");
  const [draftState, setDraftState] = useState<Map<string, Draft>>(() => new Map());
  const drafts = useRef(new Map<string, Draft>());
  const selectedReference = useRef("");
  const actionLock = useRef(false);
  const refreshingDetail = useRef(false);
  const proposalPanel = useRef<HTMLElement>(null);
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
    if (!active) return;
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const timer = window.setInterval(() => {
      if (active && document.visibilityState === "visible" && !loadingList.current && !expandedList.current) void refresh();
    }, 30000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh, active]);

  const readDetail = useCallback(async (id: string) => {
    const sequence = ++detailSequence.current;
    try {
      const result = await request<Detail>(`/api/operations?reference=${encodeURIComponent(id)}`);
      if (!mounted.current || sequence !== detailSequence.current || selectedReference.current !== id) return;
      setDetail(result); setDetailError("");
      const draft = drafts.current.get(id);
      setFields(draft?.fields || { internal_note: result.handling.internal_note, next_action: result.handling.next_action, handling_status: result.handling.pending ? "open" : result.handling.handling_status });
      setProposal(previous => previous ? result.proposals.find(p => p.id === previous.id) || null : null);
    } catch (error) {
      if (mounted.current && sequence === detailSequence.current) setDetailError(error instanceof Error ? error.message : "读取失败，保留上次内容。");
      throw error;
    }
  }, [request]);
  const open = async (id: string) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true);
    if (selectedReference.current !== id) { setDetail(null); setProposal(null); setCloudText(""); setInstruction(""); }
    selectedReference.current = id; setReference(id); setNotice("");
    try { await readDetail(id); } catch {} finally { actionLock.current = false; if (mounted.current) setBusy(false); }
  };
  useEffect(() => {
    if (requestedReference) void open(requestedReference);
    // Navigation to a run preserves drafts and opens the same inquiry object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedReference, requestKey]);
  useEffect(() => {
    if (!active || !reference) return;
    const refreshDetail = async () => {
      if (document.visibilityState !== "visible" || actionLock.current || refreshingDetail.current) return;
      refreshingDetail.current = true;
      try { await readDetail(reference); } catch {} finally { refreshingDetail.current = false; }
    };
    const timer = window.setInterval(() => { void refreshDetail(); }, 5000);
    const onVisible = () => { if (document.visibilityState === "visible") void refreshDetail(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [reference, active, readDetail]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (drafts.current.size) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  const edit = (next: Fields) => {
    if (!detail) return;
    const prior = drafts.current.get(reference);
    drafts.current.set(reference, { fields: next, sourceHash: prior?.sourceHash || detail.source_hash, version: prior?.version ?? detail.handling.version });
    setDraftState(new Map(drafts.current)); setFields(next); setProposal(null);
  };
  const enqueueAgent = async () => {
    if (!detail || actionLock.current) return;
    actionLock.current = true; setBusy(true); setNotice("");
    try {
      const result = await request<{run: AgentRun}>("/api/operations", {action: "enqueue_agent", reference, source_hash: detail.source_hash, expected_version: detail.handling.version, instruction});
      setDetail(previous => previous ? {...previous, agent_runs: [result.run, ...(previous.agent_runs || []).filter(r => r.id !== result.run.id)]} : previous);
      setNotice(manualCloud ? "已提交Agent任务。需要启动时，复制云端指令，到官方 Codex Cloud 选择“贝强经营工作台”环境执行。最新进展请看下方实时状态。" : "已提交Agent任务。最新领取、运行与结果请看下方实时状态。");
    } catch (error) { setNotice(error instanceof Error ? error.message : "排队失败，请刷新状态后核实。"); }
    finally { actionLock.current = false; if (mounted.current) setBusy(false); }
  };
  const cancelRun = async (id: string) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setNotice("");
    try { await request("/api/workbench", {action: "cancel", run_id: id}); setNotice("已取消，记录保留。旧执行器不能提交结果。"); await readDetail(reference); }
    catch (error) { setNotice(error instanceof Error ? error.message : "未确认取消，请刷新核实。"); }
    finally { actionLock.current = false; if (mounted.current) setBusy(false); }
  };
  const copyCloud = async (id: string) => {
    try {
      const content = cloudInstruction(id);
      try { await navigator.clipboard.writeText(content); setCloudText(""); setNotice("已复制云端执行指令；复制操作不会启动任务。需要启动时请到官方 Cloud 粘贴执行，最新进展请看下方实时状态。"); }
      catch { setCloudText(content); setNotice("浏览器未允许自动复制，已在下方显示完整指令供手动复制。最新进展请看下方实时状态。"); }
    } catch (error) { setNotice(error instanceof Error ? error.message : "生成指令失败。"); }
  };
  const previewProposal = (item: Proposal) => {
    setProposal(item);
    window.requestAnimationFrame(() => proposalPanel.current?.scrollIntoView({behavior: "smooth", block: "start"}));
  };
  const prepare = async () => {
    if (!detail || actionLock.current) return;
    actionLock.current = true; setBusy(true); setNotice("");
    try {
      const result = await request<{ proposal: Proposal }>("/api/operations", { action: "prepare", reference, source_hash: detail.source_hash, expected_version: detail.handling.version, fields, method: "manual" });
      if (mounted.current) { previewProposal(result.proposal); setNotice("处理方案已保存，请核对差异后采纳。尚未更新处理记录。"); }
    } catch (error) { if (mounted.current) setNotice(error instanceof Error ? error.message : "保存方案失败。"); }
    finally { actionLock.current = false; if (mounted.current) setBusy(false); }
  };
  const review = async (decision: "accept" | "reject") => {
    if (!proposal || actionLock.current) return;
    actionLock.current = true; setBusy(true); setNotice("");
    try {
      await request("/api/operations", { action: "review", reference, proposal_id: proposal.id, decision });
      if (decision === "accept" && JSON.stringify(drafts.current.get(reference)?.fields) === JSON.stringify(proposal.fields)) {
        drafts.current.delete(reference); setDraftState(new Map(drafts.current));
      }
      try { await readDetail(reference); await refresh(); } catch { setDetailError("审阅已保存，但刷新失败。请重新读取核实最新记录。"); }
      if (mounted.current) setNotice(decision === "accept" ? "已采纳，处理记录已保存到这条询盘。没有发送客户邮件。" : "未采纳，方案保留在审阅记录中。");
    } catch (error) { if (mounted.current) setNotice(error instanceof Error ? error.message : "审阅失败。"); }
    finally { actionLock.current = false; if (mounted.current) setBusy(false); }
  };
  const newer = detail && listing?.items.find(item => item.reference === reference)?.source_hash;
  const draft = draftState.get(reference);
  const sourceChanged = !!(newer && newer !== detail?.source_hash && Date.parse(listing!.updated_at) > Date.parse(detail!.updated_at));
  const draftStale = !!(draft && detail && (draft.sourceHash !== detail.source_hash || draft.version !== detail.handling.version));
  const changed = sourceChanged || draftStale;
  const proposalStale = !!(proposal && detail && (proposal.stale || (proposal.source_hash && proposal.source_hash !== detail.source_hash) || (proposal.handling_version !== undefined && proposal.handling_version !== detail.handling.version)));
  const activeRuns = detail?.agent_runs?.filter(run => ["queued", "running"].includes(run.status)) || [];

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
        {detailError && <p className={s.error} role="alert">{detailError} <button disabled={busy} onClick={() => void open(reference)}>重新读取</button></p>}
        {notice && <p className={s.notice} role="status">{notice}</p>}
        {detail && <>
          <div className={s.heading}><div><span className={s.kicker}>{reference}</span><h2>{detail.inquiry.company || detail.inquiry.name || "网站询盘"}</h2></div><button disabled={busy} onClick={() => void open(reference)}>重新读取详情</button></div>
          {sourceChanged && <p className={s.error}>网站原记录已有变化。请先重新读取详情，再核对方案。</p>}
          {draft && <p className={draftStale ? s.error : s.help}>人工编辑已保留在本页，切换询盘和刷新状态不会覆盖。{draftStale && "来源或处理版本已变化，请先核对当前记录，重新整理人工编辑。"} <button disabled={busy} onClick={() => { drafts.current.delete(reference); setDraftState(new Map(drafts.current)); setFields({internal_note: detail.handling.internal_note, next_action: detail.handling.next_action, handling_status: detail.handling.pending ? "open" : detail.handling.handling_status}); }}>放弃保留的编辑，使用当前记录</button>{draftStale && <button disabled={busy} onClick={() => { drafts.current.set(reference, {fields, sourceHash: detail.source_hash, version: detail.handling.version}); setDraftState(new Map(drafts.current)); setProposal(null); }}>已核对当前记录，保留文字继续编辑</button>}</p>}
          <dl className={s.facts}><div><dt>联系人</dt><dd>{detail.inquiry.name || "未填写"}</dd></div><div><dt>邮箱</dt><dd>{detail.inquiry.email || "未填写"}</dd></div><div><dt>市场</dt><dd>{detail.inquiry.country || "未填写"}</dd></div><div><dt>款号 / 数量</dt><dd>{detail.inquiry.styleCode || "待了解"} / {detail.inquiry.quantity || "待了解"}</dd></div></dl>
          <h3>客户原需求</h3><p className={s.original}>{detail.inquiry.requirements || "未填写文字需求，请结合选款及往来了解。"}</p>
          {!!detail.inquiry.messages?.length && <details className={s.messages}><summary>查看往来记录（{detail.inquiry.messages.length}）</summary>{detail.inquiry.messages.map((message, index) => <article key={message.id || index}><small>{message.author || message.sender || message.role || "记录"} · {when(message.createdAt || message.at || message.sentAt)}</small><p>{message.text || message.message || message.body || message.content || "（没有文字）"}</p></article>)}</details>}
          {!!detail.inquiry.attachments?.length && <p className={s.help}>原询盘含 {detail.inquiry.attachments.length} 个附件。本页暂显示文字需求，附件下载仍沿原网站流程。</p>}
          <hr/><section className={s.agent} aria-label="Agent处理方案"><h3>让Agent准备方案</h3><p className={s.help}>Agent根据这条询盘及当前处理版本分析，只生成内部方案；你审阅采纳后才保存，不自动发信。人工输入另行保留，不会随状态刷新被覆盖。</p>
            <label htmlFor="ops-instruction">本次补充要求（可选）</label><textarea id="ops-instruction" value={instruction} maxLength={4000} rows={2} disabled={busy} onChange={event => setInstruction(event.target.value)} placeholder="例如：先列出需要确认的供货条件和下一步…"/>
            <button className={s.primary} disabled={busy || sourceChanged || activeRuns.length > 0} onClick={() => void enqueueAgent()}>让Agent准备方案</button>
            <p className={s.help}>{manualCloud ? "排队不等于开始；当前通过复制指令人工启动官方 Cloud。" : autoReady ? "自动领取已就绪；排队不等于开始，以执行器实际领取为准。" : "自动领取尚未就绪；任务会保存排队，当前限制见任务执行页。"}运行状态每5秒更新，返回页面时也会重新核实。</p>
            {(detail.agent_runs || []).map(run => <article className={s.agentRun} key={run.id}><div className={s.row}><strong>{runLabels[run.status] || run.status}</strong><span>{run.model || "gpt-6.1-sol"}</span></div><small>运行 {run.id} · {when(run.updated_at || run.created_at)}</small>
              {run.status === "queued" && <p>{manualCloud ? "尚未开始。请复制指令后到官方 Cloud 启动。" : autoReady ? "排队等候执行器自动领取，尚未开始。" : "已保存排队，等待执行条件就绪。"}</p>}{run.status === "running" && <p>已被执行器领取，正在分析；等待正式结果回传。</p>}
              {run.summary && <p>{run.summary}</p>}{run.error && <p className={s.error}>{run.error}</p>}{["failed", "interrupted"].includes(run.status) && <p className={s.error}>本次未形成可采纳结果。请核实原因后重新准备，原处理记录保留。</p>}{run.stale && ["queued", "running", "awaiting_review"].includes(run.status) && <p className={s.error}>来源或处理版本已变化，此运行的旧方案不能直接采纳。</p>}
              <div className={s.actions}>{manualCloud && run.status === "queued" && <button disabled={busy} onClick={() => void copyCloud(run.id)}>复制云端执行指令</button>}{["queued", "running"].includes(run.status) && <button disabled={busy} onClick={() => void cancelRun(run.id)}>{run.status === "queued" ? "取消排队" : "停止本次运行"}</button>}{detail.proposals.some(p => p.id === run.id && !p.decision) && <button disabled={busy} onClick={() => { const item = detail.proposals.find(p => p.id === run.id); if (item) previewProposal(item); }}>查看Agent方案</button>}</div>
            </article>)}
            {cloudText && <label className={s.cloudCopy}>完整云端执行指令<textarea readOnly rows={10} value={cloudText} onFocus={event => event.target.select()}/><button onClick={() => setCloudText("")}>收起指令</button></label>}
          </section><hr/><h3>人工整理处理意见</h3><p className={s.help}>这些是内部经营记录；“本次已处理”不代表已发信或已成交。原需求出现新变化后会重新进入待办。</p>
          <form onSubmit={event => { event.preventDefault(); void prepare(); }} className={s.form}>
            <label htmlFor="ops-note">内部处理意见</label><textarea id="ops-note" value={fields.internal_note} maxLength={6000} rows={4} disabled={busy} onChange={event => { edit({ ...fields, internal_note: event.target.value }); }} placeholder="已确认什么、仍缺什么，以及本次判断…"/>
            <label htmlFor="ops-next">下一动作</label><textarea id="ops-next" value={fields.next_action} maxLength={2000} rows={2} disabled={busy} onChange={event => { edit({ ...fields, next_action: event.target.value }); }} placeholder="留下一个具体、可接续的动作…"/>
            <label htmlFor="ops-status">待办状态</label><select id="ops-status" value={fields.handling_status} disabled={busy} onChange={event => { edit({ ...fields, handling_status: event.target.value as Fields["handling_status"] }); }}><option value="open">待处理</option><option value="handled">本次已处理</option></select>
            <button className={s.primary} disabled={busy || !!changed}>预览处理方案</button>
          </form>
          {proposal && !proposal.decision && <section ref={proposalPanel} tabIndex={-1} className={s.proposal} aria-label="处理方案预览"><h3>核对处理方案</h3><p className={s.help}>{proposal.generated_by_ai ? `真实Agent方案 · ${proposal.model || "gpt-6.1-sol"} · 运行 ${proposal.run_id || proposal.id}` : "依据你填写的内容保存的人工方案，未调用AI。"} 未发送给客户。依据处理版本 {proposal.handling_version ?? "未记录"}，当前版本 {detail.handling.version}。<span title={proposal.source_hash}>来源标识 {proposal.source_hash?.slice(0, 12) || "未记录"}</span></p>{proposal.summary && <p className={s.original}>{proposal.summary}</p>}{proposalStale && <p className={s.error}>这份方案依据的询盘或处理版本已过期。请重新准备；旧方案可拒绝并保留记录。</p>}{(Object.keys(labels) as Array<keyof Fields>).map(key => <div className={s.diff} key={key}><h4>{labels[key]}</h4><div><span>当前记录</span><p>{textValue(key, detail.handling[key])}</p></div><div><span>采纳后</span><p>{textValue(key, proposal.fields[key])}</p></div></div>)}<div className={s.actions}><button className={s.primary} disabled={busy || sourceChanged || proposalStale} onClick={() => void review("accept")}>采纳并保存处理记录</button><button disabled={busy} onClick={() => void review("reject")}>不采纳</button></div></section>}
          {!!detail.proposals?.length && <details className={s.history}><summary>方案与审阅记录（{detail.proposals.length}）</summary>{detail.proposals.map(item => <div key={item.id}><span>{item.generated_by_ai ? "Agent方案" : "人工方案"} · {when(item.created_at)} · {item.decision?.decision === "accept" ? "已采纳" : item.decision ? "未采纳" : "待审阅"}</span><p>{item.fields.next_action || item.fields.internal_note || "状态调整"}</p>{!item.decision && <button disabled={busy} onClick={() => previewProposal(item)}>查看此方案</button>}</div>)}</details>}
        </>}
      </section>
    </div>
  </section>;
}
