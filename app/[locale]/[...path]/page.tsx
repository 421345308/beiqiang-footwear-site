import EuropePage, { europeMetadata } from "../../components/EuropePage";
type Props = { params: Promise<{ locale: string; path: string[] }> };
export async function generateMetadata({ params }: Props) {
  const p = await params;
  return europeMetadata(p.locale, `/${p.path.join("/")}/`);
}
export default async function Page({ params }: Props) {
  const p = await params;
  return <EuropePage locale={p.locale} path={`/${p.path.join("/")}/`} />;
}
