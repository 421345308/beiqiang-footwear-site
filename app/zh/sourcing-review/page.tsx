import type { Metadata } from "next";
import ChineseSiteFooter from "../../components/ChineseSiteFooter";
import ChineseSiteHeader from "../../components/ChineseSiteHeader";
import SourcingReviewForm from "../../components/SourcingReviewForm";

export const metadata: Metadata = { title: "人工鞋款选款复核｜贝强鞋业", description: "提交目标市场、预计数量和产品方向，由贝强业务员从已有产品事实出发，为B2B采购准备可审核的候选鞋款。", alternates: { canonical: "https://www.beiqiang.online/zh/sourcing-review/", languages: { en: "https://www.beiqiang.online/sourcing-review/", "zh-CN": "https://www.beiqiang.online/zh/sourcing-review/", "x-default": "https://www.beiqiang.online/sourcing-review/" } } };

export default function ChineseSourcingReviewPage() { return <main><ChineseSiteHeader englishHref="/sourcing-review/" /><section className="finder-hero"><p className="eyebrow">人工采购复核</p><h1>筛选器不够时，让业务员看懂整份需求。</h1><p>提交目标市场、预计数量和产品方向。贝强业务员会核对已有产品资料、说明缺口，并给出有事实依据的起始候选，不为了成交而强行匹配。</p></section><section className="section sourcing-review-layout"><aside><p className="eyebrow">您将获得什么</p><h2>可继续推进的选款结果，不是自动承诺。</h2><ol><li><strong>2至4款候选鞋款</strong><span>在适用时从贝强当前已有资料的产品中筛选。</span></li><li><strong>匹配理由与信息缺口</strong><span>说明候选为什么可能合适，以及仍需核实的事实。</span></li><li><strong>样品／报价下一步</strong><span>列出讨论样品或准备有效报价还需要的资料。</span></li></ol><small>提交后建立的是采购询盘，不是订单。产品规格、可供性、价格、MOQ、交期、定制和样品结果都需要人工审核与书面确认。</small></aside><SourcingReviewForm locale="zh" /></section><ChineseSiteFooter /></main>; }
