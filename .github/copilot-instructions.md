# GibFlow — Copilot Coding Instructions

## Stack
- Hugo 0.146+ extended, PaperMod theme (git submodule)
- Tailwind CSS 4 + DaisyUI 5 via npm, PostCSS pipe (`css.PostCSS`)
- Custom DaisyUI themes named `light` and `dark` (matches PaperMod's `data-theme` attribute)
- Source: `assets/css/main.css` → built to `public/css/main.css`

---

## CSS Rules

### Prefer DaisyUI semantic tokens for backgrounds and colours.
Use `bg-base-100`, `bg-base-200`, `bg-primary`, `bg-secondary` etc. in HTML.
These are CSS-variable-backed and respond to theme changes automatically.
Do NOT use Tailwind opacity utilities like `bg-white/85` for section backgrounds.
Those require the scanner to have seen the exact string in a source file first —
if the class is new, it silently generates nothing.

### Inline styles are only for dynamic or one-off values.
Use `style="..."` only for values Hugo generates dynamically (e.g.
`background-image: url(...)`) or truly one-off positioning (`object-position`).
Never use inline styles for colours — use DaisyUI semantic tokens instead.

### Use Tailwind utilities for everything else. No custom CSS.
Put utility classes directly in the HTML. Custom CSS in `main.css` is only
acceptable for:
- Structural wrappers (`.gf-home`, `.gf-container`, `.gf-section`) — things
  that apply to every section and would be noisy to repeat everywhere
- Scroll-reveal animation definitions (`.reveal`, `.reveal-stagger`)
- Unlayered overrides for PaperMod body background and heading colours
  inside coloured sections (see PaperMod section below)

If a feature requires something Tailwind/DaisyUI doesn't provide, find and
install a library. Do not write custom CSS to fill the gap.

### Tailwind v4 filter/shadow utilities do not generate from shortcode content.
`drop-shadow-*`, `text-shadow-*` — Tailwind v4 has CSS variables for these but
does NOT emit utility classes for them. Use `filter: drop-shadow(...)` or
`text-shadow: ...` as inline styles instead.

### No CSS fallbacks.
Do not use PostCSS fallback values, `-webkit-` prefixes, or compatibility shims.
If something breaks, flag it — do not silently degrade.

### Do not use `color-mix()` in PostCSS-processed CSS.
PostCSS generates an opaque fallback for `color-mix(in oklch, var(...) N%, transparent)`
that completely covers whatever is behind it. This is silent and wrong.
Use `rgba()` or DaisyUI semantic tokens instead.

### Dark mode via `@variant dark`
PaperMod sets `data-theme="dark"` on `<html>`. Tailwind's built-in dark mode uses
`prefers-color-scheme`. To make `dark:` utilities respond to PaperMod's toggle, we
override the variant at the top of `assets/css/main.css`:
```css
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```
DaisyUI semantic tokens (`bg-base-100`, `text-primary`, etc.) respond to
`data-theme` natively — no `dark:` prefix needed when using those tokens.

---

## Homepage Layout System (`layouts/index.html` + `assets/css/main.css`)

```
layouts/index.html          Full-bleed homepage override
  └─ <div class="gf-home">               Triggers .main:has(.gf-home) override

content/_index.md           Page content — sections in this order:
  1. {{< hero >}}            DaisyUI hero + own background image + overlay
  2. .gf-trustbar            Stats bar (bg-primary)
  3–8. .gf-section           Full-width alternating bg-base-100 / bg-base-200
  9. .bg-primary             Early access form
  10. .gf-section bg-base-100  For businesses
  11. {{< cta >}}            Contained card (bg-primary) inside gf-section
```

**Custom CSS classes** (all in `main.css`, minimal on purpose):
- `.main:has(.gf-home)` — overrides PaperMod's `.main` max-width and padding
- `.gf-home` — homepage content wrapper (width: 100%)
- `.gf-container` — max-width 1100px, centred, with padding
- `.gf-section` — `padding-block: 5rem` only; background set in HTML
- `.gf-trustbar` — `bg-primary` + `padding-block: 3rem`
- `.gf-footer` — avoids PaperMod's `.footer` max-width constraint
- `.reveal` / `.reveal-stagger` — scroll-triggered fade-in animations

**Do not fight the cascade on `body`.**  Put full-page backgrounds on a
`fixed inset-0 -z-10` child element inside the layout instead.

---

## PaperMod ↔ DaisyUI: Layer Architecture
PaperMod's `reset.css` declares aggressive resets (`button { padding: 0 }`,
`h1-h6 { color: var(--primary) }`, etc.) that would normally beat DaisyUI's
`@layer` rules because unlayered CSS always wins over layered CSS.

**Fix: `layouts/partials/head.html`** (project-level override of PaperMod's)
loads PaperMod's entire stylesheet inside `@layer papermod` via
`@import url("...") layer(papermod)`. A `@layer` declaration in the same
`<style>` tag pre-declares the full layer order for the entire document
(CSS layers are ordered by first encounter, so this MUST come before
both the `@import` and the main.css `<link>`):

```
@layer theme      →  lowest   (Tailwind design tokens)
@layer base       →           (Tailwind preflight — *, body resets)
@layer papermod   →           (PaperMod layout, nav, typography, resets)
@layer components →           (DaisyUI buttons, badges, inputs …)
@layer utilities  →           (Tailwind utilities)
(unlayered)       →  highest  (our overrides in main.css)
```

PaperMod sits between `base` and `components`. Its layout rules (`.main`,
`.header`, `.nav`) beat Tailwind's preflight resets. DaisyUI's component
rules (`.btn`, `.badge`, `.input`) beat PaperMod's element-level resets.
No per-component workarounds needed.

**Unlayered overrides in `main.css`:**
- `:root { --border: 1px }` — **critical.** PaperMod's theme-vars.css defines
  `--border: rgb(238,238,238)` (a divider colour) in `@layer papermod`. DaisyUI
  uses `--border` as a LENGTH (1px) for border widths and `padding-inline` calc
  expressions. Because `papermod > base`, PaperMod's colour value wins and breaks
  every DaisyUI component that uses `var(--border)` in a calc (badges, inputs,
  checkboxes, etc.). This unlayered rule restores the correct length value.
- `body, body.list { background: transparent }` — PaperMod's body background
  is the only rule (Tailwind preflight doesn't set one), so we override it.
- `.badge { line-height: 1 }` — PaperMod's `body { line-height: 1.6 }` inherits
  into badges (DaisyUI doesn't set line-height on them), inflating the text
  beyond the badge's fixed height.
- `.bg-primary h1, …h6 { color: var(--color-primary-content) }` (and secondary,
  accent, neutral) — PaperMod's heading colour is an explicit declaration on the
  element, which beats inherited text colour from a parent. These ensure headings
  in coloured sections display correctly.

**`assets/css/extended/papermod-compat.css`** is intentionally empty. PaperMod
concatenates `css/extended/*.css` into its stylesheet bundle; the file exists
as a placeholder. Do not add workarounds there.

---

## Copy/Content Rules

- No em-dashes (`—`). Use a comma, full stop, or rewrite the sentence.
- No "it's not X, it's Y" constructions.
- Avoid lists of exactly three items (classic AI tell).
- Vary sentence length. Short sentences are fine. So are longer ones where needed.
- Write as if a local Gibraltar founder wrote it — direct, specific, not corporate.
- Avoid adverb-heavy phrasing: "incredibly," "seamlessly," "effortlessly."
