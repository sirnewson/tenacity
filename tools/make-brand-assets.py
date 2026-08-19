"""
Brand-asset generator for the YXM Creator Tool.

Builds the price-tag plates (and, for clients with no artwork yet, a full set of
placeholder poster templates + wordmark) straight from a small JSON brief, so a
demo can be re-skinned for a new client in minutes.

    python tools/make-brand-assets.py                 # every brief in tools/briefs
    python tools/make-brand-assets.py wanjey          # just one

Output goes to public/brand/<slug>/. Requires Pillow (pip install pillow).
"""

import glob
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRIEFS = os.path.join(ROOT, "tools", "briefs")

POST = (1080, 1350)  # 4:5
REEL = (1080, 1920)  # 9:16

FONT_DIRS = [r"C:\Windows\Fonts", "/usr/share/fonts/truetype/dejavu", "/Library/Fonts"]
FONT_BLACK = ["seguibl.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf", "Arial Bold.ttf"]
FONT_BOLD = ["segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf", "Arial Bold.ttf"]
WHITE = (255, 255, 255)


def font(names, size):
    for d in FONT_DIRS:
        for n in names:
            p = os.path.join(d, n)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def mix(c1, c2, t):
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))


def gradient(size, c1, c2, horizontal=True):
    """Solid RGB gradient tile — alpha is applied afterwards via a mask."""
    w, h = size
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    n = w if horizontal else h
    for i in range(n):
        c = mix(c1, c2, i / max(n - 1, 1))
        d.line([(i, 0), (i, h)] if horizontal else [(0, i), (w, i)], fill=c)
    return img


def rounded_mask(size, radius, alpha=255):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=alpha)
    return m


def panel(canvas, box, c1, c2, radius, horizontal=True, shadow=28, border=0,
          border_color=WHITE, alpha=255):
    """Gradient rounded panel with a soft drop shadow."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0

    if shadow:
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sm = Image.new("L", canvas.size, 0)
        sm.paste(rounded_mask((w, h), radius, 130), (x0, y0 + shadow // 3))
        sh.putalpha(sm.filter(ImageFilter.GaussianBlur(shadow / 2)))
        canvas.alpha_composite(sh)

    tile = gradient((w, h), c1, c2, horizontal).convert("RGBA")
    tile.putalpha(rounded_mask((w, h), radius, alpha))
    if border:
        ImageDraw.Draw(tile).rounded_rectangle(
            [border // 2, border // 2, w - 1 - border // 2, h - 1 - border // 2],
            radius, outline=border_color, width=border,
        )
    canvas.alpha_composite(tile, (x0, y0))


def text_w(draw, txt, f):
    return draw.textbbox((0, 0), txt, font=f)[2]


def new(size):
    return Image.new("RGBA", size, (0, 0, 0, 0))


class Brand:
    def __init__(self, cfg):
        self.cfg = cfg
        self.slug = cfg["slug"]
        self.name = cfg["brandName"]
        self.logo_text = cfg.get("logoText", cfg["brandName"])
        self.phone = cfg.get("phone", "")
        self.site = cfg.get("website", "")
        self.primary = hex_rgb(cfg["primary"])
        self.accent = hex_rgb(cfg["accent"])
        self.dark = hex_rgb(cfg.get("dark", "#0B0B0F"))
        # Tags are app furniture, so they may follow the app's own accent
        # rather than the client's template colours.
        self.tag_primary = hex_rgb(cfg.get("tagPrimary", cfg["primary"]))
        self.tag_accent = hex_rgb(cfg.get("tagAccent", cfg["accent"]))
        self.out = os.path.join(ROOT, "public", "brand", self.slug)

    def save(self, img, name):
        os.makedirs(self.out, exist_ok=True)
        img.save(os.path.join(self.out, name))
        print("  ->", os.path.relpath(os.path.join(self.out, name), ROOT))

    # ------------------------------------------------------------ price tags
    def tag(self, left, right, border_color):
        """982x319 price plate. The geometry here must stay in sync with the
        text percentages in CameraStep.jsx and StudioContext.mergeFinalPoster()."""
        img = new((982, 319))
        panel(img, (40, 30, 700, 278), left[0], left[1], 44, shadow=26)
        panel(img, (490, 44, 950, 262), right[0], right[1], 38, shadow=30,
              border=7, border_color=border_color)
        return img

    def tags(self):
        p, a, d = self.tag_primary, self.tag_accent, self.dark
        self.save(self.tag((mix(d, p, 0.3), d), (p, a), WHITE), "tag-brand.png")
        self.save(self.tag((d, (26, 26, 32)), ((22, 22, 28), mix(d, p, 0.55)), p), "tag-dark.png")
        self.save(self.tag((mix(d, a, 0.5), mix(d, a, 0.15)), (a, mix(a, p, 0.5)), WHITE),
                  "tag-accent.png")

    # ------------------------------------------------- placeholder templates
    def tpl_footer_bar(self):
        img, (W, H) = new(POST), POST
        ImageDraw.Draw(img).rectangle([0, H - 118, W, H - 62], fill=self.primary + (255,))
        panel(img, (108, H - 158, W - 108, H - 22), WHITE, (244, 246, 250), 68, shadow=34)
        d = ImageDraw.Draw(img)
        fn, fp = font(FONT_BLACK, 46), font(FONT_BLACK, 58)
        gap = 40
        x = (W - (text_w(d, self.name, fn) + gap + text_w(d, self.phone, fp))) / 2
        d.text((x, H - 90), self.name, font=fn, fill=self.dark + (255,), anchor="lm")
        d.text((x + text_w(d, self.name, fn) + gap, H - 90), self.phone, font=fp,
               fill=self.primary + (255,), anchor="lm")
        return img

    def tpl_top_banner(self):
        img, (W, H) = new(POST), POST
        panel(img, (0, 0, W, 148), self.primary, mix(self.primary, self.dark, 0.45), 0, shadow=26)
        d = ImageDraw.Draw(img)
        d.text((60, 74), self.name, font=font(FONT_BLACK, 52), fill=WHITE + (255,), anchor="lm")
        d.text((W - 60, 74), self.phone, font=font(FONT_BOLD, 44), fill=WHITE + (235,), anchor="rm")
        d.rectangle([0, 148, W, 160], fill=self.accent + (255,))
        panel(img, (W // 2 - 250, H - 108, W // 2 + 250, H - 32), self.dark,
              mix(self.dark, self.primary, 0.35), 38, shadow=22, alpha=225)
        ImageDraw.Draw(img).text((W // 2, H - 70), self.site.upper(), font=font(FONT_BOLD, 34),
                                 fill=WHITE + (240,), anchor="mm")
        return img

    def tpl_side_stripes(self):
        img, (W, H) = new(POST), POST
        for x0 in (0, W - 38):
            img.alpha_composite(gradient((38, H), self.primary, self.accent, False).convert("RGBA"),
                                (x0, 0))
        panel(img, (70, H - 150, W - 70, H - 48), self.dark, mix(self.dark, self.primary, 0.5),
              51, shadow=30, alpha=232)
        d = ImageDraw.Draw(img)
        fn, fp = font(FONT_BLACK, 42), font(FONT_BLACK, 48)
        gap = 36
        x = (W - (text_w(d, self.name, fn) + gap + text_w(d, self.phone, fp))) / 2
        d.text((x, H - 99), self.name, font=fn, fill=WHITE + (255,), anchor="lm")
        d.text((x + text_w(d, self.name, fn) + gap, H - 99), self.phone, font=fp,
               fill=self.accent + (255,), anchor="lm")
        return img

    def tpl_full_frame(self):
        img, (W, H) = new(POST), POST
        d = ImageDraw.Draw(img)
        d.rounded_rectangle([26, 26, W - 26, H - 26], 46, outline=self.primary + (255,), width=16)
        d.rounded_rectangle([54, 54, W - 54, H - 54], 30, outline=WHITE + (110,), width=3)
        panel(img, (64, 64, 348, 176), self.accent, mix(self.accent, self.primary, 0.35), 56,
              shadow=24)
        d = ImageDraw.Draw(img)
        d.text((206, 120), self.cfg.get("badge", "NEW"), font=font(FONT_BLACK, 62),
               fill=self.dark + (255,), anchor="mm")
        panel(img, (64, H - 190, W - 64, H - 64), self.dark, mix(self.dark, self.primary, 0.4),
              46, shadow=26, alpha=235)
        d = ImageDraw.Draw(img)
        d.text((110, H - 127), self.name, font=font(FONT_BLACK, 44), fill=WHITE + (255,), anchor="lm")
        d.text((W - 110, H - 127), self.phone, font=font(FONT_BLACK, 50), fill=self.accent + (255,),
               anchor="rm")
        return img

    def tpl_reel(self):
        img, (W, H) = new(REEL), REEL
        fade = Image.new("RGBA", (W, 560), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fade)
        for i in range(560):
            fd.line([(0, i), (W, i)], fill=self.dark + (int(235 * (i / 559) ** 1.4),))
        img.alpha_composite(fade, (0, H - 560))
        panel(img, (W // 2 - 290, 96, W // 2 + 290, 212), self.primary,
              mix(self.primary, self.accent, 0.6), 58, shadow=30)
        d = ImageDraw.Draw(img)
        d.text((W // 2, 154), self.name, font=font(FONT_BLACK, 54), fill=WHITE + (255,), anchor="mm")
        d.text((W // 2, H - 372), self.cfg.get("tagline", ""), font=font(FONT_BOLD, 40),
               fill=WHITE + (220,), anchor="mm")
        d.text((W // 2, H - 286), self.phone, font=font(FONT_BLACK, 96), fill=WHITE + (255,),
               anchor="mm")
        d.line([(W // 2 - 190, H - 222), (W // 2 + 190, H - 222)], fill=self.accent + (255,), width=7)
        d.text((W // 2, H - 160), self.site.upper(), font=font(FONT_BOLD, 40),
               fill=self.accent + (255,), anchor="mm")
        return img

    def tpl_promo_ribbon(self):
        """Corner ribbon + footer — the "OFFER" / "FOR SALE" workhorse."""
        img, (W, H) = new(POST), POST
        panel(img, (-30, 96, 470, 214), self.accent, mix(self.accent, self.primary, 0.45), 0,
              shadow=28)
        d = ImageDraw.Draw(img)
        d.text((70, 155), self.cfg.get("badge", "OFFER"), font=font(FONT_BLACK, 66),
               fill=WHITE + (255,), anchor="lm")
        d.polygon([(470, 96), (470, 214), (524, 155)], fill=self.accent + (255,))

        panel(img, (0, H - 170, W, H), self.dark, mix(self.dark, self.primary, 0.45), 0,
              shadow=0, alpha=238)
        d = ImageDraw.Draw(img)
        d.text((64, H - 108), self.name, font=font(FONT_BLACK, 46), fill=WHITE + (255,), anchor="lm")
        d.text((64, H - 56), self.site.upper(), font=font(FONT_BOLD, 28),
               fill=WHITE + (170,), anchor="lm")
        d.text((W - 64, H - 84), self.phone, font=font(FONT_BLACK, 52),
               fill=self.primary + (255,), anchor="rm")
        return img

    def tpl_spec_strip(self):
        """Three fact cells over a footer — beds/baths/size, watts, pack size."""
        img, (W, H) = new(POST), POST
        specs = self.cfg.get("specs", ["FACT ONE", "FACT TWO", "FACT THREE"])[:3]
        cell_w = (W - 128) // 3
        top = H - 300
        for i, text in enumerate(specs):
            x0 = 64 + i * cell_w
            panel(img, (x0 + 6, top, x0 + cell_w - 6, top + 104), WHITE, (243, 245, 249), 20,
                  shadow=20)
            d = ImageDraw.Draw(img)
            d.text((x0 + cell_w / 2, top + 52), text, font=font(FONT_BLACK, 34),
                   fill=self.dark + (255,), anchor="mm")

        panel(img, (0, H - 168, W, H), self.primary, mix(self.primary, self.dark, 0.55), 0,
              shadow=0)
        d = ImageDraw.Draw(img)
        d.text((64, H - 106), self.name, font=font(FONT_BLACK, 46), fill=WHITE + (255,), anchor="lm")
        d.text((64, H - 54), self.site.upper(), font=font(FONT_BOLD, 28), fill=WHITE + (185,),
               anchor="lm")
        d.text((W - 64, H - 82), self.phone, font=font(FONT_BLACK, 50), fill=WHITE + (255,),
               anchor="rm")
        return img

    def logo(self):
        """Wordmark placeholder. Drawn as a hollow mark + text in one solid
        colour so it still reads after the UI flattens it to black or white.
        The canvas is sized to the text, so a long name is never clipped."""
        size = 150
        f = font(FONT_BLACK, size)
        probe = ImageDraw.Draw(new((10, 10)))
        # Long names step down until the wordmark stays a sensible width.
        while text_w(probe, self.logo_text, f) > 1900 and size > 60:
            size -= 10
            f = font(FONT_BLACK, size)

        text_x = 280
        width = text_x + text_w(probe, self.logo_text, f) + 60
        img = new((int(width), 320))
        d = ImageDraw.Draw(img)
        d.regular_polygon((120, 160, 104), 4, outline=self.primary + (255,), width=26)
        d.regular_polygon((120, 160, 40), 4, fill=self.primary + (255,))
        d.text((text_x, 160), self.logo_text, font=f, fill=self.primary + (255,), anchor="lm")
        return img.crop(img.getchannel("A").getbbox())

    def builders(self):
        return {
            "footer-bar": self.tpl_footer_bar,
            "top-banner": self.tpl_top_banner,
            "side-stripes": self.tpl_side_stripes,
            "full-frame": self.tpl_full_frame,
            "reel": self.tpl_reel,
            "promo-ribbon": self.tpl_promo_ribbon,
            "spec-strip": self.tpl_spec_strip,
        }

    def build(self):
        print(f"[{self.slug}] {self.name}")
        self.tags()
        wanted = self.cfg.get("templates")
        if wanted is None and self.cfg.get("generateTemplates"):
            wanted = ["footer-bar", "top-banner", "side-stripes", "full-frame", "reel"]
        for name in wanted or []:
            builder = self.builders().get(name)
            if not builder:
                print("  !! unknown template:", name)
                continue
            self.save(builder(), f"template-{name}.png")
        if self.cfg.get("generateLogo"):
            self.save(self.logo(), "logo.png")


if __name__ == "__main__":
    wanted = sys.argv[1:]
    briefs = sorted(glob.glob(os.path.join(BRIEFS, "*.json")))
    if wanted:
        briefs = [b for b in briefs if os.path.splitext(os.path.basename(b))[0] in wanted]
    if not briefs:
        sys.exit(f"No briefs found in {BRIEFS} for {wanted or 'any slug'}")
    for b in briefs:
        Brand(json.load(open(b, encoding="utf-8"))).build()
    print("Done.")
