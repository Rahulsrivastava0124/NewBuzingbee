# BuzingBee design rules

The rules every page on buzingbee.com follows. When you build or change a page, use these
tokens and classes instead of new hex codes, sizes or one-off button styles.

Where things live:

- Colours: `tailwind.config.js` (`theme.extend.colors`) and the CSS variables at the top of `styles/globals.css`
- Buttons and heading classes: `styles/globals.css` (`@layer components`)
- Font: loaded in `app/layout.tsx`

---

## 1. Colours

| Name     | Hex       | Tailwind          | Use for                                                    |
| -------- | --------- | ----------------- | ---------------------------------------------------------- |
| Honey    | `#FDB905` | `honey`, `accent` | Main actions, highlights, small accents. Never for text.   |
| Ink      | `#12141C` | `ink`, `textHeading` | Headings and strong text (light in dark mode, see 1b). |
| Slate    | `#5B5F6B` | `slate`, `textMuted` | Paragraphs, descriptions, secondary text.               |
| Comb     | `#FFF8E1` | `comb`, `bgSection`  | Tinted section backgrounds.                             |
| Violet   | `#6D3DF2` | `violet`          | AI-related content only (AI services, hero service word).  |
| White    | `#FFFFFF` | `bgPrimary`, `card` | Page and card backgrounds.                               |

Rules:

- Text on honey is always ink, never white. White on honey is unreadable (about 1.7:1).
- Honey text on white is too faint for headings. To emphasise a word in a heading, use a
  highlight behind dark text: `rounded-lg bg-honey/30 px-2`.
- Violet is reserved for AI. Its highlight is `rounded-lg bg-violet/10 px-2 text-violet`.
- The hero's rotating service word uses the brand gradient, violet `#6D3DF2` → purple
  `#9B3FF0` → pink `#E0349A`, left to right. Because the letters flip in 3D, the gradient is
  applied as one slice per letter (`letterGradient` in `app/page.tsx`), not on the wrapper.
  Use the same three stops anywhere else a gradient is needed (trend lines, progress bars).
- Gradient text in static headings (e.g. "Marketing" in "End-to-End Digital Marketing
  Solutions"): `bg-gradient-to-r from-violet via-[#9b3ff0] to-[#e0349a] bg-clip-text
  text-transparent`, on an inner span inside the `bg-violet/10` highlight.
- Borders and dividers: `border-ink/10` (light) or `border-ink/15` (stronger).
- Don't add new hex codes. If a colour is missing, add it to the palette here and in
  `tailwind.config.js` first.

## 1b. Light and dark theme

The site has a light theme (default) and a dark theme, switched by the sun/moon button in the
navbar (`components/ui/animated-theme-toggler.tsx`, Magic UI). The choice is saved in
`localStorage` ("theme"); first-time visitors follow their system setting. A small script in
`app/layout.tsx` applies it before the page paints, so there is no flash.

How it works:

- Tailwind runs in `darkMode: "class"`; the toggler adds/removes `dark` on `<html>`.
- Theme-aware colours are CSS variables in `styles/globals.css` (`:root` for light, `.dark`
  for dark) and Tailwind reads them: `ink`, `slate`, `paper`, `surface`, `comb`, plus the older
  names (`textHeading`, `bgPrimary`, `card`, `bgSection`, `border`, …).
- Honey stays the same in both themes.

Rules for new code:

| Use                         | Light      | Dark       | Class                     |
| --------------------------- | ---------- | ---------- | ------------------------- |
| Page background             | white      | `#0D0E13`  | `bg-paper`                |
| Cards, popups, inputs       | white      | `#181A22`  | `bg-surface` / `bg-card`  |
| Headings / strong text      | `#12141C`  | `#F1EFE9`  | `text-ink`                |
| Secondary text              | `#5B5F6B`  | `#A0A5B2`  | `text-slate`              |
| Tinted sections             | `#FFF8E1`  | `#1B180F`  | `bg-comb`                 |
| Lines and dividers          | ink 10–15% | light 10–15% | `border-ink/10`         |

- Never hard-code `#12141c`, `#5b5f6b` or `bg-white` for text and surfaces; use the tokens
  above so dark mode works.
- Text that sits on honey (yellow buttons, the "Performance" highlight, initials circles) stays
  `text-[#12141c]` in both themes. White on honey is never allowed.
- Always-dark elements (the results band, `btn-dark`, the code panel in the hero animation)
  use the fixed hex `bg-[#12141c]`.
- The hero animations (`HeroStories`, `GrowthStairs`) are illustrations and keep their light
  cards in dark mode.
- Logos: the navbar swaps to `public/buzingbee-logo-dark.webp` (off-white lettering).
  Brand logos with black wordmarks get `invertDark` (`dark:invert dark:hue-rotate-180`).
- Check every change in both themes.

## 2. Typography

**Font:** General Sans everywhere (loaded from Fontshare in `app/layout.tsx`). Weights 300–700.
There is no 800; `font-extrabold` renders as 700.

**Heading scale** (use the classes, not raw sizes):

| Class             | Mobile → desktop      | Weight   | Use for                          |
| ----------------- | --------------------- | -------- | -------------------------------- |
| Hero h1           | 30 → 40 → 46px        | 500/700  | Homepage hero only               |
| `heading-page`    | 32 → 40 → 46px        | 600      | Page titles (one `h1` per page)  |
| `heading-section` | 32 → 40px             | 600      | Section headings (`h2`)          |
| `heading-sub`     | 24 → 28px             | 600      | Sub-headings inside a section    |
| Card / item title | 18–20px (`text-lg`/`text-xl`) | 600 | Service items, cards, steps |

**Body text:**

- Lead paragraph under a heading: 17px, slate, `leading-relaxed`.
- Normal body: 15–16px, slate.
- Small print and meta (dates, captions): 14px (`text-sm`), slate.
- Keep paragraphs under about 60–70 characters wide (`max-w-[46ch]` to `max-w-[60ch]`).

**Don't:** use `font-bold` on headings (use semibold), mix other fonts in, or make one-off
heading sizes.

## 3. Buttons

Every button uses one of three styles. Size is built into the class: **48px tall, 24px side
padding, 15px medium text, 12px rounded corners**. Don't add your own height, padding or
font size to a button.

| Class       | Look                         | Use for                                                  |
| ----------- | ---------------------------- | -------------------------------------------------------- |
| `btn-honey` | Filled honey gradient, ink text | The main action in a section (Let's Talk, Request my free audit). One per section. |
| `btn-light` | Filled white gradient, ink text | Secondary actions next to a main one (Contact, See Our Work). |
| `btn-dark`  | Filled ink gradient, white text | A main action where honey is already busy, or on comb backgrounds. |
| `btn-icon`  | Add to any of the above      | Icon-only buttons (48 × 48), e.g. call / WhatsApp.       |

`btn-primary` and `btn-outline` are older names for `btn-honey` and `btn-light`. They still
work, but use the new names in new code.

All three styles share: a soft top-to-bottom gradient, a thin darker border, a light top
highlight, a small shadow that presses in on click, a slight brighten on hover, and a visible
focus ring for keyboard users.

Allowed additions: layout only. Margins (`mt-8`), width (`w-full`, `flex-1`), visibility
(`hidden xl:inline-flex`) and alignment are fine. Icons go inside the button at `h-4 w-4`.

```tsx
<Link href="/contact" className="btn-honey">
  Let&apos;s Talk <ArrowUpRight className="h-4 w-4" />
</Link>

<Link href="/portfolio" className="btn-light">See Our Work</Link>

<button type="submit" className="btn-honey w-full disabled:opacity-60">
  Request my free audit
</button>

<a href="tel:+91..." aria-label="Call us" className="btn-light btn-icon">
  <Phone className="h-5 w-5" />
</a>
```

**Button text:** say exactly what happens ("Request my free audit", not "Submit"), sentence
case, no trailing "→" in the text (use an icon if you need an arrow).

**Text links** (not buttons): 15px semibold ink with a honey underline
(`underline decoration-honey decoration-2 underline-offset-[6px]`).

Toggles and tabs (pricing plan type, monthly/yearly switch) are not buttons and keep their own
pill style.

## 4. Icons

- Use [Lucide](https://lucide.dev) (`lucide-react`) only.
- Default: ink colour, no background box, `strokeWidth={1.75}`.
- Sizes: 16px inside buttons and chips, 20px in lists, 28px next to item titles.
- When an icon sits beside a title, put them on one row (`flex items-center gap-3`) and line
  the description up under the title text.

## 5. Brand logos

- Logo files live in `public/brands/` as SVG. Sources: svglogos.dev (CC0), Simple Icons (CC0),
  Wikimedia Commons (public domain). Record the source in a comment when adding one.
- Show them in full colour in the "Worked with Global Brands & Startups" marquee.
- Tune each logo's height (`h-5` to `h-7`) so they look the same size; icon-only logos get the
  brand name next to them.
- Only show brands you have actually worked with or have permission to show.

## 6. Layout and spacing

- Page container: `max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12` (the `WRAP` constant on the
  homepage).
- Section spacing: `py-20 lg:py-28`.
- Alternate section backgrounds: white → comb → white, with one ink (dark) band for results.
- Two-column sections: heading and intro on the left, content on the right
  (`lg:grid-cols-[0.8fr_1.2fr]` or similar), left-aligned.
- Corners: 12px (`rounded-xl`) for buttons and inputs, 16–24px (`rounded-2xl`/`rounded-3xl`)
  for cards and images.
- Numbered markers (01, 02 …) only for real sequences, like the project process.

## 7. Forms

- Every field has a visible label above it (14px medium ink), not just a placeholder.
- Inputs: `rounded-xl border border-ink/15 bg-white px-4 py-3 text-[15px]`, focus with an ink
  border and a honey ring.
- Mark optional fields as "(optional)" instead of starring required ones.
- Success and error messages appear under the submit button and say what happened and what
  to do next.

## 8. Motion

- One orchestrated moment per page. On the homepage that's the hero: the rolling service word
  and the right-side story animations.
- Don't add fade-in-on-scroll to every section.
- Motion that responds to the user (opening a menu, hover, pressing a button) is fine.
- Always respect reduced motion: framer-motion/motion via `MotionConfig reducedMotion="user"`,
  CSS animations via `@media (prefers-reduced-motion: reduce)`.

## 9. Accessibility checklist

- Text contrast at least 4.5:1 (ink or slate on white/comb; never white on honey).
- Every interactive element shows a focus ring (built into the button classes).
- Decorative images and SVGs get `alt=""` / `aria-hidden="true"`; real logos get the brand name.
- Animated text keeps a stable `sr-only` copy for screen readers.
- Check every change at 375px (mobile) and 1440px (desktop) with no sideways scrolling.
