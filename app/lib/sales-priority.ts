export type SalesReadiness = { score: number; level: string; missing: string[] };

export type SalesRecord = {
  reference: string; receivedAt: string; status: string; name: string; company: string; buyerType: string; market: string; styleCode: string; quantity: string; bulkQuantity?: string; owner?: string; nextAction?: string; nextActionDue?: string; lastContactedAt?: string; email?: string; whatsapp?: string;
  messages?: { sender: "buyer" | "sales"; sentAt: string; body: string }[];
  finderBrief?: { mode?: string; buyerChannel: string; priority: string; closure: string; styleCodes: string[] } | null;
  recommendationSets?: { id: string; status: string; title?: string; items?: { code: string }[] }[];
  sampleProgram?: { status: string; sampleReference?: string; styleCodes?: string } | null;
  quotations?: { quoteNumber: string; status?: string; validUntil?: string }[];
  buyerOrderRequests?: { id: string; quoteNumber: string; status: string }[];
  orderHandoff?: { orderReference: string; fulfillmentStatus: string } | null;
  orderChangeRequests?: { id: string; status: string; changedFields?: string[]; proposedHandoff?: { orderReference?: string } }[];
  fulfillmentCases?: { id: string; status: string; title?: string; responseDue?: string }[];
  meetingRequests?: { id: string; status: string; meetingType?: string; confirmedSlot?: string; timezone?: string }[];
};

export type SalesTaskKind = "buyer_message" | "order_setup" | "order_change" | "fulfillment" | "meeting" | "sourcing_review" | "sample" | "quotation" | "recommendation" | "overdue" | "qualification" | "monitor";
export type SalesTask = { kind: SalesTaskKind; score: number; lane: "internal" | "waiting_buyer" | "monitor"; urgency: "critical" | "high" | "normal"; title: string; reason: string; nextStep: string; due: string; evidence: string[] };

const todayIso = (now = new Date()) => now.toISOString().slice(0, 10);
const overdue = (record: SalesRecord, now: Date) => Boolean(record.nextActionDue && record.nextActionDue < todayIso(now) && !["lost", "spam", "order_confirmed"].includes(record.status));

export function buildSalesTask(record: SalesRecord, readiness: SalesReadiness, now = new Date()): SalesTask {
  const latestMessage = record.messages?.at(-1);
  const orderRequest = record.buyerOrderRequests?.at(-1);
  const change = record.orderChangeRequests?.find((item) => item.status === "awaiting_buyer");
  const fulfillment = record.fulfillmentCases?.find((item) => item.status === "awaiting_buyer");
  const quote = record.quotations?.at(-1);
  const recommendation = record.recommendationSets?.at(-1);
  const meeting = record.meetingRequests?.find((item) => ["pending", "confirmed"].includes(item.status));
  const dueBoost = overdue(record, now) ? 8 : 0;
  const base = (task: Omit<SalesTask, "score" | "urgency"> & { score: number }): SalesTask => ({ ...task, score: Math.min(100, task.score + dueBoost), urgency: task.score + dueBoost >= 95 ? "critical" : task.score + dueBoost >= 80 ? "high" : "normal" });

  if (latestMessage?.sender === "buyer") return base({ kind: "buyer_message", score: 100, lane: "internal", title: "回复买家最新消息", reason: "私密项目线程最后一条消息来自买家，尚未看到后续业务回复。", nextStep: "阅读原消息和项目事实，编辑英文草稿后在该项目消息区回复。", due: record.nextActionDue || "今天", evidence: [`买家消息：${latestMessage.sentAt}`, record.styleCode] });
  if (orderRequest?.status === "submitted") return base({ kind: "order_setup", score: 98, lane: "internal", title: "审核正式建单申请", reason: `买家已基于报价 ${orderRequest.quoteNumber} 提交正式建单资料。`, nextStep: "核对买方主体、最终规格、价格、贸易术语、付款、包装和交付窗口，再准备Trade Assurance订单或合同。", due: record.nextActionDue || "今天", evidence: [orderRequest.id, orderRequest.quoteNumber] });
  if (change) return base({ kind: "order_change", score: 96, lane: "waiting_buyer", title: "提醒买家审核订单变更", reason: `订单变更 ${change.id} 正等待买家明确接受或拒绝。`, nextStep: "确认通知已送达；提醒买家对照当前确认版本，不在回复中暗示变更已生效。", due: record.nextActionDue || "按变更反馈期限", evidence: [change.id, change.proposedHandoff?.orderReference || record.orderHandoff?.orderReference || "订单编号待核对"] });
  if (fulfillment) return base({ kind: "fulfillment", score: 94, lane: "waiting_buyer", title: "跟进履约异常反馈", reason: `履约异常 ${fulfillment.id} 正等待买家回应拟议方案。`, nextStep: "核实事实、影响范围与拟议处理后，提醒买家确认收到或提出具体修改。", due: fulfillment.responseDue || record.nextActionDue || "按异常反馈期限", evidence: [fulfillment.id, fulfillment.title || "履约异常"] });
  if (meeting?.status === "pending") return base({ kind: "meeting", score: 93, lane: "internal", title: "审核买家采购会议申请", reason: `会议申请 ${meeting.id} 正等待人工核对候选时间、时区、方式和议题。`, nextStep: "确认负责人和语言支持后，只从买家候选时间中确认一个；无法支持时写明买家安全原因。", due: record.nextActionDue || "今天", evidence: [meeting.id, meeting.meetingType?.replaceAll("_", " ") || "采购沟通"] });
  if (record.finderBrief?.mode === "human_review" && recommendation?.status !== "issued") return base({ kind: "sourcing_review", score: 89, lane: "internal", title: "为人工选款需求签发候选", reason: `买家要求按 ${record.finderBrief.priority.replaceAll("_", " ")} 优先、${record.finderBrief.buyerChannel.replaceAll("_", " ")} 渠道和 ${record.finderBrief.closure.replaceAll("_", " ")} 鞋面结构进行人工复核。`, nextStep: "核对市场、数量、尺码、颜色、包装与样品要求，签发2至4款有证据支持的候选；若目录无合适款，明确记录缺口并索取参考图或规格。", due: record.nextActionDue || "今天", evidence: [record.finderBrief.priority, record.finderBrief.buyerChannel, record.finderBrief.closure, record.finderBrief.styleCodes.join(", ") || "无起始候选"] });
  if (record.sampleProgram?.status === "buyer_review") return base({ kind: "sample", score: 90, lane: "waiting_buyer", title: "推动具名实物样品验收", reason: `样品 ${record.sampleProgram.sampleReference || "编号待核对"} 已进入买家审核。`, nextStep: "提醒买家只按本轮交付物、验收标准和排除项批准或要求修改。", due: record.nextActionDue || "按样品审核计划", evidence: [record.sampleProgram.sampleReference || "样品编号待核对", record.sampleProgram.styleCodes || record.styleCode] });
  if (quote?.status === "issued") return base({ kind: "quotation", score: 86, lane: "waiting_buyer", title: "跟进已签发报价", reason: `报价 ${quote.quoteNumber} 正等待买家接受、要求修改或拒绝。`, nextStep: "提醒买家在私密项目中提交结构化决定；不要在聊天中默认报价已接受。", due: quote.validUntil || record.nextActionDue || "报价有效期待核对", evidence: [quote.quoteNumber, quote.validUntil || "有效期待核对"] });
  if (recommendation?.status === "issued") return base({ kind: "recommendation", score: 82, lane: "waiting_buyer", title: "推动买家完成选款", reason: `选款建议 ${recommendation.id} 已发出，等待买家保存候选或提出替换标准。`, nextStep: "引导买家选择款号并补充数量、尺码、颜色、市场和时间，不把推荐写成库存或报价。", due: record.nextActionDue || "按选款跟进计划", evidence: [recommendation.id, recommendation.items?.map((item) => item.code).join(", ") || record.styleCode] });
  if (meeting?.status === "confirmed") return base({ kind: "meeting", score: 78, lane: "internal", title: "准备已确认的采购会议", reason: `会议 ${meeting.id} 已确认，需按议题核对产品证据和书面商业记录。`, nextStep: "会前准备相关款号、样品、报价或订单文件；会后只记录实际讨论结果和明确下一动作。", due: meeting.confirmedSlot || record.nextActionDue || "按确认时间", evidence: [meeting.id, meeting.timezone || "时区待核对"] });
  if (overdue(record, now)) return base({ kind: "overdue", score: 80, lane: "internal", title: "完成逾期下一动作", reason: `计划日期 ${record.nextActionDue} 已过，项目仍在活跃管道。`, nextStep: record.nextAction || "核对最近互动，设定一个明确、可完成的下一动作并联系买家。", due: record.nextActionDue || "已逾期", evidence: [record.nextAction || "下一动作未填写", record.lastContactedAt || "最近联系时间未填写"] });
  if (readiness.level !== "ready") return base({ kind: "qualification", score: record.status === "new" ? 76 : 68, lane: "internal", title: "补齐报价前采购资料", reason: `采购资料完整度 ${readiness.score}/100，仍有${readiness.missing.length}项结构性缺口。`, nextStep: "一次性向买家索取最关键的1至3项信息，再决定样品或报价路径。", due: record.nextActionDue || "下一次联系", evidence: readiness.missing.slice(0, 3) });
  return base({ kind: "monitor", score: 45, lane: "monitor", title: "按既定下一动作推进", reason: "当前没有检测到等待立即处理的买家决定或逾期事项。", nextStep: record.nextAction || "复核项目状态并设定下一动作和日期。", due: record.nextActionDue || "日期待设置", evidence: [record.status, `${readiness.score}/100`] });
}

function salutation(name: string) { return name.trim() ? `Hello ${name.trim()},` : "Hello,"; }

export function buildBuyerReplyDraft(record: SalesRecord, task: SalesTask, readiness: SalesReadiness) {
  const styles = record.styleCode || "the selected footwear styles";
  const reference = record.reference;
  const latestQuote = record.quotations?.at(-1);
  const latestRecommendation = record.recommendationSets?.at(-1);
  const orderRequest = record.buyerOrderRequests?.at(-1);
  const change = record.orderChangeRequests?.find((item) => item.status === "awaiting_buyer");
  const fulfillment = record.fulfillmentCases?.find((item) => item.status === "awaiting_buyer");
  const meeting = record.meetingRequests?.find((item) => ["pending", "confirmed"].includes(item.status));
  let body = "Thank you for your sourcing request. We are reviewing the product and commercial requirements for your project.";

  if (task.kind === "buyer_message") body = "We received your latest private project message. Our team is reviewing it against the existing product, sample, quotation and order records. Please keep any correction tied to the exact style code and project reference.";
  if (task.kind === "order_setup") body = `Thank you for submitting the formal order setup details for ${orderRequest?.quoteNumber || "the accepted quotation"}. We are checking the legal purchasing company, destination, order channel and final written terms before preparing an Alibaba Trade Assurance order or bilateral contract.`;
  if (task.kind === "order_change") body = `Proposed order change ${change?.id || "the current change request"} is ready for your review. Please compare it with the current confirmed version and accept or reject it in the private project page. The current version remains unchanged until you accept the proposal.`;
  if (task.kind === "fulfillment") body = `Fulfillment case ${fulfillment?.id || "the current case"} is waiting for your response. Please review the recorded facts, affected scope, expected impact and proposed resolution, then acknowledge receipt or request a specific revision in the private project page.`;
  if (task.kind === "meeting") body = meeting?.status === "pending" ? `We received meeting request ${meeting.id}. Our team is checking the proposed local times, stated time zone, channel, language and agenda. No calendar booking or attendance is confirmed until one option is approved in your private project page.` : `Meeting ${meeting?.id || "for this project"} is recorded for ${meeting?.confirmedSlot || "the confirmed time"} (${meeting?.timezone || "the stated time zone"}). Please review the connection details and agenda in your private project page. Meeting discussion does not replace written sample, quotation or order terms.`;
  if (task.kind === "sourcing_review") body = "We received your human shortlist request. Our team is reviewing the documented catalog against your target market, quantity and product criteria. We will issue an evidence-supported shortlist or explain the catalog gap and request the reference or specification needed for further development. A shortlist does not confirm stock, price or manufacturing feasibility.";
  if (task.kind === "sample") body = `The physical sample review for ${record.sampleProgram?.sampleReference || styles} is ready. Please verify the sample reference and decide only against the stated deliverables, acceptance criteria and exclusions. Sample approval does not automatically confirm unlisted bulk-order terms.`;
  if (task.kind === "quotation") body = `Quotation ${latestQuote?.quoteNumber || "for this project"} is available in your private project page. Please accept the issued version, submit specific revision targets, or decline it with a reason. A quotation response does not create a production order.`;
  if (task.kind === "recommendation") body = `We prepared product recommendation ${latestRecommendation?.id || "for this project"} for ${styles}. Please save the styles you want to evaluate or send the replacement criteria. Product facts and all commercial terms remain subject to verification before quotation.`;
  if (["qualification", "overdue", "monitor"].includes(task.kind) && readiness.missing.length) body = `To evaluate ${styles} for your B2B project, please reply with the following: ${readiness.missing.slice(0, 3).join("; ")}. This will help us choose the correct sample or quotation path without assuming unconfirmed specifications.`;

  return `${salutation(record.name)}\n\n${body}\n\nProject reference: ${reference}\n\nFinal price, MOQ, material execution, size ratio, packing, lead time and transaction terms remain subject to written confirmation for the exact project.\n\nBest regards,\nBeiqiang Footwear`;
}
