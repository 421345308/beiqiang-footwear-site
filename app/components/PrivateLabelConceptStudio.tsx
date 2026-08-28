"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "../data/products";
import { addConceptProductToQuote, savePrivateLabelConcept, type PrivateLabelConcept } from "../lib/private-label-concept";
import { trackEvent } from "../lib/tracking";

const placements = {
  en: ["Outer upper", "Tongue label", "Heel area", "Insole", "Shoebox / packing"],
  zh: ["鞋面外侧", "鞋舌标签", "后跟位置", "鞋垫", "鞋盒／包装"],
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else line = candidate;
  }
  if (line && lines < maxLines) context.fillText(line, x, y + lines * lineHeight);
}

export default function PrivateLabelConceptStudio({ locale = "en" }: { locale?: "en" | "zh" }) {
  const zh = locale === "zh";
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState("BQ001");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandText, setBrandText] = useState("");
  const [placement, setPlacement] = useState(placements[locale][0]);
  const [artworkStatus, setArtworkStatus] = useState<PrivateLabelConcept["artworkStatus"]>("not_ready");
  const [notes, setNotes] = useState("");
  const [x, setX] = useState(56);
  const [y, setY] = useState(45);
  const [size, setSize] = useState(22);
  const [message, setMessage] = useState(zh ? "Logo只在本浏览器处理，不会自动上传。" : "Your logo stays in this browser and is not uploaded automatically.");
  const dragging = useRef(false);
  const product = useMemo(() => products.find((item) => item.code === selectedCode) || products[0], [selectedCode]);
  const productImage = `/catalog-thumbs/${product.slug}.webp`;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("style")?.toUpperCase();
    const validCode = requested && products.some((item) => item.code === requested) ? requested : "BQ001";
    const timer = window.setTimeout(() => setSelectedCode(validCode), 0);
    trackEvent("private_label_studio_view", { context: "private_label_concept", styleCode: validCode });
    return () => window.clearTimeout(timer);
  }, []);

  function handleLogo(file?: File) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type) || file.size > 4 * 1024 * 1024) {
      setMessage(zh ? "请使用不超过4MB的PNG、JPG或WebP图片。" : "Use a PNG, JPG or WebP image no larger than 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setLogoUrl(String(reader.result || "")); setMessage(zh ? "Logo已在本机载入；页面不会自动发送该文件。" : "Logo loaded locally; this page does not send the file."); };
    reader.onerror = () => setMessage(zh ? "Logo读取失败，请换一个文件。" : "The logo could not be read. Try another file.");
    reader.readAsDataURL(file);
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setX(Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100)));
    setY(Math.max(5, Math.min(95, ((event.clientY - rect.top) / rect.height) * 100)));
  }

  function concept(): PrivateLabelConcept {
    return { styleCode: product.code, styleSlug: product.slug, sourceModel: product.sourceModel, styleName: product.name, placement, artworkStatus, brandText: brandText.trim().slice(0, 80), notes: notes.trim().slice(0, 500), createdAt: new Date().toISOString() };
  }

  async function download() {
    if (!logoUrl && brandText.trim().length < 2) {
      setMessage(zh ? "请先上传Logo或输入至少2个字符的品牌文字。" : "Upload a logo or enter at least two characters of brand text first.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600; canvas.height = 1100;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#f6f2e8"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#17221d"; context.font = "700 30px Arial"; context.fillText("BEIQIANG FOOTWEAR · PRIVATE-LABEL CONCEPT", 70, 72);
      context.font = "700 50px Arial"; context.fillText(`${product.code} · ${product.sourceModel}`, 70, 140);
      context.font = "24px Arial"; context.fillStyle = "#54615a"; wrapText(context, product.name, 70, 184, 920, 32, 2);
      const shoe = await loadImage(productImage);
      const box = { x: 70, y: 245, width: 1000, height: 700 };
      context.fillStyle = "#fff"; context.fillRect(box.x, box.y, box.width, box.height);
      const ratio = Math.min(box.width / shoe.width, box.height / shoe.height);
      const width = shoe.width * ratio; const height = shoe.height * ratio;
      context.drawImage(shoe, box.x + (box.width - width) / 2, box.y + (box.height - height) / 2, width, height);
      const markX = box.x + (x / 100) * box.width; const markY = box.y + (y / 100) * box.height;
      const markWidth = (size / 100) * box.width;
      if (logoUrl) {
        const logo = await loadImage(logoUrl); const markHeight = markWidth * (logo.height / logo.width);
        context.drawImage(logo, markX - markWidth / 2, markY - markHeight / 2, markWidth, markHeight);
      } else {
        context.font = `700 ${Math.max(24, markWidth / 5)}px Arial`; context.textAlign = "center"; context.fillStyle = "#17221d"; context.fillText(brandText.trim().slice(0, 24), markX, markY); context.textAlign = "left";
      }
      context.fillStyle = "#17221d"; context.font = "700 24px Arial"; context.fillText(zh ? "买家概念目标" : "BUYER CONCEPT TARGET", 1120, 285);
      context.font = "22px Arial"; context.fillStyle = "#46534c";
      wrapText(context, `${zh ? "示意位置" : "Placement"}: ${placement}`, 1120, 335, 410, 32, 3);
      wrapText(context, `${zh ? "图稿状态" : "Artwork"}: ${artworkStatus.replaceAll("_", " ")}`, 1120, 450, 410, 32, 3);
      wrapText(context, `${zh ? "说明" : "Notes"}: ${notes || (zh ? "未填写" : "Not supplied")}`, 1120, 565, 410, 32, 7);
      context.fillStyle = "#fff3d5"; context.fillRect(70, 980, 1460, 75);
      context.fillStyle = "#6d4b00"; context.font = "700 20px Arial";
      wrapText(context, zh ? "概念图仅记录买家目标，不证明Logo工艺、位置、颜色、尺寸、成本或生产可行性。须经工厂审核及样品/书面文件确认。" : "Buyer-target concept only. It does not confirm logo method, placement, color, size, cost or production feasibility. Factory review and sample/written approval are required.", 95, 1014, 1400, 26, 2);
      const link = document.createElement("a"); link.download = `${product.code}-private-label-concept.png`; link.href = canvas.toDataURL("image/png"); link.click();
      savePrivateLabelConcept(concept()); trackEvent("private_label_concept_download", { context: "private_label_concept", styleCode: product.code });
      setMessage(zh ? "概念图已下载。请保留该文件，并在获得项目查询码后上传给业务员审核。" : "Concept image downloaded. Keep it and upload it for sales review after you receive a project access code.");
    } catch {
      setMessage(zh ? "概念图生成失败，请重试或使用截图后继续询价。" : "The concept image could not be generated. Retry or keep a screenshot before continuing.");
    }
  }

  function continueToQuote() {
    const value = concept(); savePrivateLabelConcept(value); addConceptProductToQuote(product, value);
    trackEvent("private_label_concept_to_quote", { context: "private_label_concept", styleCode: product.code });
    router.push(`${zh ? "/zh" : ""}/request-quote/?path=base_style_adaptation&concept=1`);
  }

  return <div className="concept-studio-grid"><section className="concept-controls"><label>{zh ? "基础款" : "Base style"}<select value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}>{products.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.sourceModel} · {item.name}</option>)}</select></label><div className="concept-upload-row"><label className="concept-file">{zh ? "上传Logo" : "Upload logo"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleLogo(event.target.files?.[0])} /></label>{logoUrl && <button type="button" className="button button-secondary" onClick={() => setLogoUrl("")}>{zh ? "移除Logo" : "Remove logo"}</button>}</div><label>{zh ? "没有文件时输入品牌文字" : "Brand text when no file is available"}<input value={brandText} onChange={(event) => setBrandText(event.target.value)} maxLength={80} placeholder={zh ? "例如：YOUR BRAND" : "Example: YOUR BRAND"} /></label><label>{zh ? "期望位置" : "Requested placement"}<select value={placement} onChange={(event) => setPlacement(event.target.value)}>{placements[locale].map((item) => <option key={item}>{item}</option>)}</select></label><label>{zh ? "图稿准备状态" : "Artwork readiness"}<select value={artworkStatus} onChange={(event) => setArtworkStatus(event.target.value as PrivateLabelConcept["artworkStatus"])}><option value="not_ready">{zh ? "尚未准备" : "Not ready"}</option><option value="reference_only">{zh ? "仅有参考图" : "Reference image only"}</option><option value="vector_ready">{zh ? "已有矢量图稿" : "Vector artwork ready"}</option></select></label><label>{zh ? "预览标识大小" : "Preview mark size"}<input type="range" min="8" max="42" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label><label>{zh ? "品牌、颜色、标签或包装说明" : "Branding, color, label or packing notes"}<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} rows={5} placeholder={zh ? "只写买家目标；工艺、颜色和位置由工厂审核。" : "State buyer targets only; method, color and placement remain subject to factory review."} /></label></section><section className="concept-preview-panel"><div className="concept-preview-heading"><div><small>{product.code} · {product.sourceModel}</small><h2>{product.name}</h2></div><span>{zh ? "拖动标识调整示意位置" : "Drag the mark to adjust the visual position"}</span></div><div className="concept-stage" onPointerMove={move} onPointerUp={() => { dragging.current = false; }} onPointerLeave={() => { dragging.current = false; }}><img className="concept-shoe" src={productImage} alt={`${product.code} ${product.name}`} /><button type="button" aria-label={zh ? "拖动品牌标识" : "Drag branding mark"} className="concept-mark" style={{ left: `${x}%`, top: `${y}%`, width: `${size}%` }} onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={() => { dragging.current = false; }}>{logoUrl ? <img src={logoUrl} alt="" /> : <span>{brandText.trim() || (zh ? "品牌" : "BRAND")}</span>}</button></div><p className="concept-boundary"><strong>{zh ? "重要：" : "Important: "}</strong>{zh ? "这是买家概念示意，不代表Logo能够按图中工艺、位置、比例或颜色生产。每一项都需要款式、数量、材料、工艺和样品审核。" : "This is a buyer concept illustration. It does not prove that the logo can be produced with the shown method, location, scale or color. Style, quantity, material, process and sample review are required."}</p><p className="form-status">{message}</p><div className="concept-actions"><button type="button" className="button button-secondary" onClick={download}>{zh ? "下载概念图PNG" : "Download concept PNG"}</button><button type="button" className="button" onClick={continueToQuote}>{zh ? "把需求带入询价单" : "Continue with this RFQ brief"}</button></div></section></div>;
}
