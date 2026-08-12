# Webura — Premium Web Studio

A dark-luxury portfolio site for the Webura agency. Static: three files, zero build step, zero dependencies.

```
webura/
├── index.html   — all markup and copy
├── styles.css   — design tokens + all styling
└── script.js    — preloader, cursor, reveals, count-ups, menu
```

## Run it

Open `index.html` directly, or serve it:

```bash
npx -y serve -l 5178 .
```

## Design system

All tokens live at the top of `styles.css` under `:root`. Change them there and the whole
site follows.

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#07070A` | page background |
| `--bg-2` / `--s1` / `--s2` | `#0B0B0F` / `#101015` / `#16161C` | alternating sections, cards |
| `--text` | `#F2F0EA` | warm off-white body text |
| `--muted` / `--dim` / `--faint` | 56% / 34% / 16% white | body copy, labels, decoration |
| `--gold` | `#D4AF6A` | primary accent |
| `--gold-2` / `--gold-deep` | `#E8CE95` / `#8E7233` | gradient stops |
| `--line` / `--line-2` | 9% / 16% white | hairline borders |

**Type** — Space Grotesk (UI, display) + Playfair Display italic (accents, quotes, monograms).
The italic serif on gold gradient is the signature move; it appears in every section heading.

## Editing content

Everything is plain HTML in `index.html` — no templating.

| Section | Anchor | Notes |
|---|---|---|
| Hero | `.hero` | Each headline line needs its own `<span class="line"><span class="line__i">` wrapper for the reveal to work. |
| Stats | `.stats` | Set the target on `data-to`; JS counts up to it. |
| Services | `#services` | `.svc` cards, cursor-tracked gold glow. |
| Work | `#work` | Currently one card. Add `proj--wide` for full width; `data-vis="1..5"` picks the gradient. Drop `work--solo` once there are two or more. |
| FAQ | `#faq` | Native `<details>`; JS keeps only one open. |

There is no pricing section — it was removed. Pricing is handled on the call, and the FAQ
says so.

### The call button

The CTA button is `<a href="tel:+918630503262" data-display="8630503262">`.

- **On a phone or tablet** the script does nothing and the browser opens the dialler with
  the number already filled in.
- **On desktop** `tel:` normally does nothing at all, which reads as a broken button — so
  there the script cancels the default, copies the dialable `+91…` form to the clipboard,
  and confirms with a toast showing the friendly `data-display` version.

To change the number, update **both** the `href` (keep the country code) and `data-display`
(what people read).

### Replacing project thumbnails with real screenshots

Cards currently use a CSS gradient plus a serif monogram. To use an image, swap the
`.proj__vis` contents for an `<img>` and drop `place-items` — the `::after` scrim already
sits on top.

## Before you launch

These are placeholders and need your real details:

- **`webura0@gmail.com`** — appears in the CTA, footer and mobile menu.
- **Testimonials** — the section is commented out in `index.html` with instructions for
  turning it back on. Draft quotes to send AURA MUN for approval are in
  `testimonial-draft.md`. Only publish wording a client has actually signed off on.
- **The "Trusted by" marquee** — still eight invented client names, and they contradict the
  work section, which lists only auramun.com. Replace with real clients or delete the
  `.logos` section.
- **Stat figures** (7 days, 1 project, 97% retention) — set to your real numbers.
- **More social links** — only Instagram (`instagram.com/webu.ra`) is wired up. LinkedIn and
  Dribbble placeholders were removed rather than left as dead `#` links; add them back to
  the footer "Connect" column if those accounts exist.
- **Open Graph image** — add `<meta property="og:image">` for link previews.

## Responsive behaviour

Verified with no horizontal overflow, no clipped text and no wrapped display type at
280, 320, 375, 393, 768, 844×390 (landscape), 1024, 1030, 1440, 1920 and 2560.

Two things are less obvious than normal breakpoints:

- **The hero headline is sized by height as well as width** —
  `clamp(52px, min(12.5vw, 13.5vh), 178px)`. The `vh` term is what stops "THAT convert."
  from wrapping onto a second line on wide screens, and what keeps the headline from
  swallowing a landscape phone. Keep both terms if you change the size.
- **The hero's vertical spacing is in `vh`, not `vw`**, so padding and gaps shrink on short
  screens and the scroll cue stays above the fold on a 1080p laptop.

`--max` widens on large displays (1320px above 1600, 1440px above 2000) so the layout
doesn't strand itself in a narrow strip, and `--pad` drops to 18px below 380px.

### Touch devices

A `@media (hover:none), (pointer:coarse)` block near the bottom of `styles.css` handles
what a width breakpoint can't:

- Every link, button and FAQ row gets a **44px minimum hit area**. The burger keeps its
  34px look but gains a 44px target via an `::after` overlay; the logo uses padding with a
  matching negative margin so growing the target doesn't shift it.
- The full-screen grain **stops animating** — on a phone it was repainting the whole
  viewport several times a second for texture nobody notices in motion.

`min-height` is declared twice on the hero (`100vh` then `100svh`) so iOS below 15.4, which
doesn't know `svh`, still gets a full-height hero instead of none.

Scroll handlers (sticky nav, hero parallax, manifesto word reveal) are throttled to one
call per animation frame via `onFrame()` in `script.js`. The manifesto reveal also skips
the DOM write entirely unless the word boundary moved — it touches 27 spans otherwise.

## Accessibility & motion

- Full `prefers-reduced-motion` support: the preloader skips, reveals start visible, the
  custom cursor and magnetic buttons are disabled.
- Custom cursor and hover effects are disabled on touch/coarse pointers.
- Body copy contrasts ~10:1 against the background; gold on black is ~9:1.
- The preloader has a 4.5s failsafe so the site can never stay hidden behind it.

## Deploying

Static hosting, drag-and-drop. On Vercel: `npx vercel --prod` from this folder. Netlify,
Cloudflare Pages and GitHub Pages all work with no configuration.
