# How this app is meant to look

The house style is **YXM Aurora** (`E:\CODING\Brain\YXM Design System — Aurora.txt`
is the canonical file — it wins on any exact value) with an **iOS glass** surface
on top. Aurora supplies the type, the palette discipline and the motion; iOS
supplies the frosted panels and pill controls that make it feel like an app
rather than a web page.

It lives in two places only: `src/index.css` for the primitives and
`tailwind.config.js` for the tokens. Both are master-owned, so every client
build inherits the look and a client cannot drift off it by editing their
config.

## The three laws

1. **The aurora is an accent, never a fill.** The rule under a title, one
   primary pill, a progress bar. One per screen. Never a background behind
   content.
2. **No drop shadows — with one lit exception.** Surfaces separate with a
   hairline border, blur and whitespace. `.glass-glow` is the sanctioned
   exception: a luminous hairline and a soft bloom that make a control read as a
   lit pane of glass. It goes on the nav bar, the studio cards and the hero —
   never on body content. `shadow-neon` is the other exception and only lands on
   the tag sitting over a photo.
3. **Whitespace first, decoration last.** If a screen feels busy, take something
   out before adding anything.

## What to reach for

| Need | Use |
| --- | --- |
| Any panel or card | `.glass-panel`, or `.card-tint` with `--tint` set |
| A secondary action | `.btn-glass` (pill, frosted, hairline) |
| The commitment on a screen | `.btn-ink` — or `.btn-rainbow` when `ctaStyle: 'rainbow'` |
| The small uppercase label | `.eyebrow` — never hand-roll the classes |
| A screen title | `StepHeader`, or `text-[34px] font-semibold tracking-tight` |
| Body copy | `text-grey` (`--grey`), not `text-ink/60` |
| Hover on a card | `.aurora-ring`, plus the lift `.card-tint` already carries |
| A lit glass control | `.glass-glow` on top of `.glass-panel` |
| The home masthead's picture | `hero` in the config; `.hero-shot` + `.hero-scrim` |

## Type

**Manrope** everywhere, headings at **600** with `-0.02em` tracking. Playfair
Display italic is available as `font-accent` for a single written-feeling word in
a heading — never body copy, never more than one word. Bebas Neue is not
interface type: it is the price font burned onto the poster.

Eyebrow tracking stops at **0.1em**. Wider and it stops reading as a word.

## Motion

`var(--ease-spring)` — `cubic-bezier(0.22, 1, 0.36, 1)` — is the default.
Reveals enter from 24px, 0.6s, staggered `delay-100` → `delay-500`. Every
animation is already disabled under `prefers-reduced-motion`; anything new must
stay inside that guard.

## Colour

Near-monochrome: ink on white, or white on black. The client's brand colour is
an accent — an icon, a selected state, a tint on a card — not a surface. The
semantic tokens (`ink`, `grey`, `surface`, `panel`) flip with `data-theme`, so
build once and both themes work.

## Writing

Short sentences. Say the outcome, not the mechanism. "Trim a clip. Brand every
frame." beats "Bring in a clip, trim it, and the same branding goes on every
frame — rendered at full quality." If a sentence has a dash and two clauses, it
is probably two sentences or one shorter one.
