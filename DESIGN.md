# Design Guidelines

This document captures the current public homepage design language from `src/routes/_public/index.tsx`. Use it as the baseline when extending public-facing tournament discovery pages.

## Design Direction

The visual language is bold, athletic, and event-driven. It should feel like a modern sports tournament platform: high contrast, energetic green accents, large condensed typography, immersive imagery, and clear calls to action.

Core qualities:

- Competitive and celebratory
- Dark green brand foundation
- Bright lime/emerald accents
- Large editorial headings
- Card-based tournament discovery
- Real-time/live-event cues
- Mobile-first responsive layout

## Color System

Primary brand color:

- Deep court green: `#1a3a2a`

Accent colors:

- Lime highlight: `text-lime-400`, radial `#a3e635`
- Emerald live/success: `text-emerald-600`, `bg-emerald-50`, radial `#22c55e`, `#4ade80`
- Amber in-progress: `text-amber-600`, `bg-amber-50`, `bg-amber-500`
- Slate completed/neutral: `text-slate-600`, `bg-slate-100`, `bg-slate-500`

Surface colors:

- Primary dark sections use `bg-[#1a3a2a]` with white text.
- Content cards use `bg-card`, `shadow-xl`, and subtle rings like `ring-1 ring-foreground/10`.
- Secondary sections use `bg-muted/30` or standard page background.
- Empty and loading states use `bg-muted`, dashed borders, and muted foreground text.

Text contrast on dark sections:

- Primary text: `text-white`
- Supporting copy: `text-white/70`
- Metadata: `text-white/50`
- Dividers: `bg-white/10`

## Typography

Headings rely on the project heading font via `font-heading`.

Hero heading:

- `font-heading`
- `font-black`
- `uppercase`
- `tracking-tight`
- Tight line-height: `leading-[0.95]`
- Responsive sizing: `text-5xl md:text-7xl lg:text-8xl`
- Use italic accent text for the most important word, e.g. `text-lime-400 italic`.

Section headings:

- `font-heading`
- `font-black` or `font-bold`
- `tracking-tight`
- Typical sizes: `text-3xl md:text-4xl`, or `md:text-5xl` for CTA blocks.

Body copy:

- Keep copy concise and direct.
- Use relaxed line-height for hero/supporting text: `leading-relaxed`.
- Use `text-muted-foreground` on light surfaces and `text-white/70` on dark surfaces.

Metadata:

- Small labels use `text-xs`, `font-medium`, `tracking-wider`, and `uppercase`.
- Tournament card metadata uses compact icon-label rows with `text-sm`.

## Layout

Global page structure:

- Top-level wrapper: `flex flex-col`.
- Horizontal page padding: `px-4 md:px-6`.
- Maximum content width: `mx-auto max-w-7xl`.
- Public sections should be responsive from mobile upward.

Hero:

- Full-width dark green section.
- Use `relative overflow-hidden` to contain animated mesh backgrounds.
- Padding: `pt-8 pb-16 md:pt-10 md:pb-20`.
- Content should sit above background effects with `relative z-10`.
- Hero text column should stay constrained, e.g. `md:max-w-2xl`.
- Use vertical rhythm with `gap-6`.

Featured event:

- Float the featured card upward over the hero with negative margin: `-mt-8`.
- Use `scroll-mt-[15vh]` for anchor targets.
- Card style: `rounded-2xl bg-card shadow-xl ring-1 ring-foreground/10`.
- Stack on mobile, switch to horizontal layout at `md`.

Tournament grid:

- Section padding: `py-16 md:py-24`.
- Grid: `grid gap-6 md:grid-cols-2 xl:grid-cols-3`.
- Cards use an image-first `aspect-[4/3]` layout.

CTA:

- Use a muted outer section with a dark green rounded panel.
- Rounded panel: `rounded-3xl bg-[#1a3a2a]`.
- Center content with `text-center`, `mx-auto`, and constrained widths.
- Padding: `px-6 py-16 md:px-12 md:py-24`.

## Components

Buttons:

- Use the project `Button` component for buttons and links.
- For anchors and router links, set `nativeButton={false}` and use the `render` prop.
- Do not use `asChild`.
- Primary public CTAs use `variant="green"` and often `size="xl"`.
- Secondary dark-section actions can use `variant="ghost-border"`.
- Use `ChevronRightIcon` after forward-moving CTA labels.

Badges:

- Status badges should be soft and readable on light surfaces.
- Completed: `bg-slate-100 text-slate-600`
- In progress: `bg-amber-50 text-amber-600`
- Upcoming: `bg-emerald-50 text-emerald-600`
- Keep badge typography normal weight unless placed directly over imagery.

Tournament image cards:

- Wrap the card in a `Link` to the tournament detail route.
- Use `aspect-[4/3]`, `rounded-2xl`, `overflow-hidden`, and `isolate`.
- Image should fill the card with `absolute inset-0 h-full w-full object-cover`.
- Add a dark gradient overlay: `bg-gradient-to-t from-black/80 via-black/30 to-black/10`.
- Place content at the bottom with absolute positioning and padding.
- Use white text with opacity for metadata and descriptions.
- Hover interaction: lift card with `hover:-translate-y-1`, add `hover:shadow-xl`, and scale image with `group-hover:scale-105`.

Icons:

- Use `lucide-react` icons with the `Icon` suffix.
- Common public icons: `CalendarIcon`, `ChevronRightIcon`, `MapPinIcon`, `TrophyIcon`, `UsersIcon`.
- Metadata icons are typically `size-4` or `size-3.5`.

## Imagery

Tournament cards are image-led and should feel cinematic.

Guidelines:

- Prefer action-oriented pickleball or tournament imagery.
- Always include a dark gradient overlay to preserve text readability.
- Use a placeholder image when a tournament has no banner image.
- Keep card copy short enough to avoid competing with imagery.

## Motion

Motion should be energetic but restrained.

Hero background:

- Use blurred radial gradient orbs over the deep green background.
- Animate slowly with `ease-in-out infinite` loops between 8 and 12 seconds.
- Keep opacity low: roughly `0.15` to `0.30`.
- Add a subtle noise texture overlay at very low opacity, around `0.03`.

Live indicator:

- Use a small lime dot with `animate-ping` to indicate live tracking.
- Pair it with a static dot so the indicator remains visible between animation pulses.

Cards:

- Use quick but smooth transitions: `transition-transform duration-300`.
- Image zoom can be slower: `duration-500`.
- Avoid excessive motion on text or layout.

## States

Loading state:

- Use skeleton blocks matching the eventual card grid.
- Skeleton card: `aspect-[4/3] animate-pulse rounded-2xl bg-muted`.
- Stagger animation delays when rendering multiple placeholders.

Empty state:

- Use a centered dashed container with generous vertical padding.
- Include a muted circular icon background.
- Use a short heading and one sentence of explanatory copy.

Status language:

- `completed` renders as `Completed`.
- `inProgress` renders as `In Progress`.
- Any other tournament status defaults to `Upcoming`.

## Content Voice

Use concise, active, sports-oriented language.

Examples:

- `Where Champions Are forged`
- `Live Tournament Tracking`
- `Discover public pickleball events near you`
- `Want to host your own tournament?`

Tone guidelines:

- Direct and energetic
- Avoid corporate SaaS jargon
- Keep CTAs action-oriented
- Make live scoring and brackets feel immediate

## Implementation Notes

- Keep route files ordered with the `Route` export first, then the main page component, then helper components and utilities.
- Use TanStack Router `Link` for internal navigation.
- Use Convex queries through `convexQuery` and TanStack Query for reads.
- Use existing UI components from `src/components/ui/`.
- Preserve the base-ui pattern: links through `Button` use `render`, not `asChild`.
- Keep public page layout mobile-first with `md` and `xl` breakpoints.
