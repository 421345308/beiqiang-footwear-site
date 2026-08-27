"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ActionKind = "buyer_action" | "beiqiang_review" | "formal_order" | "closed";
type Project = {
  reference: string;
  receivedAt: string;
  updatedAt: string;
  status: { code: string; label: string; step: number };
  styleCodes: string[];
  styleLabel: string;
  quantity: string;
  destination: string;
  deliveryTiming: string;
  tradeTerm: string;
  buyerUpdate: string;
  action: { kind: ActionKind; eyebrow: string; title: string; summary: string; label: string; anchor: string; rank: number };
  items: { code: string; name: string; quantity: string; colors: string; sizes: string }[];
  quotation: null | { quoteNumber: string; version: string; status: string; validUntil: string; currency: string; tradeTerm: string };
  sample: null | { reference: string; status: string; styleCodes: string[]; quantity: string; updatedAt: string };
  order: null | { reference: string; method: string; status: string; confirmedAt: string };
  recommendation: null | { reference: string; status: string; styleCodes: string[] };
  activity: { buyerFiles: number; sharedDocuments: number; messages: number };
  hasIssuedQuotation: boolean;
  hasOrder: boolean;
  hasOpenRepeatProject: boolean;
};

const statusLabels: Record<string, string> = {
  new: "已收到需求",
  qualified: "需求已核实",
  sample_discussion: "样品讨论中",
  quoted: "报价已发出",
  commercial_discussion: "商务沟通中",
  order_confirmed: "订单已确认",
  closed: "项目已关闭",
};

function displayDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString("zh-CN") : "待确认";
}

function tradeTermLabel(value: string) {
  const labels: Record<string, string> = { not_sure: "待讨论", exw: "EXW", fob: "FOB", fca: "FCA", cif: "CIF", dap: "DAP", ddp: "DDP" };
  return labels[value?.toLowerCase()] || value || "待讨论";
}

function stateLabel(value = "") {
  const labels: Record<string, string> = {
    issued: "等待买家处理",
    buyer_accepted: "买家已接受",
    buyer_revision_requested: "买家已要求修改",
    buyer_declined: "买家已拒绝本版本",
    buyer_review: "等待买家审核",
    approved: "已批准",
    revision_requested: "已要求修改",
    production: "生产中",
    shipped: "已发货",
    delivered: "已送达",
  };
  return labels[value] || value.replaceAll("_", " ") || "待确认";
}

function actionCopy(project: Project) {
  const anchorLabels: Record<string, { eyebrow: string; title: string; summary: string; label: string }> = {
    "buyer-recommendation": { eyebrow: "等待您的选款", title: "查看贝强为该项目准备的产品推荐", summary: "选择感兴趣款式，或说明需要替换的产品方向。", label: "处理产品推荐" },
    "sample-review": { eyebrow: "等待您的样品决定", title: "审核指定实物样品轮次", summary: "只按写明的实物样编号、范围、交付物、标准和排除项处理。", label: "审核样品" },
    "buyer-quotation": { eyebrow: "等待您的报价决定", title: "查看已签发报价并记录商业回复", summary: "接受、提出修改目标或拒绝当前报价版本；这不会自动创建订单。", label: "处理报价" },
    "order-setup-request": { eyebrow: "下一商务步骤", title: "补充正式订单准备资料", summary: "提供采购公司、联系人、目的地和订单承接方式。", label: "准备正式订单" },
    "order-change-review": { eyebrow: "等待您的订单变更决定", title: "审核贝强提出的关键订单变更", summary: "当前版本在您接受前继续有效，正式渠道还需同步确认。", label: "审核订单变更" },
    "fulfillment-case-review": { eyebrow: "等待您的履约确认", title: "回复当前履约异常", summary: "确认处理方案或提出具体修改要求。", label: "处理履约异常" },
    "delivery-feedback": { eyebrow: "等待您的收货反馈", title: "确认收货或报告交付问题", summary: "收货确认是运营记录，不放弃合同或隐蔽瑕疵权利。", label: "提交收货反馈" },
    "repeat-order": { eyebrow: "下一采购项目", title: "继续补货、新季选款或OEM/ODM讨论", summary: "新项目需要重新核对产品、数量和商务条款。", label: "查看下一项目" },
  };
  if (anchorLabels[project.action.anchor]) return anchorLabels[project.action.anchor];
  if (project.action.kind === "beiqiang_review") return { eyebrow: "贝强处理中", title: "工厂正在审核下一步", summary: "当前由贝强核对产品、样品、报价或订单资料。", label: "查看项目" };
  if (project.action.kind === "formal_order") return { eyebrow: "正式订单阶段", title: "查看订单与履约摘要", summary: "付款、生产和交付以Trade Assurance订单或签署合同为准。", label: "查看订单项目" };
  if (project.action.kind === "closed") return { eyebrow: "项目已关闭", title: "查看已保存的项目摘要", summary: "如需继续，应联系贝强建立新的明确采购动作。", label: "查看已关闭项目" };
  return { eyebrow: "需要您的处理", title: "打开项目查看下一步", summary: "使用项目私密查询码查看敏感资料并提交决定。", label: "处理项目" };
}

export default function ChineseBuyerWorkspace() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("请输入提交贝强采购询盘时使用的准确业务邮箱。");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [filter, setFilter] = useState<"all" | ActionKind>("all");
  const [query, setQuery] = useState("");
  const openedProjects = useRef(new Set<string>());
  const filteredProjects = useMemo(() => (projects || []).filter((project) => filter === "all" || project.action.kind === filter).filter((project) => !query.trim() || [project.reference, project.styleLabel, project.styleCodes.join(" "), project.status.label, project.action.title, project.items.map((item) => `${item.code} ${item.name}`).join(" "), project.quotation?.quoteNumber, project.sample?.reference, project.order?.reference].join(" ").toLowerCase().includes(query.trim().toLowerCase())), [projects, filter, query]);
  const counts = useMemo(() => ({ all: projects?.length || 0, buyer_action: projects?.filter((project) => project.action.kind === "buyer_action").length || 0, beiqiang_review: projects?.filter((project) => project.action.kind === "beiqiang_review").length || 0, formal_order: projects?.filter((project) => project.action.kind === "formal_order").length || 0, closed: projects?.filter((project) => project.action.kind === "closed").length || 0 }), [projects]);

  async function loadProjects(sessionToken: string) {
    setLoading(true); setMessage("正在载入安全买家工作台……");
    try {
      const response = await fetch("/api/buyer-workspace-session", { headers: { Authorization: `Bearer ${sessionToken}` }, cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "买家工作台暂时无法载入。");
      setProjects(result.projects || []); setMessage(`安全工作台已载入 · 共${result.projects?.length || 0}个项目。`);
    } catch {
      sessionStorage.removeItem("beiqiang_buyer_workspace_session"); setProjects(null); setMessage("工作台链接或会话已失效，请重新申请安全邮件链接。");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const savedSession = sessionStorage.getItem("beiqiang_buyer_workspace_session") || "";
    if (!token) {
      if (savedSession) { const timer = window.setTimeout(() => void loadProjects(savedSession), 0); return () => window.clearTimeout(timer); }
      return;
    }
    window.history.replaceState({}, "", "/zh/buyer-workspace/");
    void (async () => {
      setLoading(true); setMessage("正在验证一次性工作台链接……");
      try {
        const response = await fetch("/api/buyer-workspace-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error();
        sessionStorage.setItem("beiqiang_buyer_workspace_session", result.sessionToken); await loadProjects(result.sessionToken);
      } catch { setProjects(null); setMessage("该一次性链接无效、已经使用或已过期，请重新申请。"); setLoading(false); }
    })();
  }, []);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault(); setSending(true); setMessage("正在准备安全链接……");
    try {
      const response = await fetch("/api/buyer-workspace-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, locale: "zh" }) });
      const result = await response.json().catch(() => ({}));
      setMessage(result.message || "如果该邮箱与项目记录匹配，安全链接会很快发送。请检查垃圾邮件。"); setEmail("");
    } catch { setMessage("如果该邮箱与项目记录匹配，安全链接会很快发送。未收到时请联系贝强。"); }
    finally { setSending(false); }
  }

  function recordActivity(event: "project_open" | "private_project_open" | "workspace_closed", reference = "") {
    const sessionToken = sessionStorage.getItem("beiqiang_buyer_workspace_session") || "";
    if (!sessionToken) return;
    void fetch("/api/buyer-workspace-activity", { method: "POST", headers: { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ event, reference }), keepalive: true }).catch(() => undefined);
  }

  function recordProjectOpen(reference: string) {
    if (openedProjects.current.has(reference)) return;
    openedProjects.current.add(reference); recordActivity("project_open", reference);
  }

  function signOut() {
    recordActivity("workspace_closed"); sessionStorage.removeItem("beiqiang_buyer_workspace_session"); openedProjects.current.clear(); setProjects(null); setFilter("all"); setQuery(""); setMessage("工作台已在本浏览器关闭。下次使用时请重新申请安全链接。");
  }

  return <>
    <section className="workspace-hero"><div><p className="eyebrow eyebrow-light">安全买家工作台</p><h1>用一个邮箱查看多个采购项目。</h1><p>主询盘邮箱或经贝强明确授权的项目联系人，可以查看产品简报、买家安全里程碑和下一步。无需建立密码账户。</p><div className="workspace-boundaries"><span>15分钟一次性邮件链接</span><span>8小时浏览器会话</span><span>按项目授权联系人</span><span>敏感资料与决定仍需项目私密码</span></div></div><form onSubmit={requestLink}><h2>发送安全链接到邮箱</h2><label>业务邮箱<input type="email" required autoComplete="email" maxLength={180} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="buyer@company.com" /></label><button className="button" disabled={sending}>{sending ? "发送中……" : "发送安全工作台链接"}</button><small>为了保护隐私，无论邮箱是否存在，公开响应都保持一致。</small></form></section>
    <section className="workspace-content" aria-live="polite">
      <div className="workspace-content-heading"><div><p className="eyebrow">您的采购记录</p><h2>{projects ? "与该邮箱关联的项目" : "从安全邮件继续"}</h2></div>{projects ? <button className="text-button" type="button" onClick={signOut}>关闭工作台</button> : <Link href="/zh/inquiry-status/">用编号和查询码打开单个项目 →</Link>}</div>
      <p className="workspace-message">{loading ? "● " : ""}{message}</p>
      {projects ? <>
        <div className="workspace-action-summary" aria-label="项目行动汇总"><button className={filter === "all" ? "active" : ""} type="button" onClick={() => setFilter("all")}><strong>{counts.all}</strong><span>全部项目</span></button><button className={filter === "buyer_action" ? "active" : ""} type="button" onClick={() => setFilter("buyer_action")}><strong>{counts.buyer_action}</strong><span>等待您处理</span></button><button className={filter === "beiqiang_review" ? "active" : ""} type="button" onClick={() => setFilter("beiqiang_review")}><strong>{counts.beiqiang_review}</strong><span>贝强审核中</span></button><button className={filter === "formal_order" ? "active" : ""} type="button" onClick={() => setFilter("formal_order")}><strong>{counts.formal_order}</strong><span>正式订单</span></button><button className={filter === "closed" ? "active" : ""} type="button" onClick={() => setFilter("closed")}><strong>{counts.closed}</strong><span>已关闭</span></button></div>
        <label className="workspace-search"><span>查找项目</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="询盘编号、产品、报价、样品或订单" /></label>
        <div className="workspace-results-note">显示{filteredProjects.length}/{projects.length}个项目 · 需要买家决定的项目优先。</div>
        <div className="workspace-projects">{filteredProjects.length ? filteredProjects.map((project) => { const action = actionCopy(project); return <article key={project.reference} className={`workspace-project workspace-project-${project.action.kind}`}>
          <div className="workspace-project-top"><div><small>{project.reference}</small><h3>{project.styleCodes.join(" · ") || project.styleLabel}</h3></div><span className={`workspace-status workspace-status-${project.status.code}`}>{statusLabels[project.status.code] || project.status.label}</span></div>
          <section className={`workspace-action workspace-action-${project.action.kind}`}><p>{action.eyebrow}</p><h4>{action.title}</h4><span>{action.summary}</span></section>
          <dl><div><dt>意向数量</dt><dd>{project.quantity}</dd></div><div><dt>目的地</dt><dd>{project.destination}</dd></div><div><dt>最后更新</dt><dd>{displayDate(project.updatedAt)}</dd></div></dl>
          <p><strong>最新买家安全更新</strong>{project.buyerUpdate}</p>
          <div className="workspace-flags">{project.hasIssuedQuotation && <span>已有报价活动</span>}{project.hasOrder && <span>已记录正式订单</span>}{project.hasOpenRepeatProject && <span>已有下一项目</span>}</div>
          <details className="workspace-preview" onToggle={(event) => { if (event.currentTarget.open) recordProjectOpen(project.reference); }}><summary><span><strong>查看买家安全项目摘要</strong><small>无需项目查询码</small></span><b>展开</b></summary><div className="workspace-preview-body">
            <section><div className="workspace-preview-heading"><div><p className="eyebrow">商务简报</p><h4>本项目当前范围</h4></div><span>邮箱验证视图</span></div><div className="workspace-brief-grid"><div><small>贸易术语</small><strong>{tradeTermLabel(project.tradeTerm)}</strong></div><div><small>期望时间</small><strong>{project.deliveryTiming}</strong></div><div><small>目的地</small><strong>{project.destination}</strong></div><div><small>项目阶段</small><strong>{statusLabels[project.status.code] || project.status.label}</strong></div></div></section>
            <section><div className="workspace-preview-heading"><div><p className="eyebrow">产品行</p><h4>已提交产品范围</h4></div><span>{project.items.length}行</span></div>{project.items.length ? <div className="workspace-item-table"><div><strong>款号</strong><strong>产品</strong><strong>数量</strong><strong>颜色 / 尺码</strong></div>{project.items.map((item, index) => <div key={`${item.code}-${index}`}><b>{item.code || "待确认"}</b><span>{item.name}</span><span>{item.quantity}</span><span>{item.colors}<small>{item.sizes}</small></span></div>)}</div> : <p className="workspace-preview-empty">贝强记录产品范围后会在这里显示。</p>}</section>
            {(project.recommendation || project.sample || project.quotation || project.order) && <section><div className="workspace-preview-heading"><div><p className="eyebrow">公开里程碑</p><h4>已记录商务进展</h4></div><span>仅摘要</span></div><div className="workspace-milestones">{project.recommendation && <article><small>产品推荐</small><strong>{stateLabel(project.recommendation.status)}</strong><p>{project.recommendation.styleCodes.join(" · ") || project.recommendation.reference}</p></article>}{project.sample && <article><small>样品 · {project.sample.reference}</small><strong>{stateLabel(project.sample.status)}</strong><p>{project.sample.styleCodes.join(" · ") || "已记录款式范围"} · {project.sample.quantity}</p></article>}{project.quotation && <article><small>报价 · {project.quotation.quoteNumber}{project.quotation.version ? ` · V${project.quotation.version}` : ""}</small><strong>{stateLabel(project.quotation.status)}</strong><p>{[project.quotation.currency, project.quotation.tradeTerm, `有效至 ${project.quotation.validUntil}`].filter(Boolean).join(" · ")}</p></article>}{project.order && <article><small>正式订单 · {project.order.reference}</small><strong>{stateLabel(project.order.status)}</strong><p>{project.order.method}</p></article>}</div></section>}
            <section className="workspace-activity"><div><p className="eyebrow">项目活动</p><h4>完成项目验证后可查看支持记录</h4></div><div><span><strong>{project.activity.messages}</strong>条消息</span><span><strong>{project.activity.buyerFiles}</strong>个买家文件</span><span><strong>{project.activity.sharedDocuments}</strong>份共享文件</span></div></section>
          </div></details>
          <div className="workspace-verified-handoff"><div><strong>继续项目验证</strong><p>输入原20位项目查询码，查看消息、文件、报价条款、样品标准和订单记录，或提交决定。</p></div><Link className="button button-secondary" href={`/zh/inquiry-status/?reference=${encodeURIComponent(project.reference)}`} onClick={() => recordActivity("private_project_open", project.reference)}>{action.label}</Link></div>
        </article>; }) : <div className="workspace-empty"><h3>没有匹配项目。</h3><p>请调整行动筛选或搜索词。如已知项目仍未出现，请联系贝强。</p></div>}</div>
      </> : <div className="workspace-explanation"><article><span>01</span><h3>申请</h3><p>输入网站采购询盘使用的准确邮箱。</p></article><article><span>02</span><h3>验证</h3><p>15分钟内打开发送到该邮箱的一次性链接。</p></article><article><span>03</span><h3>查看</h3><p>比较安全项目摘要，再用私密查询码处理详情和决定。</p></article></div>}
      <div className="workspace-security"><strong>商务与安全边界</strong><p>工作台是邮箱验证后的买家安全项目概览。被授权联系人只看到贝强明确授权的项目；公司名或邮箱域名相似不会自动授权。工作台访问不代表有权付款、发出采购订单、接受报价、确认库存或授权生产。价格、付款、文件、消息、追踪和写入动作继续由项目查询码保护；正式条款以Alibaba Trade Assurance或签署合同为准。</p></div>
    </section>
  </>;
}
