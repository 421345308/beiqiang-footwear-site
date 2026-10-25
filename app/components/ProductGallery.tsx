"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicLocale } from "../lib/public-locales";
import type { Product } from "../data/products";
import { colourImage, colourOverview, galleryImage } from "../lib/product-colours";
import { colorZh } from "../data/products-zh";
import { useProductColour } from "./ProductColourOptions";
import { productPhotoLabel } from "../lib/product-photo-labels";

export default function ProductGallery({ product, name, locale }: { product: Product; name: string; locale: PublicLocale }) {
  const images = product.images;
  const { id, colour } = useProductColour(product);
  const [manual, setManual] = useState<{id:string; index:number} | null>(null);
  useEffect(() => {
    const reset = () => setManual(null);
    window.addEventListener("bq-product-colour", reset);
    return () => window.removeEventListener("bq-product-colour", reset);
  }, []);
  const active = manual?.id === id ? manual.index : colourImage(product, id);
  const setActive = (index: number) => setManual({id, index});
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<number | null>(null);
  const zh = locale === "zh";
  const image = (index: number) => galleryImage(images[index]);
  const move = (direction: number) => setActive((active + direction + images.length) % images.length);
  const overview = colourOverview(product);
  const caption = productPhotoLabel(product.code, active, locale) ?? (active === overview ? (zh ? "配色概览" : "Colour overview") : colour?.imageIndex === active ? (zh ? colorZh(colour.name) : colour.name) : (zh ? `产品实拍 · ${active + 1}` : `Product view · ${active + 1}`));
  return <div className="studio-gallery">
    <div className="studio-gallery-main" onTouchStart={event => { start.current = event.touches[0].clientX; }} onTouchEnd={event => {
      if (start.current !== null) { const distance = event.changedTouches[0].clientX - start.current; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1); } start.current = null;
    }}>
      <button className="gallery-open" onClick={() => dialog.current?.showModal()} aria-label={zh ? "放大产品图片" : "Enlarge product image"}>
        <img src={image(active)} alt={`${name} · ${caption}`} width={1000} height={1000} decoding="async" fetchPriority="high" />
        <span>{zh ? "点击放大" : "Enlarge image"} ↗</span>
      </button>
      {images.length > 1 && <div className="gallery-controls"><button onClick={() => move(-1)} aria-label={zh ? "上一张图片" : "Previous image"}>←</button><span aria-live="polite">{active + 1} / {images.length}</span><button onClick={() => move(1)} aria-label={zh ? "下一张图片" : "Next image"}>→</button></div>}
    </div>
    <p className="gallery-caption" aria-live="polite">{caption}{colour && colour.imageIndex === null && <span> · {zh ? "所选配色暂无单独图片" : "Selected colour has no individual photo"}</span>}</p>
    <div className="studio-thumbnails" aria-label={zh ? "产品图片" : "Product images"}>{images.map((source, index) => <button key={source} className={index === active ? "is-active" : ""} onClick={() => setActive(index)} aria-pressed={index === active} aria-label={`${zh ? "查看" : "View"} ${productPhotoLabel(product.code, index, locale) ?? `${zh ? "图片" : "image"} ${index + 1}`}`} title={productPhotoLabel(product.code,index,locale) ?? undefined}><img src={galleryImage(source,true)} alt="" loading="lazy" width={100} height={100} /></button>)}</div>
    <dialog ref={dialog} className="gallery-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button className="gallery-close" autoFocus onClick={() => dialog.current?.close()} aria-label={zh ? "关闭放大图片" : "Close enlarged image"}>×</button>
      <img src={image(active)} alt={`${name} · ${caption}`} />
    </dialog>
  </div>;
}
