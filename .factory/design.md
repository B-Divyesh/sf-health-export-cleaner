# Health Export Cleaner — visual thesis

## Direction: brutalist concrete and moss

This is a workshop for reducing disclosure, not a health dashboard. The visual
language borrows from a concrete sorting bench: heavy rules establish the safe
boundary, stamped labels explain what is happening, and moss green marks the
small set that is allowed to pass through. Roughness belongs at the edge of the
page while the data controls remain calm, flat, and exact.

## Palette

The interface is deliberately single-mode and paints every background. A dark
utility theme would make dense form controls and CSV previews less legible; the
light concrete treatment also makes the privacy boundary more tangible.

| Token | Value | Role |
| --- | --- | --- |
| Concrete | `#E8E5DC` | Page background |
| Chalk | `#F7F5EE` | Work surface |
| Charcoal | `#171A17` | Primary text and structural rules |
| Weathered | `#4F554D` | Secondary text (7:1+ on Chalk) |
| Moss | `#315C36` | Primary action, selected data |
| Moss dark | `#1E3B22` | Hover and strong status |
| Lichen | `#C8D3B8` | Selected/allowed background |
| Amber | `#9A5B13` | Warning border and pending state |
| Rust | `#8A3026` | Error and removed-data state |
| White | `#FFFFFF` | Text on Moss/Rust |

Color never carries status alone: every state includes a label, symbol, or
sentence. Charcoal rules use at least 3:1 contrast against either surface.

## Type

- **Headings / stamps:** `Arial Narrow`, `Roboto Condensed`, `Franklin Gothic
  Condensed`, system sans-serif. Uppercase is reserved for short workshop
  labels and counters, never paragraphs.
- **Body / controls / tabular data:** `Inter`-like system stack (`ui-sans-serif`,
  `system-ui`, `Segoe UI`, sans-serif). No font downloads are required, keeping
  the offline shell small and private.
- Scale: 14px label, 16px body, 20px subhead, 28px section head, clamp(40–68px)
  title. Body leading is 1.55 and long text is held near 68 characters.
- Counts, dates, and preview cells use tabular numerals.

## Space, shape, and layout

- 4px base; core spacing steps are 4, 8, 12, 16, 24, 32, 48, 72px.
- Outer measure is 1180px. On wide screens the input and privacy promise share
  an asymmetric 7/5 column; the cleaner then uses a 280px step rail beside the
  work area. At 760px the rail becomes a horizontal status strip and content
  stacks. At 390px nonessential illustration detail is cropped, tables scroll,
  and the primary download controls become full-width.
- Corners are 0–4px: concrete slabs and paper tags, not friendly floating
  bubbles. Structural borders are 2px; primary buttons use a hard 4px offset
  shadow that collapses when pressed.
- Cards appear only for independently actionable artifacts (source file,
  removal receipt, final downloads). Related controls are grouped by spacing
  and rules instead.

## Interaction grammar

- The source file is “placed on the bench” through a native file input or drop
  target. Inspection immediately reports format, size, type count, and the
  detected date span.
- Disclosure controls read top-to-bottom: range, record types, fields, timestamp
  precision. A persistent removal receipt summarizes exclusions in words and
  counts before export.
- Moss means intentionally kept; rust strike marks mean removed; amber means a
  limitation needs attention. Buttons use action-specific verbs.
- Focus uses a 3px moss outline with a 3px light offset. Touch targets are at
  least 44px. Loading and export progress are announced in a live region.

## Motion

- 180ms ease-out for button press, disclosure-panel reveal, and progress fill.
  Elements move no more than 8px and only to communicate their source.
- The source-to-output diagram gains a one-time clipping sweep when inspection
  completes; nothing loops.
- With `prefers-reduced-motion: reduce`, transforms and smooth scrolling are
  removed, progress width updates instantly, and state changes use opacity or
  no transition.

## Asset plan and prompt sheet

One generated editorial hero, **`sorting-bench`**, makes the local transformation
legible: an overhead concrete workbench where a dense bundle of abstract health
record strips enters a physical sieve, precise location-pin fragments and ID
tags remain behind, and a smaller orderly moss-green stack exits. It contains
no UI screenshot, people, medical claims, brands, text, logos, or watermark.
Small functional marks (file, shield, check, download) are authored as inline
SVG/CSS so they remain sharp and accessible.

### Art direction prompt

Use case: stylized-concept. Asset type: wide landing-page hero illustration.
Scene: overhead brutalist concrete sorting bench with a heavy mechanical privacy
sieve. Subject: tangled off-white paper data strips and subtle abstract pulse
marks enter from the left; location-pin fragments, route squiggles, and blank ID
tags are caught in the sieve; a small aligned stack exits on the right. Medium:
tactile editorial still life, cut paper, cast concrete, oxidized steel, real
shadows, sparse moss growth. Composition: panoramic, clear left-to-right flow,
open quiet space, no interface. Light: overcast northern window, sober and
trustworthy. Palette: warm concrete, charcoal, moss green, lichen, restrained
rust. Lens: orthographic overhead, crisp material detail. Avoid: people, human
bodies, medical devices, readable text, numbers, logos, watermarks, glossy 3D,
neon, gradients, generic cyber-security symbols, blood, and hospital imagery.

## Provenance

- Generated specifically for this product using the factory Azure image
  deployment (`factory-image`) on 2026-08-28. Prompt is recorded above and in
  `assets/src/sorting-bench.json`. Original generation and reviewed candidates
  live in `assets/src/`; optimized derivatives ship from `public/assets/`.
- Generated imagery is disclosed in the product footer. Functional line icons
  are original, authored in the application source, and MIT-licensed with the
  repository.
