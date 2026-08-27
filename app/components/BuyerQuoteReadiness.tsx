import type { BuyerQuoteReadiness as Readiness } from "../lib/buyer-quote-readiness";

export default function BuyerQuoteReadiness({ readiness }: { readiness: Readiness }) {
  const zh = readiness.locale === "zh";
  const missing = readiness.missing.slice(0, 4);
  return (
    <aside className={`buyer-quote-readiness readiness-${readiness.level}`} aria-live="polite">
      <div className="buyer-quote-readiness-heading">
        <div>
          <small>{zh ? "提交前采购资料检查" : "PRE-SUBMISSION BUYING-BRIEF CHECK"}</small>
          <strong>{readiness.label}</strong>
        </div>
        <span aria-label={zh ? `资料完整度${readiness.score}分` : `Brief readiness score ${readiness.score}`}>
          {readiness.score}<small>/100</small>
        </span>
      </div>
      <div className="buyer-quote-readiness-bar" aria-hidden="true"><i style={{ width: `${readiness.score}%` }} /></div>
      <p>{readiness.summary}</p>
      {missing.length ? (
        <div className="buyer-quote-readiness-next">
          <b>{zh ? "最值得先补充：" : "Complete these next:"}</b>
          <ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul>
          {readiness.missing.length > missing.length ? <small>{zh ? `另有${readiness.missing.length - missing.length}项可继续完善。` : `${readiness.missing.length - missing.length} additional item(s) can further improve the brief.`}</small> : null}
        </div>
      ) : (
        <div className="buyer-quote-readiness-next buyer-quote-readiness-complete">
          <b>{zh ? "首轮资料已齐备。" : "First-review context is complete."}</b>
          <span>{zh ? "提交后贝强仍会核实产品事实、样品、价格、MOQ、包装、交期和贸易条件。" : "After submission, Beiqiang still verifies product facts, samples, price, MOQ, packing, timing and trade terms."}</span>
        </div>
      )}
      <small className="buyer-quote-readiness-boundary">{zh ? "完整度用于减少往返追问，不是报价承诺、买家评分、订单批准或成交预测。资料不完整时仍可提交，由业务员人工判断。" : "Readiness reduces follow-up gaps. It is not a quotation promise, buyer score, order approval or sales prediction. You may still submit an incomplete brief for human review."}</small>
    </aside>
  );
}
