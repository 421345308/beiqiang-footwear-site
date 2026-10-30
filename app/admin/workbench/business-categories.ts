export const businessCategories = [
  { id: "alibaba", name: "国际站运营", description: "商品标题、图片、详情优化，采购承接与平台验收。", entry: "02_Alibaba运营/AGENTS.md", task: "从当前主推采购承接记录选择一款尚待验收的商品，核对单款证据与公开页面，交付具体修改建议和验收结果。", route: "现有对话 / 本机；已导入任务可在 Cloud 分析快照" },
  { id: "website", name: "独立站增长", description: "采购路径、搜索收录、多语言内容与询盘承接。", entry: "03_独立站/AGENTS.md", task: "检查当前网站采购路径和搜索运营记录，选择一个明确缺口，完成可验证的改进并回写网站开发或搜索记录。", route: "现有对话 / 网站项目；Cloud 已验证仓库构建，官网队列未接入此类任务" },
  { id: "outreach", name: "外贸开发", description: "买家研究、RFQ、报价草稿、采购入口与跟进。", entry: "04_客户开发/README.md", task: "从获客研究与送达率治理的当前下一步接续，核实一个优先账户的采购入口或真实回复，交付有来源的结论与下一动作；外发遵守该对象已有明确授权。", route: "现有对话 / 本机；已导入任务可在 Cloud 分析快照" },
  { id: "douyin", name: "国内抖店", description: "商品资料、主推款内容、选码、交易与履约验证。", entry: "09_国内电商/抖店/AGENTS.md", task: "读取当前店铺档案，从主推款选码资料或手机选规格链路中选择一个缺口，完成核验并回写该店记录。", route: "现有对话 / 本机抖店项目" },
  { id: "content", name: "内容创作", description: "商品视频、脚本、素材与独立创作项目接续。", entry: "05_内容与视频/AGENTS.md", task: "读取当前指定视频项目的 PROJECT.md，接续一个未完成的脚本、素材准备或作品复核任务；付费生成须有负责人当次明确确认。", route: "现有对话 / 本机视频项目" },
  { id: "coordination", name: "总控与工具", description: "跨业务优先级、工作台接续与真实工具故障处理。", entry: "00_总控台/AGENTS.md", task: "检查当前状态和工作台应用入口，核实一个真实接续依赖，完成最小可验收修复；实际结果回原业务源。", route: "现有对话 / 本机；已导入任务可在 Cloud 分析快照" },
] as const;

export type BusinessCategory = typeof businessCategories[number];
export type CategoryId = BusinessCategory["id"];

// Classify by authoritative source, never infer a customer's identity from a title.
export function taskCategory(task: { source?: string }): CategoryId | "unassigned" {
  const source = (task.source || "").replaceAll("\\", "/").replace(/^\.\//, "");
  const prefixes: Array<[string, CategoryId]> = [["02_Alibaba运营/", "alibaba"], ["03_独立站/", "website"], ["04_客户开发/", "outreach"], ["09_国内电商/", "douyin"], ["05_内容与视频/", "content"], ["00_总控台/", "coordination"], ["08_工具链/", "coordination"]];
  return prefixes.find(([prefix]) => source.startsWith(prefix))?.[1] || "unassigned";
}

export function conversationPrompt(category: BusinessCategory) {
  return `请作为“${category.name}”独立业务对话接续贝强工作台。先读 AGENTS.md、00_总控台/当前状态.md、00_总控台/AGENTS.md，再读 ${category.entry} 及适用下级入口。\n\n本轮任务：${category.task}\n\n先检查原业务源的当前主办和在制范围，领取一个具体对象并注明写入范围；同一 SKU、同一客户或同一文件的写操作由同一主办处理，其他对话提供建议。不同对象可并行，共用事实由原业务源主办维护；同一对象发布、同仓库提交串行协调，不同平台独立对象的发布无需排队。交付后将真实结果、证据和下一步回写原业务源，不另建影子状态。\n\n在现有对话或本机项目执行；本指令只供复制，不会创建对话或启动后台。若改用 Cloud，先核实际可用资料、连接器与授权；本机聊天授权不自动证明 Cloud 已具备同等访问能力。本工作台队列当前仅支持已导入快照的分析提案，不外发邮件或写入平台；Cloud 的其他项目能力以该项目实际验证结果为准。`;
}
