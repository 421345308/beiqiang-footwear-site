"""Localized catalogue from the same verified products used by the website."""
import json, math, shutil, sys
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
W,H=A4
INK=colors.HexColor('#252620'); MUTED=colors.HexColor('#65665e'); PAPER=colors.HexColor('#f8f7f3'); LINE=colors.HexColor('#deddd5')
def text(c,value,x,top,width,size=10,bold=False,max_height=None):
    p=Paragraph(escape(value),ParagraphStyle('copy',fontName='Helvetica-Bold' if bold else 'Helvetica',fontSize=size,leading=size*1.3,textColor=INK))
    _,height=p.wrap(width,H)
    if max_height and height>max_height: raise ValueError(f'Text overflow ({height} > {max_height}): {value}')
    p.drawOn(c,x,top-height)
    return height
def photo(c,path,x,y,w,h):
    im=ImageReader(str(ROOT/'public'/path.lstrip('/')));iw,ih=im.getSize();s=min(w/iw,h/ih)
    c.drawImage(im,x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s,mask='auto')
def base(c,s,page):
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    text(c,'BEIQIANG',34,H-28,300,17,True)
    text(c,s['locale'].upper(),W-65,H-31,40,10)
    c.setStrokeColor(LINE);c.line(34,36,W-34,36)
    text(c,'www.beiqiang.online | shepeiqiang@gmail.com',34,27,W-100,8)
    text(c,str(page),W-55,27,25,8)
def generate(s):
    name=f"beiqiang-footwear-line-sheet-{s['locale']}-2026.pdf"
    out=ROOT/'output/pdf'/name;out.parent.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(out),pagesize=A4,invariant=1,lang=s['locale']);c.setTitle(f"Beiqiang | {s['title']}");c.setAuthor('Quanzhou Beiqiang Footwear & Apparel Co., Ltd.')
    base(c,s,1);text(c,s['title'],34,H-105,W-68,30,True,100)
    text(c,f"{len(s['products'])} | 2026",34,H-205,W-68,18)
    text(c,s['intro'],34,H-245,W-68,12,max_height=90)
    photo(c,s['products'][2]['image'],70,220,W-140,235)
    text(c,s['supply'],34,190,W-68,11,max_height=95)
    text(c,s['boundary'],34,87,W-68,9,max_height=40);c.showPage()
    for offset in range(0,len(s['products']),4):
        base(c,s,offset//4+2)
        for row,p in enumerate(s['products'][offset:offset+4]):
            top=H-78-row*174
            c.setFillColor(colors.white);c.roundRect(34,top-160,W-68,160,5,fill=1,stroke=0)
            photo(c,p['image'],43,top-145,126,126)
            x=183;width=W-x-46;y=top-10
            y-=text(c,p['code']+' | '+p['title'],x,y,width,10,True,40)+5
            y-=text(c,p['supply'],x,y,width,8,max_height=22)+5
            facts=f"{s['labels']['closure']}: {p['closure']} · {s['labels']['sizes']}: {p['size']}"
            y-=text(c,facts,x,y,width,8,max_height=25)+3
            y-=text(c,f"{s['labels']['upper']}: {p['upper']} · {s['labels']['sole']}: {p['sole']}",x,y,width,8,max_height=25)+3
            y-=text(c,f"{s['labels']['colour']}: {', '.join(p['colours'])}",x,y,width,8,max_height=34)+4
            if y<top-145: raise ValueError(f"Card overflow: {s['locale']} {p['code']}")
            url=f"https://www.beiqiang.online/{s['locale']}/products/{p['slug']}/"
            text(c,s['labels']['view']+' >',x,top-144,width,8,True)
            c.linkURL(url,(34,top-160,W-34,top),relative=0)
        c.showPage()
    base(c,s,math.ceil(len(s['products'])/4)+2)
    text(c,s['contact'],34,H-110,W-68,29,True,80)
    y=H-220
    for value in [s['intro'],s['supply'],s['boundary']]:y-=text(c,value,34,y,W-68,12,max_height=100)+35
    url=f"https://www.beiqiang.online/{s['locale']}/request-quote/"
    text(c,url,34,210,W-68,11,True);c.linkURL(url,(34,185,W-34,215),relative=0)
    text(c,'Quanzhou Beiqiang Footwear & Apparel Co., Ltd.',34,150,W-68,10)
    text(c,'shepeiqiang@gmail.com | WhatsApp +86 189 5980 5256',34,125,W-68,10)
    c.showPage();c.save()
    target=ROOT/'public/downloads'/name;shutil.copyfile(out,target);print(target)
for sheet in json.loads(Path(sys.argv[1]).read_text('utf-8')):generate(sheet)
