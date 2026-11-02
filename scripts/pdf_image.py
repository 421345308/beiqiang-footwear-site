"""Prepare appropriately sized catalogue photographs for lightweight PDFs."""
from hashlib import sha256
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "tmp" / "pdfs" / "catalogue-images"


def for_pdf(source: Path) -> Path:
    """Resize without cropping or changing the product's appearance."""
    key = sha256(source.read_bytes()).hexdigest()
    destination = CACHE / f"600q72-{key}.jpg"
    if not destination.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as raw:
            image = ImageOps.exif_transpose(raw).convert("RGB")
            image.thumbnail((600, 600), Image.Resampling.LANCZOS)
            image.save(destination, "JPEG", quality=72, optimize=True, progressive=True)
    return destination
