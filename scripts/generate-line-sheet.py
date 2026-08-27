from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "tmp" / "pdfs" / "line-sheet-products.json"
OUTPUT = ROOT / "output" / "pdf" / "beiqiang-footwear-line-sheet-2026.pdf"
PUBLIC_COPY = ROOT / "public" / "downloads" / "beiqiang-footwear-line-sheet-2026.pdf"

FOREST = colors.HexColor("#16372C")
FOREST_DEEP = colors.HexColor("#0E251D")
TERRACOTTA = colors.HexColor("#C55B3E")
CREAM = colors.HexColor("#F4F0E7")
INK = colors.HexColor("#1C2420")
MUTED = colors.HexColor("#657069")
LINE = colors.HexColor("#D8D6CE")
WHITE = colors.white

PAGE_W, PAGE_H = A4


def paragraph(c: canvas.Canvas, text: str, x: float, y_top: float, width: float, height: float,
              size: float = 8.2, leading: float = 10.2, color=INK, bold: bool = False) -> float:
    style = ParagraphStyle(
        "line-sheet",
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
    item = Paragraph(text.replace("&", "&amp;"), style)
    _, used = item.wrap(width, height)
    item.drawOn(c, x, y_top - used)
    return used


def image_contain(c: canvas.Canvas, path: Path, x: float, y: float, width: float, height: float) -> None:
    reader = ImageReader(str(path))
    iw, ih = reader.getSize()
    scale = min(width / iw, height / ih)
    draw_w, draw_h = iw * scale, ih * scale
    c.drawImage(reader, x + (width - draw_w) / 2, y + (height - draw_h) / 2,
                width=draw_w, height=draw_h, preserveAspectRatio=True, mask="auto")


def header(c: canvas.Canvas, section: str) -> None:
    c.setFillColor(FOREST_DEEP)
    c.rect(0, PAGE_H - 25 * mm, PAGE_W, 25 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(16 * mm, PAGE_H - 15 * mm, "BEIQIANG FOOTWEAR SUPPLY")
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - 16 * mm, PAGE_H - 14.5 * mm, section.upper())


def footer(c: canvas.Canvas, page_number: int) -> None:
    c.setStrokeColor(LINE)
    c.line(16 * mm, 13 * mm, PAGE_W - 16 * mm, 13 * mm)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(16 * mm, 8.5 * mm, "www.beiqiang.online  |  421345308@qq.com  |  WhatsApp +86 189 5980 5256")
    c.drawRightString(PAGE_W - 16 * mm, 8.5 * mm, f"{page_number}")


def cover(c: canvas.Canvas, products: list[dict]) -> None:
    c.setFillColor(FOREST_DEEP)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(TERRACOTTA)
    c.rect(0, PAGE_H - 9 * mm, PAGE_W, 9 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(18 * mm, PAGE_H - 25 * mm, "QUANZHOU FOOTWEAR FACTORY SUPPLIER")
    c.setFont("Helvetica-Bold", 34)
    c.drawString(18 * mm, PAGE_H - 48 * mm, f"{len(products)}-STYLE")
    c.drawString(18 * mm, PAGE_H - 62 * mm, "FOOTWEAR LINE SHEET")
    c.setFillColor(colors.HexColor("#D9E3DE"))
    paragraph(c, "Walking, casual, knit, slip-on and lace-up directions for importers, wholesalers, online sellers and private-label buyers.", 18 * mm, PAGE_H - 73 * mm, 150 * mm, 35 * mm, 11, 15, colors.HexColor("#D9E3DE"))

    hero_y = 83 * mm
    card_w = 82 * mm
    for index, product in enumerate((products[0], products[min(8, len(products) - 1)])):
        x = 18 * mm + index * 88 * mm
        c.setFillColor(WHITE)
        c.roundRect(x, hero_y, card_w, 78 * mm, 3 * mm, fill=1, stroke=0)
        image_path = ROOT / "public" / product["images"][0].lstrip("/")
        image_contain(c, image_path, x + 5 * mm, hero_y + 22 * mm, card_w - 10 * mm, 50 * mm)
        c.setFillColor(FOREST)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 6 * mm, hero_y + 14 * mm, product["code"])
        c.setFont("Helvetica", 7.5)
        paragraph(c, product["name"], x + 6 * mm, hero_y + 11 * mm, card_w - 12 * mm, 9 * mm, 7.5, 9, INK, True)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(18 * mm, 62 * mm, "SAMPLE FIRST. SPECIFICATIONS CONFIRMED BEFORE BULK ORDER.")
    c.setFont("Helvetica", 8.3)
    paragraph(c, "Factory supply and OEM/ODM discussion. Final price depends on selected style, quantity, materials, size ratio, packing and trade requirements.", 18 * mm, 55 * mm, 170 * mm, 22 * mm, 8.3, 11, colors.HexColor("#D9E3DE"))
    c.setFillColor(TERRACOTTA)
    c.roundRect(18 * mm, 24 * mm, 174 * mm, 16 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2, 30 * mm, "BUILD YOUR SHORTLIST AT WWW.BEIQIANG.ONLINE")
    c.showPage()


def product_page(c: canvas.Canvas, products: list[dict], page_number: int, batch_number: int, total_batches: int) -> None:
    header(c, f"Product selection {batch_number} of {total_batches}")
    top = PAGE_H - 32 * mm
    card_h = 47 * mm
    gap = 2.5 * mm
    for index, product in enumerate(products):
        y = top - (index + 1) * card_h - index * gap
        c.setFillColor(CREAM if index % 2 == 0 else WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(16 * mm, y, PAGE_W - 32 * mm, card_h, 2 * mm, fill=1, stroke=1)

        image_x, image_y, image_w, image_h = 20 * mm, y + 4 * mm, 43 * mm, card_h - 8 * mm
        image_path = ROOT / "public" / product["images"][0].lstrip("/")
        image_contain(c, image_path, image_x, image_y, image_w, image_h)

        text_x = 68 * mm
        text_w = 73 * mm
        c.setFillColor(FOREST)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(text_x, y + card_h - 8 * mm, f'{product["code"]}  /  {product["sourceModel"]}')
        product_url = f'https://www.beiqiang.online/products/{product["slug"]}/'
        c.linkURL(product_url, (text_x, y + card_h - 10 * mm, text_x + 44 * mm, y + card_h - 4 * mm), relative=0)
        paragraph(c, product["name"], text_x, y + card_h - 12 * mm, text_w, 15 * mm, 9, 11, INK, True)
        paragraph(c, f'<b>Buyer fit:</b> {product["buyerFit"]}', text_x, y + card_h - 26 * mm, text_w, 11 * mm, 7.3, 9, MUTED)
        highlights = " | ".join(product["highlights"][:3])
        paragraph(c, highlights, text_x, y + 12 * mm, text_w, 10 * mm, 7.1, 8.6, INK)

        facts_x = 145 * mm
        facts_w = 45 * mm
        c.setFillColor(FOREST)
        c.setFont("Helvetica-Bold", 7.2)
        c.drawString(facts_x, y + card_h - 8 * mm, product["closure"].upper())
        paragraph(c, f'<b>Upper:</b> {product["upper"]}', facts_x, y + 35 * mm, facts_w, 9 * mm, 6.5, 7.8, INK)
        paragraph(c, f'<b>Size:</b> {product["size"]}', facts_x, y + 26 * mm, facts_w, 7 * mm, 6.5, 7.8, INK)
        colors_text = ", ".join(product["colors"][:3]) + ("..." if len(product["colors"]) > 3 else "")
        paragraph(c, f'<b>Colors:</b> {colors_text}', facts_x, y + 22 * mm, facts_w, 8 * mm, 6.2, 7.3, INK)
        confirm = "; ".join(product["confirmBeforeQuote"][:2])
        paragraph(c, f'<b>Confirm:</b> {confirm}', facts_x, y + 13 * mm, facts_w, 8 * mm, 6.1, 7.1, TERRACOTTA)

    footer(c, page_number)
    c.showPage()


def closing_page(c: canvas.Canvas, products: list[dict], page_number: int) -> None:
    header(c, "Sourcing and next step")
    c.setFillColor(FOREST)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(16 * mm, PAGE_H - 42 * mm, "FROM SHORTLIST TO ORDER")
    paragraph(c, "A practical B2B path for reducing product, specification and commercial risk before bulk production.", 16 * mm, PAGE_H - 50 * mm, 174 * mm, 22 * mm, 10, 14, MUTED)

    steps = [
        ("01", "SHORTLIST", "Select styles and state market, channel, sample quantity and estimated bulk quantity."),
        ("02", "SPECIFICATION", "Confirm colors, sizes, materials, packing, logo direction and any buyer target values."),
        ("03", "SAMPLE", "Arrange a sample for physical review. A reference image is not an approved sample."),
        ("04", "QUOTATION", "Confirm quantity, price, trade term, lead time, payment and packing in writing."),
        ("05", "ORDER", "Proceed through the agreed Alibaba Trade Assurance order or bilateral contract."),
        ("06", "FULFILLMENT", "Track production, checking, packing and shipment against the confirmed order."),
    ]
    start_y = PAGE_H - 82 * mm
    for index, (number, title, body) in enumerate(steps):
        col = index % 2
        row = index // 2
        x = 16 * mm + col * 89 * mm
        y = start_y - row * 43 * mm
        c.setFillColor(CREAM)
        c.roundRect(x, y - 31 * mm, 84 * mm, 34 * mm, 2 * mm, fill=1, stroke=0)
        c.setFillColor(TERRACOTTA)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(x + 6 * mm, y - 7 * mm, number)
        c.setFillColor(FOREST)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 21 * mm, y - 7 * mm, title)
        paragraph(c, body, x + 6 * mm, y - 13 * mm, 72 * mm, 17 * mm, 7.3, 9.2, INK)

    c.setFillColor(FOREST_DEEP)
    c.roundRect(16 * mm, 31 * mm, 178 * mm, 45 * mm, 3 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(23 * mm, 63 * mm, "REQUEST A SHORTLIST REVIEW")
    paragraph(c, "Send style codes, target market, expected quantity and sample requirement. We will review product facts and open confirmations before final quotation.", 23 * mm, 57 * mm, 110 * mm, 22 * mm, 8.2, 11, colors.HexColor("#D9E3DE"))
    c.setFillColor(TERRACOTTA)
    c.roundRect(140 * mm, 43 * mm, 46 * mm, 19 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(163 * mm, 54 * mm, "REQUEST QUOTE")
    c.setFont("Helvetica", 6.8)
    c.drawCentredString(163 * mm, 49 * mm, "www.beiqiang.online")
    c.linkURL("https://www.beiqiang.online/request-quote/", (140 * mm, 43 * mm, 186 * mm, 62 * mm), relative=0)
    footer(c, page_number)
    c.showPage()


def build() -> None:
    if not DATA.exists():
        raise FileNotFoundError(f"Missing product export: {DATA}")
    products = json.loads(DATA.read_text(encoding="utf-8"))
    if len(products) < 2:
        raise ValueError(f"Expected at least 2 products, found {len(products)}")
    total_batches = (len(products) + 4) // 5
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_COPY.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle(f"Beiqiang Footwear {len(products)}-Style Line Sheet 2026")
    c.setAuthor("Quanzhou Beiqiang Footwear & Apparel Co., Ltd.")
    c.setSubject("B2B footwear sourcing line sheet")
    cover(c, products)
    for batch_index in range(total_batches):
        product_page(c, products[batch_index * 5:(batch_index + 1) * 5], batch_index + 2, batch_index + 1, total_batches)
    closing_page(c, products, total_batches + 2)
    c.save()
    shutil.copy2(OUTPUT, PUBLIC_COPY)
    print(OUTPUT)
    print(PUBLIC_COPY)


if __name__ == "__main__":
    build()
