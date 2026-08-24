import type { Metadata } from "next";

export const metadata: Metadata = { other: { "content-language": "zh-CN" } };

export default function ChineseLayout({ children }: { children: React.ReactNode }) {
  return <div className="zh-page" lang="zh-CN"><script dangerouslySetInnerHTML={{ __html: 'document.documentElement.lang="zh-CN"' }} />{children}</div>;
}
