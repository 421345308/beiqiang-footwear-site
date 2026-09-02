import type { SourcingProgram } from "./sourcing-programs";

export type ChineseSourcingProgram = Omit<SourcingProgram, "slug"> & {
  slug: SourcingProgram["slug"];
};

export const chineseSourcingPrograms: ChineseSourcingProgram[] = [
  {
    slug: "wholesale-walking-shoes",
    eyebrow: "步行鞋批发 · B2B采购",
    title: "面向进口商与线上卖家的步行鞋批发选款方案",
    description:
      "比较已有资料的针织、纺织和网布步行鞋，建立多款候选，并根据预计数量进入商业审核。",
    buyerIntent:
      "为市场测试或可重复产品组合选择现有款的进口商、批发商、分销商与平台卖家。",
    pathLabel: "现有款批发审核",
    projectPath: "base_style_adaptation",
    productCodes: ["BQ009", "BQ001", "BQ002", "BQ004", "BQ012", "BQ024"],
    benefits: [
      {
        title: "当前在线产品选款",
        copy: "联系业务前先比较款号、结构、尺码方向、颜色和真实图片，也可以提交其他目标款。",
      },
      {
        title: "多款统一询价",
        copy: "最多可把12款放入同一采购需求，并分别填写数量、颜色和尺码说明。",
      },
      {
        title: "样品先于大货决定",
        copy: "通过样品阶段核对所选产品和约定要求，再确认大货订单。",
      },
    ],
    briefItems: [
      "目标市场与销售渠道",
      "款号或产品链接",
      "每款预计数量",
      "颜色与尺码配比",
      "包装或标签要求",
      "目的地与目标时间",
    ],
    workflow: [
      {
        title: "筛选现有款",
        copy: "根据渠道和目标客户，用产品资料与比较功能缩小候选范围。",
      },
      {
        title: "提交一份采购需求",
        copy: "补充数量、颜色、尺码、包装、目的地和贸易条款偏好，让首次回复直接处理商业问题。",
      },
      {
        title: "审核样品与报价",
        copy: "可用情况、规格、样品安排、价格与时间按款书面确认。",
      },
    ],
    faq: [
      {
        question: "可以一次询价多款产品吗？",
        answer: "可以。询价单最多加入12款，并可为每一款填写数量、颜色与尺码。",
      },
      {
        question: "网站图片和产品目录是最终报价吗？",
        answer:
          "不是。它们用于选款；价格、可用情况、规格、包装、运费和时间以书面报价为准。",
      },
      {
        question: "可以混颜色和尺码吗？",
        answer:
          "可根据具体款式、当前可用情况、订单数量和尺码配比审核，只有写入报价后才算确认。",
      },
      {
        question: "订单如何正式成立？",
        answer:
          "规格和样品决定完成后，双方确认书面报价，并通过约定的Alibaba Trade Assurance订单或双方合同建立正式交易。",
      },
    ],
    evidenceBoundary:
      "重点款只是采购起点，不代表销量声明。产品可用情况与商业条款仍按具体订单确认。",
  },
  {
    slug: "private-label-walking-shoes",
    eyebrow: "私标步行鞋 · 现有款调整路径",
    title: "从已有产品证据开始的私标步行鞋项目",
    description:
      "先选择贝强现有产品作为基础款，再围绕市场与数量讨论Logo、颜色、标签和包装的可行调整。",
    buyerIntent:
      "希望调整现有产品方向，而不是从零开发全部部件的品牌、私标、连锁零售与电商买家。",
    pathLabel: "现有款调整",
    projectPath: "base_style_adaptation",
    productCodes: ["BQ001", "BQ002", "BQ009", "BQ004", "BQ012", "BQ024"],
    benefits: [
      {
        title: "从实物证据开始",
        copy: "每个基础款都有款号、图库、已整理属性和仍需确认的事项。",
      },
      {
        title: "明确品牌需求",
        copy: "说明Logo位置、标签、鞋垫、鞋盒或包装方向，便于按产品审核可行性。",
      },
      {
        title: "大货前批准版本",
        copy: "颜色、品牌、材料方向和包装需书面确认，必要时以实物样品为证据。",
      },
    ],
    briefItems: [
      "基础款号或参考",
      "目标市场与零售渠道",
      "预计数量和颜色数",
      "Logo文件与位置",
      "标签与包装要求",
      "目标上市或到货时间",
    ],
    workflow: [
      {
        title: "选择基础款",
        copy: "筛选最接近的现有结构，并说明哪些内容保持不变、哪些需要调整。",
      },
      {
        title: "审核品牌可行性",
        copy: "根据数量、工艺和现有生产条件审核产品部件及包装需求。",
      },
      {
        title: "批准约定版本",
        copy: "大货确认前使用书面规格，并在需要时完成实物样品审核。",
      },
    ],
    faq: [
      {
        question: "私标是否代表所有改动都能做？",
        answer:
          "不是。Logo、颜色、标签、材料和包装要按款式与数量审核后才能成为确认规格。",
      },
      {
        question: "应准备什么Logo文件？",
        answer:
          "生产审核优先使用矢量文件，同时说明位置、尺寸、颜色及品牌使用要求。",
      },
      {
        question: "产品图片可以当作已批准样品吗？",
        answer:
          "不可以。网站图片用于识别产品方向，最终产品、颜色与品牌版本需另行确认。",
      },
      {
        question: "接受报价是否等于下单？",
        answer:
          "不等于。接受报价记录商业意向，正式订单仍需通过Trade Assurance订单或签署合同建立。",
      },
    ],
    evidenceBoundary:
      "本页说明审核路径，不保证每种Logo、材料、颜色或包装在任何数量下都可执行。",
  },
  {
    slug: "oem-knit-shoes",
    eyebrow: "OEM针织鞋 · 技术开发需求",
    title: "OEM针织步行鞋开发先从可核对的技术需求开始",
    description:
      "提供买家目标、参考图、技术包或实物样品背景，让结构、材料、部件、测试需求与开发风险在报价前得到审核。",
    buyerIntent:
      "项目可能涉及新楦、新模具、新鞋底、材料系统、性能目标、NDA或保密技术包的品牌及技术开发买家。",
    pathLabel: "技术产品开发",
    projectPath: "technical_development",
    productCodes: ["BQ001", "BQ002", "BQ004", "BQ009", "BQ012", "BQ019"],
    benefits: [
      {
        title: "目标与事实分开",
        copy: "买家目标在样品、部件确认或正式测试形成证据前，始终保留为开发要求。",
      },
      {
        title: "集中保存开发输入",
        copy: "把技术包、参考图或文件附在私密询盘记录中，避免关键要求散落在不同消息。",
      },
      {
        title: "保留修订证据",
        copy: "买家项目页可在同一私密参考号下保留消息、报价、审核文件与下一动作。",
      },
    ],
    briefItems: [
      "技术包、草图或实物样品背景",
      "目标市场与用途",
      "鞋楦、合脚性和尺码要求",
      "鞋面、里料和鞋底方向",
      "目标数值与测试方法",
      "数量、时间、NDA和目的地",
    ],
    workflow: [
      {
        title: "判断项目类型",
        copy: "确认现有结构能否调整，或是否需要新开发、开模及供应商验证。",
      },
      {
        title: "确认可行性边界",
        copy: "区分买家目标、已确认能力、固定项以及只能在样品或测试后形成的实际结果。",
      },
      {
        title: "定义样品决定",
        copy: "在项目进入可报价状态前，约定样品目的、交付物、验收标准与排除项。",
      },
    ],
    faq: [
      {
        question: "样品前能保证目标硬度、回弹或测试结果吗？",
        answer:
          "不能。相关结构、部件、成品样品和测试证据形成实际结果前，目标只是买家要求。",
      },
      {
        question: "可以发送保密技术包吗？",
        answer:
          "询盘支持私密文件上传和NDA需求标记；发送敏感资料前仍需书面确认保密条款与审核范围。",
      },
      {
        question: "参考鞋底能证明成鞋结果吗？",
        answer:
          "不能。参考部件、完整样品和正式测试报告属于不同证据等级，必须分别描述。",
      },
      {
        question: "OEM项目什么时候可以报价？",
        answer:
          "当结构、材料、部件、数量、尺码、包装、测试和交付预期足够明确时，才能形成有意义的报价。",
      },
    ],
    evidenceBoundary:
      "参考产品只展示相关结构方向，不证明新的技术目标、测试结果、模具改动或配方已经具备。",
  },
];

export function getChineseSourcingProgram(slug: string) {
  return chineseSourcingPrograms.find((program) => program.slug === slug);
}
