"""Converts the rendered card art (src/assets/art/*.png) to WebP, about 4× smaller. Needs Pillow."""
import glob, os
from PIL import Image
for f in glob.glob(os.path.join(os.path.dirname(__file__), "../../src/assets/art/*.png")):
    Image.open(f).save(f[:-4] + ".webp", "WEBP", quality=88, method=6)
    os.remove(f)
