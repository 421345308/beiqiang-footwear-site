import { useState, type FormEvent } from "react";
import s from "./workbench.module.css";

type Request = <T>(path: string, body?: object) => Promise<T>;

export default function AccountSecurity({ request, passwordConfigured, onPasswordChanged }: {
  request: Request;
  passwordConfigured: boolean;
  onPasswordChanged: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (next !== repeat) { setMessage("两次输入的新密码不一致。"); return; }
    setBusy(true); setMessage("");
    try {
      const result = await request<{ message: string }>("/api/workbench-auth", { action: "set_password", current_password: current, new_password: next });
      setCurrent(""); setNext(""); setRepeat(""); onPasswordChanged(); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作未完成，请重试。"); }
    finally { setBusy(false); }
  }
  async function revokeOthers() {
    setBusy(true); setMessage("");
    try {
      const result = await request<{ message: string }>("/api/workbench-auth", { action: "logout_others", current_password: current });
      setCurrent(""); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "操作未完成，请重试。"); }
    finally { setBusy(false); }
  }
  return <section className={s.card} aria-labelledby="wb-account-security">
    <h2 id="wb-account-security">账号安全与设备</h2>
    <p className={s.hint}>更改密码或退出其他设备需要当前密码；如果刚通过邮箱链接登录，10 分钟内可留空当前密码。</p>
    <form className={s.compose} onSubmit={submit}>
      <label htmlFor="wb-current-password">当前密码</label>
      <input id="wb-current-password" type="password" value={current} onChange={event => setCurrent(event.target.value)} autoComplete="current-password" disabled={busy}/>
      <label htmlFor="wb-new-password">{passwordConfigured ? "新密码" : "设置密码"}</label>
      <input id="wb-new-password" type="password" value={next} onChange={event => setNext(event.target.value)} autoComplete="new-password" minLength={12} required disabled={busy}/>
      <label htmlFor="wb-repeat-password">再次输入新密码</label>
      <input id="wb-repeat-password" type="password" value={repeat} onChange={event => setRepeat(event.target.value)} autoComplete="new-password" minLength={12} required disabled={busy}/>
      <p className={s.hint}>至少 12 个字符。更改密码后，其他设备将退出。</p>
      <div className={s.actions}><button className={s.primary} disabled={busy}>{busy ? "正在处理…" : "保存密码"}</button>
        <button type="button" disabled={busy} onClick={() => void revokeOthers()}>退出其他设备</button></div>
    </form>
    {message && <p role="status">{message}</p>}
  </section>;
}
