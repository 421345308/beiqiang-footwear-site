import Link from "next/link";

const evidence = {
  en: [
    {
      href: "/factory/",
      image: "/factory-video-stills/factory-exterior.webp",
      alt: "Exterior visible in the Beiqiang factory tour footage",
      label: "SUPPLIER CONTEXT",
      title: "Start with the actual factory tour",
      body: "Review the full three-minute footage, its scene guide and the limits of what the video proves.",
      action: "Review factory evidence",
    },
    {
      href: "/oem-odm/",
      image: "/factory-video-stills/stitching-line.webp",
      alt: "Stitching work area visible in the supplied factory footage",
      label: "WORK-AREA FOOTAGE",
      title: "Connect a request to a reviewable process",
      body: "Use a base style, reference image or technical brief so the team can check feasibility before promising customization.",
      action: "Prepare an OEM brief",
    },
    {
      href: "/quality-packing/",
      image: "/factory-video-stills/packing-preparation.webp",
      alt: "Packing preparation visible in the supplied factory footage",
      label: "ORDER PREPARATION",
      title: "Define what must be checked before shipment",
      body: "Product, assortment, labeling, packing and carton requirements are confirmed for the specific order—not inferred from one scene.",
      action: "Review checking and packing",
    },
  ],
  zh: [
    {
      href: "/zh/factory/",
      image: "/factory-video-stills/factory-exterior.webp",
      alt: "贝强工厂完整视频中可见的工厂外部画面",
      label: "供应商背景",
      title: "先看完整工厂实拍",
      body: "查看三分钟完整视频、场景导览以及视频能够证明和不能证明的边界。",
      action: "审核工厂证据",
    },
    {
      href: "/zh/oem-odm/",
      image: "/factory-video-stills/stitching-line.webp",
      alt: "贝强工厂素材中可见的针车工作区域",
      label: "工作区域实拍",
      title: "把采购要求变成可审核的流程",
      body: "提供基础款、参考图或技术资料，由团队先审核可行性，再讨论定制范围。",
      action: "准备OEM需求",
    },
    {
      href: "/zh/quality-packing/",
      image: "/factory-video-stills/packing-preparation.webp",
      alt: "贝强工厂素材中可见的包装准备画面",
      label: "订单准备",
      title: "明确出货前需要核对什么",
      body: "产品、配码、标签、包装与装箱按具体订单确认，不能从一个现场画面直接推定。",
      action: "查看检查与包装",
    },
  ],
};

export default function HomepageFactoryEvidence({ locale = "en" }: { locale?: "en" | "zh" }) {
  return (
    <div className="homepage-factory-evidence" aria-label={locale === "zh" ? "工厂实拍证据入口" : "Factory evidence routes"}>
      {evidence[locale].map((item) => (
        <Link href={item.href} key={item.href}>
          <figure>
            <img src={item.image} alt={item.alt} loading="lazy" decoding="async" />
            <figcaption>{item.label} · {locale === "zh" ? "视频静帧" : "VIDEO STILL"}</figcaption>
          </figure>
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            <strong>{item.action} →</strong>
          </div>
        </Link>
      ))}
      <p className="homepage-factory-evidence-boundary">
        {locale === "zh"
          ? "这些图片来自当前工厂视频，用于供应商初步审核。画面出现某个工作区域，不代表所有SKU均采用该工艺，也不构成产能、认证、材料或交期承诺。"
          : "These stills come from the current factory tour for preliminary supplier review. A visible work area does not mean every SKU uses that process and does not prove capacity, certification, material or lead time."}
      </p>
    </div>
  );
}
