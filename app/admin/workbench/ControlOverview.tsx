"use client";

import { useState } from "react";
import { quotaRemaining, windowDuration, visibleControl } from "./control-display";
import s from "./workbench.module.css";

export type OwnerControl = { id: string; version: number; focus: string; priorities: string; notes: string; updated_at: string | null };
type Channel = { id: "alibaba" | "website"; title: string; observed_at: string | null; period: string | null; source: string; summary: string; metrics: Array<{ label: string; value: string }>; limitations: string[] };
export type StatusSnapshot = { version: number; schema_version: 1; observed_at: string; channels: Channel[]; codex: { observed_at: string | null; source: string; windows: Array<{ label: string; used_percent: number; window_minutes: number; resets_at: string | null }>; reset_credits: number | null; available: boolean | null; limitations: string[] } };
const emptyControl: OwnerControl = { id: "owner", version: 0, focus: "", priorities: "", notes: "", updated_at: null };
const time = (value?: string | null) => value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "未读取";
function Limits({ values }: { values: string[] }) { return values.length ? <ul className={s.limitations}>{values.map((value, index) => <li key={index}>{value}</li>)}</ul> : null; }

export default function ControlOverview({ control, snapshot, runs, activeCount, request }: { control?: OwnerControl; snapshot?: StatusSnapshot | null; runs: Array<{ status: string }>; activeCount: number; request: <T>(path: string, body?: object) => Promise<T> }) {
  const [edited, setDraft] = useState(control || emptyControl);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const draft = visibleControl(edited, control, dirty, emptyControl);
  const changedElsewhere = !!control && control.version !== draft.version;
  function edit(field: "focus" | "priorities" | "notes", value: string) {
    setDirty(true); setMessage(""); setDraft({ ...draft, [field]: value });
  }
  async function save() {
    if (saving) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await request<{ control: OwnerControl; message?: string }>("/api/workbench", { action: "save_control", control: { focus: draft.focus, priorities: draft.priorities, notes: draft.notes }, expected_version: draft.version });
      setDraft(result.control); setDirty(false);
      setMessage(result.message || "执行要求已保存，后续新启动的任务会使用这些要求。");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存未完成，请保留输入后重试。"); }
    finally { setSaving(false); }
  }
  async function reload() {
    setSaving(true); setError("");
    try { const result = await request<{ control: OwnerControl }>("/api/workbench"); setDraft(result.control || emptyControl); setDirty(false); setMessage("已载入云端保存的要求。"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "读取未完成。"); }
    finally { setSaving(false); }
  }
  const codex = snapshot?.codex;
  return <section className={s.controlOverview} aria-label="经营总控">
    <div className={s.sectionHeading}><div><span className={s.eyebrow}>先把工作能力接通，再推进具体经营</span><h1>经营总控</h1></div><span className={s.subtle}>资料最近采集：{time(snapshot?.observed_at)}</span></div>
    <div className={s.controlGrid}>
      <form className={`${s.card} ${s.compose} ${s.ownerControl}`} onSubmit={event => { event.preventDefault(); void save(); }}>
        <div className={s.cardHeading}><h2>负责人当前执行要求</h2><span className={s.badge}>{dirty ? "有未保存修改" : "已保存要求"}</span></div>
        <p className={s.hint}>保存后用于后续新启动的任务，不更改平台商品或正在运行的任务。项目长期目标继续以上方原项目快照为准。</p>
        <label htmlFor="wb-focus">当前重点</label><textarea id="wb-focus" rows={3} maxLength={4000} value={draft.focus} onChange={event => edit("focus", event.target.value)} disabled={saving} placeholder="例如：先完善数据读取、执行衔接和成果验收能力"/>
        <label htmlFor="wb-priorities">优先事项</label><textarea id="wb-priorities" rows={3} maxLength={4000} value={draft.priorities} onChange={event => edit("priorities", event.target.value)} disabled={saving} placeholder="按先后顺序填写，一行一项"/>
        <label htmlFor="wb-notes">补充要求</label><textarea id="wb-notes" rows={2} maxLength={4000} value={draft.notes} onChange={event => edit("notes", event.target.value)} disabled={saving}/>
        {dirty && changedElsewhere && <p className={s.danger}>云端要求已有变化。你的输入已保留；保存时会核对版本。可重新载入云端要求后再编辑。</p>}
        {error && <p className={s.danger} role="alert">{error} 输入仍保留；可重试或重新载入云端要求。</p>}{message && <p className={s.subtle} role="status">{message}</p>}
        <div className={s.actions}><button className={s.primary} disabled={saving || !dirty}>{saving ? "正在保存…" : "保存执行要求"}</button><button type="button" disabled={saving} onClick={() => void reload()}>重新载入云端要求（替换输入）</button></div><p className={s.subtle}>保存时间：{draft.updated_at ? time(draft.updated_at) : "尚未保存"}</p>
      </form>
      <div className={s.controlSide}>
        <section className={s.card}><h2>实际执行状态</h2><div className={s.runNumbers}><div><strong>{activeCount}</strong><span>真正在运行</span></div><div><strong>{runs.filter(run => run.status === "queued").length}</strong><span>排队等候</span></div><div><strong>{runs.filter(run => run.status === "awaiting_review").length}</strong><span>等待审查</span></div></div><p className={s.hint}>运行数只统计已领取且执行凭据仍有效的任务。未接入的桌面对话不计入；排队不代表已开始。</p></section>
        <section className={s.card}><h2>Codex 账户额度</h2><p className={s.subtle}>最近读取：{time(codex?.observed_at)}<br/>来源：{codex?.source || "未读取"}</p>{codex?.windows.length ? codex.windows.map((window, index) => <div className={s.quotaWindow} key={index}><div className={s.cardHeading}><strong>{window.label}</strong><span>剩余 {quotaRemaining(window.used_percent)}%</span></div><meter min={0} max={100} value={quotaRemaining(window.used_percent)} aria-label={`${window.label}剩余额度`}/><p className={s.subtle}>实际窗口：{windowDuration(window.window_minutes)} · 已用 {window.used_percent}%<br/>重置时间：{window.resets_at ? time(window.resets_at) : "未提供"}</p></div>) : <p className={s.hint}>额度窗口未读取。</p>}<p className={s.subtle}>账户可用状态：{codex?.available === true ? "最近读取时可用" : codex?.available === false ? "最近读取时不可用" : "未读取"}<br/>重置积分：{codex?.reset_credits == null ? "未读取" : codex.reset_credits}</p><p className={s.hint}>额度由账户内所有会话共享，是最近一次读取结果，不是本任务预算或 API 余额。</p><Limits values={codex?.limitations || []}/></section>
      </div>
    </div>
    <div className={s.sectionHeading}><div><h2>渠道经营摘要</h2><p className={s.subtle}>页面重读只显示已采集快照，不会向平台重新取数。</p></div></div>
    <div className={s.taskGrid}>{([{ id: "alibaba", title: "国际站" }, { id: "website", title: "独立站" }] as const).map(item => { const channel = snapshot?.channels.find(channel => channel.id === item.id); return <section className={s.card} key={item.id}><div className={s.cardHeading}><h2>{item.title}</h2><span className={s.badge}>{channel?.observed_at ? "已采集快照" : "未读取"}</span></div><p>{channel?.summary || "尚未读取经营摘要。"}</p><dl className={s.metricGrid}>{channel?.metrics.map((metric, index) => <div key={index}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>{!channel?.metrics.length && <p className={s.subtle}>经营指标未读取。</p>}<p className={s.subtle}>数据窗口：{channel?.period || "未提供"}<br/>读取时间：{time(channel?.observed_at)}<br/>来源：{channel?.source || "未读取"}</p><Limits values={channel?.limitations || []}/></section>; })}</div>
  </section>;
}
