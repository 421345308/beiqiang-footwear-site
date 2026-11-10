import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "贝强经营后台",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <main style={{ maxWidth: 640, margin: "12vh auto", padding: "0 24px", fontFamily: "system-ui, sans-serif", lineHeight: 1.7 }}>
    <h1>贝强经营后台</h1>
    <p>登录经营工作台，查看网站询盘、任务和运行记录。</p>
    <p><Link href="/admin/workbench/">进入经营工作台 →</Link></p>
  </main>;
}
