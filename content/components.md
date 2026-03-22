---
title: "Component Library"
description: "GibFlow front-end component showcase — DaisyUI 5 + Tailwind CSS 4"
date: 2026-03-22
draft: false
showToc: true
TocOpen: false
---

This page demonstrates every reusable shortcode in the GibFlow component library.
Use `{{</* shortcode-name param="value" */>}}` syntax in any Markdown content page.

---

## Hero

{{< hero
  title    = "Sustainable Business, Rooted in Gibraltar"
  subtitle = "End-to-end digital solutions that put the planet first — from strategy to deployment."
  cta      = "Get Started"
  cta_link = "/contact"
  cta2     = "Our Services"
  cta2_link = "/services"
>}}{{< /hero >}}

---

## Cards

Cards adapt to any column layout. Combine with Markdown tables or HTML grids.

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

---

## Stats

{{< stats >}}
{{< stat value="40+"  label="Gibraltar Clients"    desc="Active partnerships" icon="🤝" color="primary" >}}
{{< stat value="98%"  label="Client Retention"     desc="Rolling 12-month average" icon="⭐" color="secondary" >}}
{{< stat value="0 kg" label="Net Carbon Output"    desc="Fully offset operations" icon="🌱" color="accent" >}}
{{< /stats >}}

---

## Call to Action

{{< cta
  title    = "Ready to cut your digital carbon footprint?"
  subtitle = "Join 40+ Gibraltar businesses making the switch to sustainable tech."
  btn      = "Start Free Trial"
  btn_link = "/signup"
  btn2     = "Talk to Us"
  btn2_link = "/contact"
>}}{{< /cta >}}

---

## Alerts

{{< alert type="info" title="Did you know?" >}}
Gibraltar has one of the highest broadband penetration rates in Europe.
{{< /alert >}}

{{< alert type="success" title="Deployment complete!" >}}
Your application is live at `gibflow.gi`. All systems nominal.
{{< /alert >}}

{{< alert type="warning" title="Action required:" >}}
Your SSL certificate expires in 14 days. Renew it in your dashboard.
{{< /alert >}}

{{< alert type="error" title="Connection failed:" >}}
Could not reach the upstream API. Please check your credentials and try again.
{{< /alert >}}

---

## Badges

Inline status indicators for tags, labels, and pipeline states:

{{< badge color="primary"   >}}Digital{{< /badge >}}
{{< badge color="accent"    >}}Eco-Friendly{{< /badge >}}
{{< badge color="secondary" >}}Gibraltar{{< /badge >}}
{{< badge color="success"   >}}Live{{< /badge >}}
{{< badge color="warning"   >}}Beta{{< /badge >}}
{{< badge color="error"     >}}Deprecated{{< /badge >}}
{{< badge color="neutral" style="outline" >}}v2.1.0{{< /badge >}}

---

## Testimonials

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

---

## Accordion

{{< accordion >}}

{{< accordion-item title="What does 'eco-conscious' mean for a digital agency?" open="true" >}}
We measure and offset the carbon footprint of every server, deployment pipeline, and developer workstation. We also prioritise lightweight, efficient code and choose renewable-energy infrastructure wherever possible.
{{< /accordion-item >}}

{{< accordion-item title="Do you work with clients outside Gibraltar?" >}}
Yes — we work with clients across the EU, UK, and beyond. Our distributed team covers CET and GMT time zones, and all project management is fully async-friendly.
{{< /accordion-item >}}

{{< accordion-item title="Which technologies do you use?" >}}
Our current stack centres on Hugo, Tailwind CSS, DaisyUI, and modern JavaScript. For back-end work we favour Go and Node.js, deployed on zero-emissions cloud infrastructure.
{{< /accordion-item >}}

{{< accordion-item title="How do I get a quote?" >}}
Fill in our contact form at `/contact` or email us at hello@gibflow.gi. We'll respond within one business day with an outline proposal.
{{< /accordion-item >}}

{{< /accordion >}}

---

## Scroll Reveal

Wrap any content in a `reveal` shortcode to animate it when it enters the viewport.
Add `stagger="true"` to sequence child animations inside a grid.

{{< reveal stagger="true" >}}
<div class="grid sm:grid-cols-3 gap-4 my-6">
{{< card title="Fades in first"  icon="1️⃣" desc="Animates on scroll." >}}{{< /card >}}
{{< card title="Fades in second" icon="2️⃣" desc="80ms after the first." >}}{{< /card >}}
{{< card title="Fades in third"  icon="3️⃣" desc="160ms after the first." >}}{{< /card >}}
</div>
{{< /reveal >}}

---

## Form Fields

Individual field shortcode for composing custom forms:

{{< form-field type="text"  name="name"  label="Full Name"     placeholder="Jane Smith"       required="true" >}}
{{< form-field type="email" name="email" label="Email Address" placeholder="jane@example.com" required="true" hint="We will never share your email." >}}
{{< form-field type="tel"   name="phone" label="Phone Number"  placeholder="+350 200 00000" >}}
{{< form-field type="select" name="topic" label="Topic" options="General Enquiry,Web Development,Green Hosting,Other" required="true" >}}
{{< form-field type="textarea" name="msg" label="Message" placeholder="Tell us about your project" rows="4" required="true" >}}

---

## Contact Form

Drop-in pre-built contact form with Netlify Forms support out of the box:

{{< contact-form
  title    = "Send Us a Message"
  subtitle = "Questions, quotes, or just a chat - we are here."
>}}
