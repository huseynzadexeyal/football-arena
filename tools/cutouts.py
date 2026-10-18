"""Builds card-ready transparent cutouts from the raw player photos.
Usage: python3 cutouts.py <players_dir> <out_dir>
"""
import sys, os
import numpy as np, cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def load(name):
    im = Image.open(os.path.join(src, name)).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return cv2.cvtColor(np.array(bg.convert("RGB")), cv2.COLOR_RGB2BGR)

def border_connected(mask, sides="tlrb"):
    """keep only mask components that touch the given image sides"""
    n, lab = cv2.connectedComponents(mask.astype(np.uint8))
    keep = set()
    h, w = mask.shape
    if "t" in sides: keep |= set(lab[0, :].tolist())
    if "b" in sides: keep |= set(lab[h - 1, :].tolist())
    if "l" in sides: keep |= set(lab[:, 0].tolist())
    if "r" in sides: keep |= set(lab[:, w - 1].tolist())
    keep.discard(0)
    return np.isin(lab, list(keep))

def finish(bgr, alpha, name, crop=None, max_h=900):
    alpha = alpha.astype(np.uint8)
    if name == "bellingham.png":
        b, g, r = [bgr[:, :, i].astype(int) for i in range(3)]
        h_, w_ = alpha.shape
        yy, xx = np.mgrid[0:h_, 0:w_]
        wedge = (xx < 440) & (yy > 330) & (g > 0.78 * r) & (b < 120) & (r > 150)
        alpha[wedge] = 0
    # clean: keep the largest blob, close tiny holes, feather the edge
    n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 127).astype(np.uint8))
    if n > 1:
        big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        alpha = np.where(lab == big, alpha, 0).astype(np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    alpha = cv2.erode(alpha, np.ones((2, 2), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 1.1)
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    if crop:
        x0, y0, x1, y1 = crop
        rgba = rgba[y0:y1, x0:x1]
    ys, xs = np.where(rgba[:, :, 3] > 10)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = rgba.shape[:2]
    if name == "bellingham.png":
        rgba[int(h * 0.815):, : int(w * 0.27), 3] = 0  # leftover gold wedge below the ear
    if h > max_h:
        rgba = cv2.resize(rgba, (int(w * max_h / h), max_h), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(out, name), rgba)
    print(name, rgba.shape[1], "x", rgba.shape[0])

def white_bg(name, out_name, thr=238, crop=None):
    bgr = load(name)
    bright = (bgr.min(axis=2) > thr)
    bg = border_connected(bright)
    finish(bgr, (~bg) * 255, out_name, crop)

def grabcut(name, out_name, rect, crop=None, iters=6, probable_fg=None):
    bgr = load(name)
    mask = np.full(bgr.shape[:2], cv2.GC_BGD, np.uint8)
    x0, y0, x1, y1 = rect
    mask[y0:y1, x0:x1] = cv2.GC_PR_FGD
    if probable_fg:
        a, b, c, d = probable_fg
        mask[b:d, a:c] = cv2.GC_FGD
    bgm = np.zeros((1, 65), np.float64); fgm = np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bgm, fgm, iters, cv2.GC_INIT_WITH_MASK)
    alpha = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0)
    finish(bgr, alpha, out_name, crop)

def checker_bg(name, out_name, crop=None):
    bgr = load(name).astype(int)
    gray = (bgr.max(axis=2) - bgr.min(axis=2)) < 10
    light = bgr.min(axis=2) >= 192
    cand = (gray & light).astype(np.uint8)
    # break thin bridges between figure and background, then keep what touches top/left/right
    opened = cv2.morphologyEx(cand, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    bg = border_connected(opened, "tlr")
    # enclosed pockets (between arm and body): checker squares are pure gray ~205, jersey whites are not
    n, lab = cv2.connectedComponents(opened)
    mid = (bgr.max(axis=2) >= 196) & (bgr.max(axis=2) <= 214)
    for i in range(1, n):
        comp = lab == i
        if comp.sum() > 30 and mid[comp].mean() > 0.18:
            bg |= comp
    bg = cv2.dilate(bg.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & (cand > 0)
    finish(bgr.astype(np.uint8), (~bg) * 255, out_name, crop)

def soft_ellipse(name, out_name, crop, max_h=900):
    """For illustrations that cannot be cut cleanly: crop and fade the edges into the card."""
    bgr = load(name)
    x0, y0, x1, y1 = crop
    bgr = bgr[y0:y1, x0:x1]
    h, w = bgr.shape[:2]
    white = border_connected(bgr.min(axis=2) > 222)
    white = cv2.dilate(white.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * 0.46) / (h * 0.54)) ** 2)
    alpha = np.clip((1.0 - d) / 0.28, 0, 1) * (~white)
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 1.2)
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = (alpha * 255).astype(np.uint8)
    rgba = cv2.resize(rgba, (int(w * 2), int(h * 2)), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(os.path.join(out, out_name), rgba)
    print(out_name, rgba.shape[1], "x", rgba.shape[0])

if __name__ == "__main__":
    which = sys.argv[3:] or ["all"]
    jobs = {
        "de-bruyne": lambda: white_bg("de-bruyne.png", "de-bruyne.png"),
        "vinicius": lambda: white_bg("vinicius.png", "vinicius.png"),
        "bellingham": lambda: grabcut("bellingham.png", "bellingham.png", (372, 140, 650, 545), probable_fg=(440, 230, 580, 470)),
        "haaland": lambda: grabcut("haaland.png", "haaland.png", (125, 75, 455, 372), probable_fg=(230, 190, 350, 330)),
        "ronaldo": lambda: soft_ellipse("ronaldo.png", "ronaldo.png", (45, 25, 245, 200)),
        "mbappe": lambda: soft_ellipse("mbappe.png", "mbappe.png", (60, 0, 250, 180)),
        "messi": lambda: checker_bg("messi.png", "messi.png"),
    }
    for k, f in jobs.items():
        if "all" in which or k in which: f()
