"""Converts the rendered card art (src/assets/art/*.png) to WebP, about 4× smaller.
Uses Pillow if it's installed, otherwise the `cwebp` command (brew install webp)."""
import glob, os, shutil, subprocess
try:
    from PIL import Image
except ImportError:
    Image = None
if Image is None and not shutil.which("cwebp"):
    raise SystemExit("Necesitas Pillow (pip install pillow) o cwebp (brew install webp).")
for f in glob.glob(os.path.join(os.path.dirname(__file__), "../../src/assets/art/*.png")):
    out = f[:-4] + ".webp"
    if Image is not None:
        Image.open(f).save(out, "WEBP", quality=88, method=6)
    else:
        subprocess.run(["cwebp", "-quiet", "-q", "88", "-m", "6", "-alpha_q", "100", f, "-o", out], check=True)
    os.remove(f)
