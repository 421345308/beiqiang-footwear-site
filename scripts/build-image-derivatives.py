from pathlib import Path
import json
from PIL import Image, ImageOps

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = PROJECT_ROOT / "public"
CATALOG_ROOT = PUBLIC_ROOT / "catalog"
THUMB_ROOT = PUBLIC_ROOT / "catalog-thumbs"
CATALOG_WEB_ROOT = PUBLIC_ROOT / "catalog-web"
CATALOG_MANIFEST = PROJECT_ROOT / "app" / "data" / "catalog-images.json"
FACTORY_ROOT = PUBLIC_ROOT / "factory"
FACTORY_WEB_ROOT = PUBLIC_ROOT / "factory-web"


def rgb_image(source: Path) -> Image.Image:
    raw = Image.open(source)
    transposed = ImageOps.exif_transpose(raw).convert("RGB")
    raw.close()
    return transposed


def build_catalog() -> tuple[int, int, int]:
    manifest = json.loads(CATALOG_MANIFEST.read_text(encoding="utf-8"))
    main_sources = sorted(CATALOG_ROOT.glob("bq[0-9][0-9][0-9]/01_main.jpg"))
    all_sources = sorted(CATALOG_ROOT.glob("bq[0-9][0-9][0-9]/*.jpg"))
    actual_slugs = [source.parent.name for source in main_sources]
    if actual_slugs != sorted(manifest):
        raise SystemExit("Catalogue main images do not match catalog-images.json; run npm run catalog:sync")

    THUMB_ROOT.mkdir(parents=True, exist_ok=True)
    CATALOG_WEB_ROOT.mkdir(parents=True, exist_ok=True)
    source_bytes = sum(source.stat().st_size for source in all_sources)

    for source in main_sources:
        destination = THUMB_ROOT / f"{source.parent.name}.webp"
        image = rgb_image(source)
        thumbnail = ImageOps.fit(image, (640, 640), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        thumbnail.save(destination, "WEBP", quality=78, method=6, exact=True)
        image.close()

    for source in all_sources:
        destination_dir = CATALOG_WEB_ROOT / source.parent.name
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / f"{source.stem}.webp"
        image = rgb_image(source)
        image.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        image.save(destination, "WEBP", quality=80, method=6, exact=True)
        image.close()

    output_bytes = sum(path.stat().st_size for path in CATALOG_WEB_ROOT.rglob("*.webp"))
    thumb_bytes = sum(path.stat().st_size for path in THUMB_ROOT.glob("*.webp"))
    return source_bytes, output_bytes, thumb_bytes


def build_factory() -> tuple[int, int, int]:
    sources = sorted(path for path in FACTORY_ROOT.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".png"})
    FACTORY_WEB_ROOT.mkdir(parents=True, exist_ok=True)
    source_bytes = sum(source.stat().st_size for source in sources)
    for source in sources:
        image = rgb_image(source)
        image.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
        image.save(FACTORY_WEB_ROOT / f"{source.stem}.webp", "WEBP", quality=80, method=6, exact=True)
        image.close()
    output_bytes = sum(path.stat().st_size for path in FACTORY_WEB_ROOT.glob("*.webp"))
    return len(sources), source_bytes, output_bytes


def build_social_preview() -> tuple[int, int]:
    source = PUBLIC_ROOT / "og.png"
    destination = PUBLIC_ROOT / "og.jpg"
    image = rgb_image(source)
    image.save(destination, "JPEG", quality=84, optimize=True, progressive=True)
    image.close()
    return source.stat().st_size, destination.stat().st_size


def mb(value: int) -> str:
    return f"{value / 1024 / 1024:.2f} MB"


def main() -> None:
    catalog_source, catalog_web, thumbs = build_catalog()
    factory_count, factory_source, factory_web = build_factory()
    social_source, social_output = build_social_preview()
    print(f"Catalogue originals: {mb(catalog_source)} -> web gallery {mb(catalog_web)}")
    print(f"{len(json.loads(CATALOG_MANIFEST.read_text(encoding='utf-8')))} catalogue thumbnails: {mb(thumbs)}")
    print(f"{factory_count} factory originals: {mb(factory_source)} -> web evidence {mb(factory_web)}")
    print(f"Social preview: {mb(social_source)} -> {mb(social_output)}")


if __name__ == "__main__":
    main()
