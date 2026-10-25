"use client";

import { useRef, useState } from "react";
import type { PublicLocale } from "../lib/public-locales";

export default function ProductGallery({ images, name, locale }: { images: string[]; name: string; locale: PublicLocale }) {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<number | null>(null);
  const zh = locale === "zh";
  const image = (index: number) => images[index].replace("/catalog/", "/catalog-web/").replace(/\.jpg$/i, ".webp");
  const move = (direction: number) => setActive(value => (value + direction + images.length) % images.length);
  return <div className="studio-gallery">
    <div className="studio-gallery-main" onTouchStart={event => { start.current = event.touches[0].clientX; }} onTouchEnd={event => {
      if (start.current !== null) { const distance = event.changedTouches[0].clientX - start.current; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1); } start.current = null;
    }}>
      <button className="gallery-open" onClick={() => dialog.current?.showModal()} aria-label={zh ? "放大产品图片" : "Enlarge product image"}>
        <img src={image(active)} alt={`${name} · ${active + 1}`} width={1000} height={1000} decoding="async" fetchPriority="high" />
        <span>{zh ? "点击放大" : "Enlarge image"} ↗</span>
      </button>
      {images.length > 1 && <div className="gallery-controls"><button onClick={() => move(-1)} aria-label={zh ? "上一张图片" : "Previous image"}>←</button><span aria-live="polite">{active + 1} / {images.length}</span><button onClick={() => move(1)} aria-label={zh ? "下一张图片" : "Next image"}>→</button></div>}
    </div>
    <div className="studio-thumbnails" aria-label={zh ? "产品图片" : "Product images"}>{images.map((source, index) => <button key={source} className={index === active ? "is-active" : ""} onClick={() => setActive(index)} aria-pressed={index === active} aria-label={`${zh ? "查看图片" : "View image"} ${index + 1}`}><img src={image(index)} alt="" loading="lazy" width={100} height={100} /></button>)}</div>
    <dialog ref={dialog} className="gallery-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button className="gallery-close" autoFocus onClick={() => dialog.current?.close()} aria-label={zh ? "关闭放大图片" : "Close enlarged image"}>×</button>
      <img src={image(active)} alt={`${name} · ${active + 1}`} />
    </dialog>
  </div>;
}
