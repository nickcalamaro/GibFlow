---
title: "Component Library"
description: "GibFlow front-end component showcase and styling system reference — DaisyUI 5 + Tailwind CSS 4"
date: 2026-03-22
draft: false
showToc: true
TocOpen: true
---

## Styling System

GibFlow uses three libraries that load in this order:

| Layer | Library | Purpose |
|-------|---------|---------|
| 1 | **PaperMod** | Hugo theme — navigation, layout, typography, dark mode toggle |
| 2 | **Tailwind CSS 4** | Utility classes for spacing, flex, grid, responsive breakpoints |
| 3 | **DaisyUI 5** | Semantic components — buttons, cards, badges, alerts, heroes, forms |

### How they fit together

PaperMod's CSS is loaded inside `@layer papermod` (via a project-level override of PaperMod's `head.html` that uses `@import url(...) layer(papermod)`). A `@layer` declaration in the same `<style>` tag pre-declares the full layer order for the entire document (CSS layers are ordered by first encounter globally, so this MUST come before both the `@import` and the main.css `<link>`):

```
@layer theme      →  lowest   (Tailwind design tokens)
@layer base       →           (Tailwind preflight — *, body resets)
@layer papermod   →           (PaperMod layout, nav, typography, resets)
@layer components →           (DaisyUI buttons, badges, inputs …)
@layer utilities  →           (Tailwind utilities)
(unlayered)       →  highest  (our overrides in main.css)
```

PaperMod sits between `base` and `components`. Its layout rules (`.main`, `.header`, `.nav`) beat Tailwind's preflight resets. DaisyUI's component rules (`.btn`, `.badge`, `.input`) beat PaperMod's element-level resets. Two unlayered overrides in `main.css` handle remaining edge cases: transparent body background and heading colours inside coloured sections.

### Rules for adding styles

1. **Use DaisyUI components first.** Buttons, cards, alerts, badges, heroes, stats, accordions — they all exist and respond to theme changes automatically.
2. **Use Tailwind utilities for layout.** Spacing (`mt-4`, `gap-6`), flex/grid, responsive prefixes (`md:grid-cols-2`), borders, shadows.
3. **Use DaisyUI semantic colour tokens.** `bg-base-100`, `bg-primary`, `text-base-content`, `text-primary-content`. These flip automatically in dark mode.
4. **Do not write custom CSS** unless it is a structural layout wrapper (like `.gf-section`) that would be noisy to repeat on every element.
5. **Inline `style=""` only for**: dynamic values from Hugo (like `background-image: url(...)`) or one-off positioning (`object-position`). Never for colours.

### File map

| File | What it does |
|------|-------------|
| `assets/css/main.css` | Tailwind import, DaisyUI plugin, light/dark theme definitions, scroll-reveal animations, homepage structural classes, unlayered overrides (body bg, heading colours) |
| `assets/css/extended/papermod-compat.css` | Intentionally empty placeholder. PaperMod concatenates `css/extended/*.css` into its stylesheet; the file exists so PaperMod doesn't skip the extended pipeline |
| `layouts/partials/head.html` | Project-level override of PaperMod's head.html. Loads PaperMod's stylesheet inside `@layer papermod` |
| `layouts/partials/extend_head.html` | Loads `main.css` through Hugo's PostCSS pipe |
| `layouts/partials/extend_footer.html` | Intersection Observer for `.reveal` animations |

### Colour palette

Light and dark themes are defined in `main.css` using `@plugin "daisyui/theme"`.

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `primary` | Mediterranean deep blue | Brighter blue | Brand, CTAs, links |
| `secondary` | Gibraltar limestone gold | Warm gold | Supporting accent |
| `accent` | Mediterranean olive green | Brighter green | Eco, sustainability |
| `neutral` | Near-black | Mid-gray | Dark overlays, dark buttons |
| `base-100` | White canvas | Night sky | Main background |
| `base-200` | Soft off-white | Slightly lighter | Alternating sections |
| `base-300` | Light stone | Rock in shadow | Borders, subtle dividers |

---

## Components

### Hero

Full-width hero section using DaisyUI's `hero` component. Supports background images with a dark overlay, or plain coloured backgrounds.

{{< hero
  title    = "Sustainable Business, Rooted in Gibraltar"
  subtitle = "End-to-end digital solutions that put the planet first."
  cta      = "Get Started"
  cta_link = "/contact"
  cta2     = "Our Services"
  cta2_link = "/services"
>}}{{< /hero >}}

**Parameters:** `title`, `subtitle`, `cta`, `cta_link`, `cta2`, `cta2_link`, `image`, `align`, `min_height`, `full_bleed`

When `image` or `full_bleed="true"` is set, text uses `text-neutral-content` (light on dark). The secondary button uses outline with `border-neutral-content` instead of inline styles.

---

### Cards

Cards adapt to any column layout. Uses DaisyUI's `card` component with `bg-base-100` surface.

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">

{{< card
  title      = "Green Hosting"
  desc       = "100% renewable-energy datacentres located in Gibraltar."
  icon       = "🌿"
  link       = "/services/hosting"
  link_text  = "Explore hosting"
  badge      = "Eco"
  badge_color = "accent"
>}}{{< /card >}}

{{< card
  title      = "Digital Strategy"
  desc       = "Roadmaps that align growth ambitions with sustainability goals."
  icon       = "🗺️"
  link       = "/services/strategy"
  badge      = "Popular"
  badge_color = "secondary"
>}}{{< /card >}}

{{< card
  title = "Custom Development"
  desc  = "Bespoke web apps built for longevity, accessibility, and low overhead."
  icon  = "⚙️"
  link  = "/services/dev"
>}}{{< /card >}}

</div>

**Parameters:** `title`, `desc`, `icon`, `image`, `imagealt`, `link`, `link_text`, `badge`, `badge_color`, `size`, `variant`

---

### Stats

DaisyUI `stats` component. Stacks vertically on mobile, horizontal from `sm`.

{{< stats >}}
{{< stat value="40+"  label="Gibraltar Clients"    desc="Active partnerships" icon="🤝" color="primary" >}}
{{< stat value="98%"  label="Client Retention"     desc="Rolling 12-month average" icon="⭐" color="secondary" >}}
{{< stat value="0 kg" label="Net Carbon Output"    desc="Fully offset operations" icon="🌱" color="accent" >}}
{{< /stats >}}

**Parameters (stat):** `value`, `label`, `desc`, `icon`, `color`

---

### Call to Action

Full-width coloured section. Primary button uses `btn-neutral`, secondary button uses `btn-ghost` with a `border-{variant}-content` outline. No inline styles.

{{< cta
  title    = "Ready to cut your digital carbon footprint?"
  subtitle = "Join 40+ Gibraltar businesses making the switch to sustainable tech."
  btn      = "Start Free Trial"
  btn_link = "/signup"
  btn2     = "Talk to Us"
  btn2_link = "/contact"
>}}{{< /cta >}}

**Parameters:** `title`, `subtitle`, `btn`, `btn_link`, `btn2`, `btn2_link`, `variant` (primary/secondary/accent/neutral)

---

### Alerts

DaisyUI `alert` component with `alert-soft` variant.

{{< alert type="info" title="Did you know?" >}}
Gibraltar has one of the highest broadband penetration rates in Europe.
{{< /alert >}}

{{< alert type="success" title="Deployment complete!" >}}
Your application is live. All systems nominal.
{{< /alert >}}

{{< alert type="warning" title="Action required:" >}}
Your SSL certificate expires in 14 days. Renew it in your dashboard.
{{< /alert >}}

{{< alert type="error" title="Connection failed:" >}}
Could not reach the upstream API. Please check your credentials and try again.
{{< /alert >}}

**Parameters:** `type` (info/success/warning/error), `title`, `icon`

---

### Badges

Inline status indicators. All sizing and colour handled by DaisyUI tokens.

{{< badge color="primary"   >}}Digital{{< /badge >}}
{{< badge color="accent"    >}}Eco-Friendly{{< /badge >}}
{{< badge color="secondary" >}}Gibraltar{{< /badge >}}
{{< badge color="success"   >}}Live{{< /badge >}}
{{< badge color="warning"   >}}Beta{{< /badge >}}
{{< badge color="error"     >}}Deprecated{{< /badge >}}
{{< badge color="neutral" style="outline" >}}v2.1.0{{< /badge >}}

**Parameters:** `color`, `size` (xs/sm/md/lg/xl), `style` (outline/soft/dash)

---

### Testimonials

Styled blockquote with coloured left border using DaisyUI tokens.

{{< testimonial
  author  = "Maria Gomez"
  role    = "CEO"
  company = "Rock Renewables Ltd"
  color   = "primary"
>}}
GibFlow cut our hosting costs by 40% while reducing our emissions. The team is professional, responsive, and genuinely committed to sustainability. Highly recommended.
{{< /testimonial >}}

{{< testimonial
  author  = "James Fortuna"
  role    = "Head of Digital"
  company = "Gibraltar Finance Centre"
  color   = "secondary"
>}}
From discovery to launch in six weeks. The new platform is faster, more accessible, and our Lighthouse scores have never looked better.
{{< /testimonial >}}

**Parameters:** `author`, `role`, `company`, `avatar`, `color`

---

### Accordion

DaisyUI `collapse` components inside a `join` container.

{{< accordion >}}

{{< accordion-item title="What does 'eco-conscious' mean for a digital agency?" open="true" >}}
We measure and offset the carbon footprint of every server, deployment pipeline, and developer workstation. We also prioritise lightweight, efficient code and choose renewable-energy infrastructure wherever possible.
{{< /accordion-item >}}

{{< accordion-item title="Do you work with clients outside Gibraltar?" >}}
Yes. We work with clients across the EU, UK, and beyond. Our distributed team covers CET and GMT time zones, and all project management is fully async-friendly.
{{< /accordion-item >}}

{{< accordion-item title="Which technologies do you use?" >}}
Our current stack centres on Hugo, Tailwind CSS 4, DaisyUI 5, and modern JavaScript. For back-end work we favour Go and Node.js, deployed on zero-emissions cloud infrastructure.
{{< /accordion-item >}}

{{< accordion-item title="How do I get a quote?" >}}
Fill in our contact form or email us at hello@gibflow.gi. We respond within one business day with an outline proposal.
{{< /accordion-item >}}

{{< /accordion >}}

---

### Scroll Reveal

Wrap content in `reveal` to animate on viewport entry. Add `stagger="true"` for sequenced child animations.

{{< reveal stagger="true" >}}
<div class="grid sm:grid-cols-3 gap-4 my-6">
{{< card title="Fades in first"  icon="1️⃣" desc="Animates on scroll." >}}{{< /card >}}
{{< card title="Fades in second" icon="2️⃣" desc="80ms after the first." >}}{{< /card >}}
{{< card title="Fades in third"  icon="3️⃣" desc="160ms after the first." >}}{{< /card >}}
</div>
{{< /reveal >}}

Uses CSS `translate` + `opacity` transitions triggered by an Intersection Observer in `extend_footer.html`. Respects `prefers-reduced-motion`.

---

### Form Fields

Individual field shortcode for composing custom forms. Uses DaisyUI's `fieldset` + `input`/`textarea`/`select` components.

{{< form-field type="text"  name="name"  label="Full Name"     placeholder="Jane Smith"       required="true" >}}
{{< form-field type="email" name="email" label="Email Address" placeholder="jane@example.com" required="true" hint="We will never share your email." >}}
{{< form-field type="tel"   name="phone" label="Phone Number"  placeholder="+350 200 00000" >}}
{{< form-field type="select" name="topic" label="Topic" options="General Enquiry,Web Development,Green Hosting,Other" required="true" >}}
{{< form-field type="textarea" name="msg" label="Message" placeholder="Tell us about your project" rows="4" required="true" >}}

**Parameters:** `type`, `name`, `label`, `placeholder`, `hint`, `required`, `color`, `rows`, `options`

---

### Contact Form

Pre-built contact form with Netlify Forms support. Includes name, email, subject dropdown, message textarea, and GDPR consent checkbox.

{{< contact-form
  title    = "Send Us a Message"
  subtitle = "Questions, quotes, or just a chat - we are here."
>}}

**Parameters:** `title`, `subtitle`, `provider` (netlify/formspree/custom), `action`, `name_field`, `submit_text`
