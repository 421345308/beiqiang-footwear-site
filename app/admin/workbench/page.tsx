import type { Metadata } from "next";
import Workbench from "./Workbench";

export const metadata: Metadata = {
  title: "贝强 · 私有经营工作台",
  description: "贝强经营工作台管理员入口",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
  alternates: { canonical: "/admin/workbench/" },
};

export default function WorkbenchPage() { return <Workbench />; }
