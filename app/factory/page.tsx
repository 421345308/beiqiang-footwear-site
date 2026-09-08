import type { Metadata } from "next";
import CapabilityPage, {
  type CapabilityPageData,
} from "../components/CapabilityPage";
import { productCount } from "../data/catalog-meta";

export const metadata: Metadata = {
  title: "Footwear Factory in Quanzhou | Beiqiang Footwear",
  description:
    "Visit Beiqiang's footwear workshop in Quanzhou through our factory video. Explore casual shoes, discuss private-label requirements and plan a sample before ordering.",
  alternates: {
    canonical: "https://www.beiqiang.online/factory/",
    languages: {
      en: "https://www.beiqiang.online/factory/",
      "zh-CN": "https://www.beiqiang.online/zh/factory/",
      "x-default": "https://www.beiqiang.online/factory/",
    },
  },
};

const data: CapabilityPageData = {
  chineseHref: "/zh/factory/",
  factoryReviewPackProductCount: productCount,
  eyebrow: "QUANZHOU FOOTWEAR SUPPLY",
  title: "Meet the factory behind your next footwear order.",
  introduction:
    "We are Beiqiang, a footwear factory supplier in Quanzhou, Fujian. We work with wholesalers, importers and brands sourcing casual walking shoes, slip-ons and textile footwear. Start with our catalogue, or tell us what you need help finding.",
  primaryCta: "Discuss your footwear project",
  primaryHref: "/sourcing-review/",
  proofLabel: "INSIDE BEIQIANG",
  proofTitle: "Take a look around our workshop.",
  proofCopy:
    "Watch our factory video and see the stitching stations, shoe handling and packing areas. For a specific style, ask us about its materials, construction and sample arrangement.",
  images: [
    {
      src: "/factory-video-stills/factory-exterior.webp",
      alt: "Exterior of the Beiqiang Footwear working site in Quanzhou",
      caption: "Quanzhou working site",
    },
    {
      src: "/factory-video-stills/stitching-line.webp",
      alt: "Footwear upper stitching stations in the Beiqiang working area",
      caption: "Upper stitching stations",
    },
    {
      src: "/factory-video-stills/materials-storage.webp",
      alt: "Organized finished-shoe storage and order staging area",
      caption: "Finished-shoe storage",
    },
  ],
  evidenceVideo: true,
  stepsTitle: "From your first question to a sample decision.",
  steps: [
    {
      title: "Shortlist a base style",
      copy: "Choose a few catalogue styles, or send a reference link and explain what you like about it. You do not need a finished specification to start.",
    },
    {
      title: "Tell us who you sell to",
      copy: "Your market, sales channel and estimated order size help us narrow the selection. If the quantity is undecided, say so.",
    },
    {
      title: "Check specifications",
      copy: "We discuss the selected style's materials, sizes, colors and any requested changes. Price and timing depend on these details.",
    },
    {
      title: "Agree what to sample",
      copy: "Confirm sample availability, cost and purpose first. Review the fit, finish and agreed changes before deciding on a bulk order.",
    },
  ],
  confirmedTitle: "What you can review now",
  confirmed: [
    "Casual shoe styles with product photos and size information",
    "Slip-on and lace-up options, with wide toe box details on the relevant styles",
    "Our factory video and workshop photographs",
    "Direct contact by email, WhatsApp or Alibaba.com",
  ],
  confirmTitle: "What we agree before an order",
  confirm: [
    "Exact material and construction",
    "Available size and color matrix",
    "Sample arrangement and customization feasibility",
    "MOQ, price, packing, lead time and trade terms",
  ],
  closingTitle: "Tell us what you would like to source.",
  closingCopy:
    "A reference, your target market and an estimated quantity are enough to start the conversation. We can work through the remaining details together.",
};
export default function FactoryPage() {
  return <CapabilityPage data={data} />;
}
