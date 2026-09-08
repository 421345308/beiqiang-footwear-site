import type { Metadata } from "next";
import CapabilityPage, {
  type CapabilityPageData,
} from "../components/CapabilityPage";
export const metadata: Metadata = {
  title: "OEM & ODM Footwear Discussion | Beiqiang Footwear",
  description:
    "Discuss private-label walking shoe requirements through a base-style or development brief, with feasibility confirmed before commercial commitments.",
  alternates: {
    canonical: "https://www.beiqiang.online/oem-odm/",
    languages: {
      en: "https://www.beiqiang.online/oem-odm/",
      "zh-CN": "https://www.beiqiang.online/zh/oem-odm/",
      "x-default": "https://www.beiqiang.online/oem-odm/",
    },
  },
};
const data: CapabilityPageData = {
  chineseHref: "/zh/oem-odm/",
  eyebrow: "OEM / ODM DISCUSSION",
  title: "Build your footwear range from a suitable starting style.",
  introduction:
    "Want your own branding, a different color or a new design? Start with a Beiqiang catalogue style, or send your reference. We review the requested changes, quantity and sample needs before agreeing what can be made.",
  primaryCta: "Create a logo concept",
  primaryHref: "/private-label-concept/",
  proofLabel: "FROM IDEA TO SAMPLE",
  proofTitle: "Your design needs a practical production plan.",
  proofCopy:
    "These factory video stills show material preparation, upper stitching and finishing. The work needed for your project depends on the selected construction and requested changes.",
  images: [
    {
      src: "/factory-video-stills/material-cutting.webp",
      alt: "Material cutting preparation in the footwear working area",
      caption: "Material preparation",
    },
    {
      src: "/factory-video-stills/stitching-line.webp",
      alt: "Footwear upper stitching stations",
      caption: "Upper stitching",
    },
    {
      src: "/factory-video-stills/upper-finishing.webp",
      alt: "Manual upper finishing on a shoe last",
      caption: "Upper finishing",
    },
  ],
  stepsTitle: "What we need to discuss your project.",
  steps: [
  {
    "title": "Choose a base or share a reference",
    "copy": "A catalogue code helps us identify the starting shoe. For a new design, send a reference link and describe what needs to be different."
  },
  {
    "title": "Explain your order plan",
    "copy": "Tell us your sales market, estimated quantity and intended launch timing. A target budget helps us discuss trade-offs, but is not an agreed price."
  },
  {
    "title": "Prioritize the changes",
    "copy": "Separate essential changes from preferences: logo position, colors, materials, sizes, labels or packaging. Some changes may require different components or tooling."
  },
  {
    "title": "Agree the sample scope",
    "copy": "Before paying for development, agree what the sample will include, the costs and the checks needed. Technical targets are not guaranteed results."
  }
],
  confirmedTitle: "Ways to start",
  confirmed: [
  "Browse current base styles and compare their construction",
  "Make a logo concept to explain the intended position",
  "Send a product-specific inquiry with the changes you want",
  "Ask about a reference before choosing a sample"
],
  confirmTitle: "What we check for your project",
  confirm: [
    "Logo method and placement",
    "Custom colors, materials and components",
    "Packaging and labeling execution",
    "MOQ, development cost, sample timing and bulk lead time",
  ],
  closingTitle: "You do not need every answer before contacting us.",
  closingCopy:
    "Send the style or reference, your market, estimated quantity and the changes that matter most. If you have a confidential tech pack, discuss NDA terms before sharing it.",
};
export default function OemOdmPage() {
  return <CapabilityPage data={data} />;
}
