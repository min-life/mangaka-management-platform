# MangaStudio Theme Colors

This document summarizes the current color theme used across the MangaStudio web app.

## Core Palette

| Token | Hex | Usage |
| --- | --- | --- |
| `background.primary` | `#222831` | Main app background, auth page background, protected dashboard background |
| `surface.primary` | `#393E46` | Inputs, search bars, secondary buttons, elevated dark UI surfaces |
| `surface.focus` | `#414854` | Focused input background |
| `border.primary` | `#4A5260` | Input border, social button border, subtle component border |
| `accent.primary` | `#FFD369` | Main brand accent, CTA button, active tab, highlights, icon accent |
| `text.primary` | `#EEEEEE` | Main text on dark backgrounds |
| `text.muted` | `#8f9aa8` | Input placeholder text |
| `text.secondary` | `#aeb7c2` | Secondary helper text, divider label |

## Authentication UI

| Element | Background | Border | Text | Focus / Hover |
| --- | --- | --- | --- | --- |
| Page background | `#222831` | - | `#EEEEEE` | - |
| Auth panel | `#222831` | - | `#EEEEEE` | right fade `black/15` |
| Input | `#393E46` | `#4A5260` | `#FFFFFF` | border `#FFD369`, bg `#414854`, ring `#FFD369/20` |
| Primary button | `#FFD369` | - | `#222831` | hover `#FFFFFF` |
| Social button | `#393E46` | `#4A5260` | `#EEEEEE` | hover border `#FFD369`, hover bg `#303640` |
| Error box | `red-400/10` | `red-400/30` | `red-200` | - |
| Success / notice box | `#FFD369/10` | `#FFD369/30` | `#f4d98a` | - |

## Dashboard UI

| Element | Hex | Usage |
| --- | --- | --- |
| `#222831` | Main dashboard background |
| `#393E46` | Header/search/sidebar-like controls |
| `#0c1219` | Main table container background |
| `#0b1118` | Table row background |
| `#1d242d` | Table header and footer background |
| `#202832` | Table row hover |
| `#272e38` | Selected row background |
| `#4b535f` | Dashboard button/input border |
| `#555d69` | Header search border |
| `#5b626d` | Vertical divider |
| `#FFD369` | Active tab, progress bar, notification dot, highlight text |
| `#dce7f3` | Table header and metadata text |

## Status Colors

| Status | Border | Background | Text |
| --- | --- | --- | --- |
| `INKING` | `#4a4f55` | `#20282b` | `#f2f6f4` |
| `SCRIPT PHASE` | `#6c5516` | `#30270d` | `#ffd35b` |
| `STORYBOARD` | `#4f6e73` | `#2a454a` | `#e9fbff` |

## Brand Direction

The theme is a dark professional manga production interface:

- `#222831` keeps the app grounded and focused.
- `#393E46` creates readable dark surfaces without strong contrast jumps.
- `#FFD369` is the main brand accent and should be reserved for important actions, selected states, highlights, and brand moments.
- `#EEEEEE` is the default readable text color on dark backgrounds.

## Usage Rules

- Use `#FFD369` sparingly so primary actions stay visually important.
- Avoid bright white input backgrounds; auth inputs should stay dark.
- Use `#393E46` or nearby dark grays for controls and panels.
- Use `#FFD369` for focus states instead of blue so forms stay on brand.
- Keep destructive/error states red and separate from the yellow brand accent.

