import Link from "next/link";

const evidence = {
  en: [
    {
      href: "/factory/",
      image: "/factory-video-stills/factory-exterior.webp",
      alt: "Exterior visible in the Beiqiang factory tour footage",
      label: "SUPPLIER CONTEXT",
      title: "Start with the actual factory tour",
      body: "See our working areas, upper stitching and shoe-handling process in the full three-minute tour.",
      action: "Visit the factory",
    },
    {
      href: "/oem-odm/",
      image: "/factory-video-stills/stitching-line.webp",
      alt: "Stitching work area visible in the supplied factory footage",
      label: "WORK-AREA FOOTAGE",
      title: "Talk through the changes you need",
      body: "Choose a base shoe or share your design, then discuss materials, branding and sample options with us.",
      action: "Prepare an OEM brief",
    },
    {
      href: "/quality-packing/",
      image: "/factory-video-stills/packing-preparation.webp",
      alt: "Packing preparation visible in the supplied factory footage",
      label: "ORDER PREPARATION",
      title: "Define what must be checked before shipment",
      body: "Agree the color and size mix, labels, boxes and carton markings before your order is packed.",
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
      body: "看看日常工作区域、鞋面车缝和鞋品整理，先对工厂有一个直观了解。",
      action: "了解工厂",
    },
    {
      href: "/zh/oem-odm/",
      image: "/factory-video-stills/stitching-line.webp",
      alt: "贝强工厂素材中可见的针车工作区域",
      label: "工作区域实拍",
      title: "想改哪里，我们一起具体沟通",
      body: "提供喜欢的鞋款或设计图，沟通材料、商标和样品，先确定能做什么、怎么做。",
      action: "准备OEM需求",
    },
    {
      href: "/zh/quality-packing/",
      image: "/factory-video-stills/packing-preparation.webp",
      alt: "贝强工厂素材中可见的包装准备画面",
      label: "订单准备",
      title: "明确出货前需要核对什么",
      body: "各色各码数量、标签、鞋盒和箱唛，都在订单中逐项确认，方便收货和后续销售。",
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
          ? "图片取自贝强工厂实拍视频。具体鞋款的做法和订单安排，请与我们单独确认。"
          : "Images taken from Beiqiang’s factory video. Construction and production arrangements are confirmed for each style and order."}
      </p>
    </div>
  );
}
