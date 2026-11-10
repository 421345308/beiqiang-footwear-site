import { inquiryOverview, type InquiryOverviewTask } from "./inquiry-overview";
import s from "./workbench.module.css";

export default function InquiryOverview({ tasks, connected, observedAt, open, refresh }: {
  tasks?: InquiryOverviewTask[];
  connected: boolean;
  observedAt: string;
  open: (reference?: string) => void;
  refresh: () => void;
}) {
  const overview = inquiryOverview(tasks, connected);
  return <section className={s.card} aria-labelledby="overview-inquiries">
    <div className={s.cardHeading}><h2 id="overview-inquiries">网站询盘</h2>
      <button onClick={() => open()}>查看全部询盘</button></div>
    {overview.state === "unavailable" ? <p className={s.failure} role="status">
      暂时无法确认网站询盘，请重新读取；这不代表没有询盘。 <button onClick={refresh}>重新读取</button>
    </p> : <>
      <p role="status">共 {overview.total} 条业务询盘，其中 {overview.pending} 条在网站后台待处理。
        {observedAt && <> 最近读取：{new Date(observedAt).toLocaleString("zh-CN", { hour12: false })}。</>}</p>
      <p className={s.hint}>这里显示网站后台的内部处理状态，不代表客户是否已收到回复；本机客户跟进状态请查看对应客户记录。</p>
      {overview.notificationNotConfirmed > 0 && <p className={s.failure} role="status">{overview.notificationNotConfirmed} 条询盘的邮件通知未确认，请打开询盘核对。</p>}
      {overview.notificationUnknown > 0 && <p className={s.hint}>{overview.notificationUnknown} 条询盘的邮件通知状态暂不可用，请在询盘详情中核对。</p>}
      {overview.items.map(item => <article className={s.historyRow} key={item.reference}>
        <div><strong>{item.title}</strong><p className={s.subtle}>{item.next || "查看客户需求，准备处理方案"}</p></div>
        <button onClick={() => open(item.reference)}>打开询盘</button>
      </article>)}
    </>}
  </section>;
}
