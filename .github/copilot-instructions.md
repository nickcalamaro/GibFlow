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

### The only safe pattern for one-off colours is an inline style.
If a colour or opacity isn't covered by a DaisyUI token AND isn't already
used somewhere Tailwind will scan, use `style="..."` directly on the element.
Examples that already exist: `object-position`, `text-shadow`, button overrides
in `cta.html`. Use `rgba()` — not `oklch()` with `/` opacity syntax.

### Use Tailwind utilities for everything else. No custom CSS.
Put utility classes directly in the HTML. Custom CSS in `main.css` is only
acceptable for:
- Structural wrappers (`.gf-home`, `.gf-container`, `.gf-section`) — things
  that apply to every section and would be noisy to repeat everywhere
- Cascade conflict fixes (see PaperMod section below)

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
  └─ <div class="fixed inset-0 -z-10">   Background image (not a CSS rule)
  └─ <div class="gf-home">               Negates PaperMod's .main padding

content/_index.md           Page content — sections in this order:
  1. {{< hero >}}            DaisyUI hero + overlay + scroll hint
  2. .gf-trustbar            Stats bar (bg-primary)
  3–8. .gf-section           Alternating bg-base-100 / bg-base-200
  9. .bg-primary             Early access form
  10. .gf-section bg-base-100  For businesses
  11. {{< cta >}}            Final CTA strip
```

**Custom CSS classes** (all in `main.css`, minimal on purpose):
- `.gf-home` — negates PaperMod's `.main` padding-inline
- `.gf-container` — max-width 1100px, centred, with padding
- `.gf-section` — `padding-block: 5rem` only; background set in HTML
- `.gf-trustbar` — `bg-primary` + `padding-block: 3rem`
- `.gf-footer` — avoids PaperMod's `.footer` max-width constraint
- `.reveal` / `.reveal-stagger` — scroll-triggered fade-in animations

---

## PaperMod Cascade Conflicts
PaperMod's `reset.css` declares **unlayered** CSS that overwrites DaisyUI's `@layer` rules:
- `body { background: var(--theme) }` — covers any body background we set
- `body.list { background: var(--code-bg) }` — applied to the homepage specifically
- `button, input, textarea { padding: 0; background: 0 0; border: 0 }` — wipes DaisyUI
- `a, button, h1-h6 { color: var(--primary) }` — near-black in light mode

**Fix pattern**: Write unlayered class selectors in `main.css`. Class specificity (0,1,0)
beats PaperMod's tag selectors (0,0,1) on the same cascade layer.

**Do not fight the cascade on `body`.**  PaperMod always wins `body {}` because it
loads first with equal specificity. Put full-page backgrounds on a
`fixed inset-0 -z-10` child element inside the layout instead.

**Homepage background fix**: `body.list { background: transparent }` at specificity
(0,1,1) beats `.list { background: var(--code-bg) }` at (0,1,0).

---

## Copy/Content Rules

- No em-dashes (`—`). Use a comma, full stop, or rewrite the sentence.
- No "it's not X, it's Y" constructions.
- Avoid lists of exactly three items (classic AI tell).
- Vary sentence length. Short sentences are fine. So are longer ones where needed.
- Write as if a local Gibraltar founder wrote it — direct, specific, not corporate.
- Avoid adverb-heavy phrasing: "incredibly," "seamlessly," "effortlessly."
