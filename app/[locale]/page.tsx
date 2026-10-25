import EuropePage, { europeMetadata } from "../components/EuropePage";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  return europeMetadata((await params).locale, "/");
}
export default async function Page({ params }: Props) {
  return <EuropePage locale={(await params).locale} path="/" />;
}
