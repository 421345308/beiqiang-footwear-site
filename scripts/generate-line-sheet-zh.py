from __future__ import annotations

import json
import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "tmp" / "pdfs" / "line-sheet-products-zh.json"
OUTPUT = ROOT / "output" / "pdf" / "beiqiang-footwear-line-sheet-zh-2026.pdf"
PUBLIC_COPY = ROOT / "public" / "downloads" / "beiqiang-footwear-line-sheet-zh-2026.pdf"
FONT_PATH = Path("C:/Windows/Fonts/simhei.ttf")

FOREST = colors.HexColor("#16372C")
FOREST_DEEP = colors.HexColor("#0E251D")
TERRACOTTA = colors.HexColor("#C55B3E")
CREAM = colors.HexColor("#F4F0E7")
INK = colors.HexColor("#1C2420")
MUTED = colors.HexColor("#657069")
LINE = colors.HexColor("#D8D6CE")
WHITE = colors.white
PAGE_W, PAGE_H = A4
CN_FONT = "BeiqiangCN"


def register_fonts() -> None:
    if not FONT_PATH.exists():
        raise FileNotFoundError(f"Missing Chinese font: {FONT_PATH}")
    pdfmetrics.registerFont(TTFont(CN_FONT, str(FONT_PATH)))
    pdfmetrics.registerFontFamily(CN_FONT, normal=CN_FONT, bold=CN_FONT, italic=CN_FONT, boldItalic=CN_FONT)


def paragraph(c: canvas.Canvas, text: str, x: float, y_top: float, width: float, height: float,
              size: float = 8.2, leading: float = 10.2, color=INK) -> float:
    style = ParagraphStyle(
        "line-sheet-zh",
        fontName=CN_FONT,
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceAfter=0,
        wordWrap="CJK",
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
    c.setFont(CN_FONT, 15)
    c.drawString(16 * mm, PAGE_H - 15 * mm, "贝强鞋业 B2B 供应")
    c.setFont(CN_FONT, 8)
    c.drawRightString(PAGE_W - 16 * mm, PAGE_H - 14.5 * mm, section)


def footer(c: canvas.Canvas, page_number: int) -> None:
    c.setStrokeColor(LINE)
    c.line(16 * mm, 13 * mm, PAGE_W - 16 * mm, 13 * mm)
    c.setFillColor(MUTED)
    c.setFont(CN_FONT, 7)
    c.drawString(16 * mm, 8.5 * mm, "www.beiqiang.online/zh/  |  421345308@qq.com  |  WhatsApp +86 189 5980 5256")
    c.drawRightString(PAGE_W - 16 * mm, 8.5 * mm, str(page_number))


def cover(c: canvas.Canvas, products: list[dict]) -> None:
    c.setFillColor(FOREST_DEEP)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(TERRACOTTA)
    c.rect(0, PAGE_H - 9 * mm, PAGE_W, 9 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(CN_FONT, 10)
    c.drawString(18 * mm, PAGE_H - 25 * mm, "泉州鞋类工厂供应商")
    c.setFont(CN_FONT, 32)
    c.drawString(18 * mm, PAGE_H - 49 * mm, f"{len(products)}款")
    c.drawString(18 * mm, PAGE_H - 64 * mm, "鞋类产品目录")
    paragraph(c, "面向进口商、批发商、线上卖家和品牌/私标买家的步行鞋、休闲鞋、针织鞋、套穿与系带产品方向。", 18 * mm, PAGE_H - 76 * mm, 155 * mm, 35 * mm, 11, 16, colors.HexColor("#D9E3DE"))

    hero_y = 83 * mm
    card_w = 82 * mm
    for index, product in enumerate((products[0], products[min(8, len(products) - 1)])):
        x = 18 * mm + index * 88 * mm
        c.setFillColor(WHITE)
        c.roundRect(x, hero_y, card_w, 78 * mm, 3 * mm, fill=1, stroke=0)
        image_path = ROOT / "public" / product["images"][0].lstrip("/")
        image_contain(c, image_path, x + 5 * mm, hero_y + 22 * mm, card_w - 10 * mm, 50 * mm)
        c.setFillColor(FOREST)
        c.setFont(CN_FONT, 11)
        c.drawString(x + 6 * mm, hero_y + 14 * mm, product["code"])
        paragraph(c, product["nameZh"], x + 6 * mm, hero_y + 11 * mm, card_w - 12 * mm, 9 * mm, 7.8, 9.5, INK)

    c.setFillColor(WHITE)
    c.setFont(CN_FONT, 10)
    c.drawString(18 * mm, 62 * mm, "先看样品，再确认大货规格")
    paragraph(c, "工厂供货与OEM/ODM需求讨论。最终价格取决于选定款式、数量、材料、尺码配比、包装和贸易要求。", 18 * mm, 55 * mm, 170 * mm, 22 * mm, 8.5, 12, colors.HexColor("#D9E3DE"))
    c.setFillColor(TERRACOTTA)
    c.roundRect(18 * mm, 24 * mm, 174 * mm, 16 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(CN_FONT, 10)
    c.drawCentredString(PAGE_W / 2, 30 * mm, "在 WWW.BEIQIANG.ONLINE/ZH/ 建立选款清单")
    c.linkURL("https://www.beiqiang.online/zh/products/", (18 * mm, 24 * mm, 192 * mm, 40 * mm), relative=0)
    c.showPage()


def product_page(c: canvas.Canvas, products: list[dict], page_number: int, batch_number: int, total_batches: int) -> None:
    header(c, f"产品选款 第{batch_number}/{total_batches}组")
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
        c.setFont(CN_FONT, 10.5)
        c.drawString(text_x, y + card_h - 8 * mm, f'{product["code"]}  /  {product["sourceModel"]}')
        product_url = f'https://www.beiqiang.online/zh/products/{product["slug"]}/'
        c.linkURL(product_url, (text_x, y + card_h - 10 * mm, text_x + 44 * mm, y + card_h - 4 * mm), relative=0)
        paragraph(c, product["nameZh"], text_x, y + card_h - 12 * mm, text_w, 12 * mm, 8.5, 10.5, INK)
        paragraph(c, f'<b>适合买家：</b>{product["buyerFitZh"]}', text_x, y + card_h - 24 * mm, text_w, 11 * mm, 7, 9, MUTED)
        evidence = "｜".join(product.get("evidenceHighlightsZh", [])[:2])
        paragraph(c, evidence or product["summaryZh"], text_x, y + 12 * mm, text_w, 10 * mm, 6.8, 8.3, INK)

        facts_x = 145 * mm
        facts_w = 45 * mm
        c.setFillColor(FOREST)
        c.setFont(CN_FONT, 7.2)
        c.drawString(facts_x, y + card_h - 8 * mm, product["closureZh"])
        paragraph(c, f'<b>鞋面：</b>{product["upperZh"]}', facts_x, y + 35 * mm, facts_w, 9 * mm, 6.4, 7.8, INK)
        paragraph(c, f'<b>尺码：</b>{product["sizeZh"]}', facts_x, y + 26 * mm, facts_w, 7 * mm, 6.4, 7.8, INK)
        colors_text = "、".join(product["colorsZh"][:3]) + ("……" if len(product["colorsZh"]) > 3 else "")
        paragraph(c, f'<b>颜色：</b>{colors_text}', facts_x, y + 22 * mm, facts_w, 8 * mm, 6.1, 7.3, INK)
        confirm = "；".join(product["confirmBeforeQuoteZh"][:2])
        paragraph(c, f'<b>确认：</b>{confirm}', facts_x, y + 13 * mm, facts_w, 8 * mm, 6, 7.1, TERRACOTTA)

    footer(c, page_number)
    c.showPage()


def closing_page(c: canvas.Canvas, page_number: int) -> None:
    header(c, "采购路径与下一步")
    c.setFillColor(FOREST)
    c.setFont(CN_FONT, 23)
    c.drawString(16 * mm, PAGE_H - 42 * mm, "从选款到正式订单")
    paragraph(c, "在大货生产前，用结构化采购资料减少产品、规格和商业条款风险。", 16 * mm, PAGE_H - 50 * mm, 174 * mm, 22 * mm, 10, 14, MUTED)

    steps = [
        ("01", "选款", "提供款号、目标市场、渠道、样品数量和预计大货数量。"),
        ("02", "规格", "核对颜色、尺码、材料、包装、Logo方向和买家目标。"),
        ("03", "样品", "安排实物样品审核；参考图片不等于已批准样品。"),
        ("04", "报价", "书面确认数量、价格、贸易术语、交期、付款和包装。"),
        ("05", "正式订单", "通过约定的Alibaba Trade Assurance订单或双方合同承接。"),
        ("06", "履约", "按已确认订单跟进生产、检查、包装和发运。"),
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
        c.setFont(CN_FONT, 14)
        c.drawString(x + 6 * mm, y - 7 * mm, number)
        c.setFillColor(FOREST)
        c.setFont(CN_FONT, 9)
        c.drawString(x + 21 * mm, y - 7 * mm, title)
        paragraph(c, body, x + 6 * mm, y - 13 * mm, 72 * mm, 17 * mm, 7.3, 9.5, INK)

    c.setFillColor(FOREST_DEEP)
    c.roundRect(16 * mm, 31 * mm, 178 * mm, 45 * mm, 3 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(CN_FONT, 15)
    c.drawString(23 * mm, 63 * mm, "提交选款与报价需求")
    paragraph(c, "发送候选款号、目标市场、预计数量和样品要求。贝强将先审核产品事实与待确认项，再讨论最终报价。", 23 * mm, 57 * mm, 110 * mm, 22 * mm, 8.2, 11.5, colors.HexColor("#D9E3DE"))
    c.setFillColor(TERRACOTTA)
    c.roundRect(140 * mm, 43 * mm, 46 * mm, 19 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(CN_FONT, 8)
    c.drawCentredString(163 * mm, 54 * mm, "建立询价")
    c.setFont(CN_FONT, 6.8)
    c.drawCentredString(163 * mm, 49 * mm, "www.beiqiang.online/zh/")
    c.linkURL("https://www.beiqiang.online/zh/request-quote/", (140 * mm, 43 * mm, 186 * mm, 62 * mm), relative=0)
    footer(c, page_number)
    c.showPage()


def build() -> None:
    register_fonts()
    if not DATA.exists():
        raise FileNotFoundError(f"Missing Chinese product export: {DATA}")
    products = json.loads(DATA.read_text(encoding="utf-8"))
    if len(products) < 2:
        raise ValueError(f"Expected at least 2 products, found {len(products)}")
    total_batches = (len(products) + 4) // 5
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_COPY.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle(f"贝强鞋业{len(products)}款鞋类产品目录 2026")
    c.setAuthor("泉州贝强鞋业服饰有限公司")
    c.setSubject("B2B鞋类采购产品目录")
    cover(c, products)
    for batch_index in range(total_batches):
        product_page(c, products[batch_index * 5:(batch_index + 1) * 5], batch_index + 2, batch_index + 1, total_batches)
    closing_page(c, total_batches + 2)
    c.save()
    shutil.copy2(OUTPUT, PUBLIC_COPY)
    print(OUTPUT)
    print(PUBLIC_COPY)


if __name__ == "__main__":
    build()
