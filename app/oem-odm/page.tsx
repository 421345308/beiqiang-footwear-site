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
  title: "Two sourcing paths, one requirement: confirm feasibility first.",
  introduction:
    "Choose a documented Beiqiang style for adaptation discussion, or share a structured product-development brief. Logo, color, material and packing requests are evaluated against the style, quantity and sample requirements before confirmation.",
  primaryCta: "Create a logo concept",
  primaryHref: "/private-label-concept/",
  proofLabel: "PROCESS EVIDENCE + PRODUCT BRIEF",
  proofTitle: "Review visible making steps, then define the product brief.",
  proofCopy:
    "The footage-derived images document selected material preparation, stitching and upper-finishing steps. They help make a factory discussion concrete, but do not promise that every style uses the same process or that every customization is feasible.",
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
  stepsTitle: "Build a brief the factory can evaluate.",
  steps: [
    {
      title: "Choose the path",
      copy: "Reference an existing product code or provide clear images and a written development direction.",
    },
    {
      title: "Define buyer context",
      copy: "State the destination market, sales channel, expected quantity and target customer.",
    },
    {
      title: "List required changes",
      copy: "Mark priorities for color, material, logo, labeling, packing, size range and target timing.",
    },
    {
      title: "Confirm by sample",
      copy: "Review feasibility, cost drivers and the agreed product direction through the sample process.",
    },
  ],
  confirmedTitle: "Useful starting points",
  confirmed: [
    "Current online base-style pages",
    "Wide toe box, slip-on, lace-up and seasonal directions",
    "Product-code inquiry trail",
    "Factory-side sample and requirement discussion",
  ],
  confirmTitle: "Never assumed in advance",
  confirm: [
    "Logo method and placement",
    "Custom colors, materials and components",
    "Packaging and labeling execution",
    "MOQ, development cost, sample timing and bulk lead time",
  ],
  closingTitle: "A complete brief saves time and reduces quotation revisions.",
  closingCopy:
    "Send the product code or reference, target market, expected quantity, requested changes and timing. We will separate feasible items from details that need further checking.",
};
export default function OemOdmPage() {
  return <CapabilityPage data={data} />;
}
