from pathlib import Path
import json
from PIL import Image, ImageOps

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = Path(__file__).with_name("catalog-import-manifest.json")
DEFAULT_FILES = ["01_main.jpg", "02_upper.jpg", "03_structure.jpg", "04_sole.jpg", "05_colors.jpg", "06_scene.jpg"]
OUTPUT_NAMES = ["01_main.jpg", "02_upper.jpg", "03_structure.jpg", "04_sole.jpg", "05_colors.jpg", "06_scene.jpg"]


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    source_root = (PROJECT_ROOT / manifest["sourceRoot"]).resolve()
    output_root = PROJECT_ROOT / "public" / "catalog"
    seen: set[str] = set()

    for item in manifest["products"]:
        code = item["code"]
        if code in seen:
            raise SystemExit(f"Duplicate catalogue code in import manifest: {code}")
        seen.add(code)
        source_dir = source_root / item["sourceDirectory"] / "01_主图"
        files = item.get("files", DEFAULT_FILES)
        if len(files) != 6:
            raise SystemExit(f"{code} must provide exactly six approved main images")
        destination_dir = output_root / code.lower()
        destination_dir.mkdir(parents=True, exist_ok=True)
        for source_name, output_name in zip(files, OUTPUT_NAMES):
            source = source_dir / source_name
            if not source.is_file():
                raise SystemExit(f"Missing approved source image for {code}: {source}")
            with Image.open(source) as raw:
                image = ImageOps.exif_transpose(raw).convert("RGB")
                image.save(destination_dir / output_name, "JPEG", quality=92, optimize=True, progressive=True)
        print(f"Imported {code}: {len(files)} approved images")


if __name__ == "__main__":
    main()
