# Mobile Theme Colors

Nguon goc: `mobile/src/constants/colors.ts`, `mobile/tailwind.config.js`, va cac man hinh trong `mobile/src/`.

Tai lieu nay tom tat theme mau hien tai cua ung dung mobile Mangaka de AI/agent va developer dung thong nhat khi tao hoac sua UI.

## Core Palette

| Token | Value | Tailwind alias | Usage |
| --- | --- | --- | --- |
| `Colors.bg` | `#222831` | `mangaka-bg` | Nen chinh toan app, navigator content, status bar |
| `Colors.surface` | `#393E46` | `mangaka-surface` | Card, input, search bar, panel, list item |
| `Colors.surfaceContainer` | `#4A4F58` | `mangaka-surface-container` | Chip active, badge/container noi hon surface |
| `Colors.text` | `#EDF1FB` | `mangaka-text` | Text chinh tren nen toi |
| `Colors.accent` | `#FFD369` | `mangaka-accent` | Brand accent, CTA, active state, highlight, notification dot |

## Text Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `Colors.text` | `#EDF1FB` | Title, body text, icon chinh |
| `Colors.textMuted` | `rgba(237,241,251,0.6)` | Secondary text, metadata, helper text |
| `Colors.textFaint` | `rgba(237,241,251,0.4)` | Disabled/faint text, empty-state detail, subdued icons |
| `Colors.textPlaceholder` | `rgba(237,241,251,0.5)` | Placeholder text va search icon |

## Border And Overlay Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `Colors.borderFaint` | `rgba(255,255,255,0.1)` | Border card/input quan trong hon |
| `Colors.borderSubtle` | `rgba(255,255,255,0.05)` | Divider, border rat nhe |
| `Colors.overlayLight` | `rgba(255,255,255,0.05)` | Nen icon button, overlay nhe |
| `Colors.iconBg` | `rgba(237,241,251,0.1)` | Nen icon trong list/card |

## Status Colors

| Token | Value | Tailwind alias | Usage |
| --- | --- | --- | --- |
| `Colors.statusPending` | `#A0A0A0` | `mangaka-status-pending` | Pending/neutral status |
| `Colors.statusProgress` | `#4DA6FF` | `mangaka-status-progress` | In progress, link/back action trong resource/project detail |
| `Colors.statusReview` | `#FFB84D` | `mangaka-status-review` | Review state, warning-like workflow state |
| `Colors.statusDone` | `#5DD39E` | `mangaka-status-done` | Done/success/verified state |

## Domain Icon Colors

| Token | Value | Tailwind alias | Usage |
| --- | --- | --- | --- |
| `Colors.iconFolder` | `#E6A14B` | `mangaka-folder` | Folder/project icon |
| `Colors.iconApp` | `#53B187` | `mangaka-app-color` | App/tool/product icon |
| `Colors.iconTask` | `#EF4444` | - | Task/destructive/error-adjacent icon |

## Local Theme Alias

`mobile/src/screens/taskDetail/components/theme.ts` tao alias cuc bo `C` cho man Task Detail, nhung van map ve `Colors`:

| Local token | Maps to |
| --- | --- |
| `C.bg` | `Colors.bg` |
| `C.surface` | `Colors.surface` |
| `C.surfaceHigh` | `Colors.surfaceContainer` |
| `C.border` | `Colors.borderSubtle` |
| `C.borderFaint` | `Colors.borderFaint` |
| `C.text` | `Colors.text` |
| `C.textMuted` | `Colors.textMuted` |
| `C.textFaint` | `Colors.textFaint` |
| `C.accent` | `Colors.accent` |
| `C.statusReview` | `Colors.statusReview` |
| `C.statusDone` | `Colors.statusDone` |

## Secondary Colors Seen In Screens

Mot so mau van dang hard-code theo ngu canh. Neu duoc dung lai nhieu lan, nen dua vao `Colors`.

| Value | Current usage |
| --- | --- |
| `#EF4444` / `rgba(239,68,68,...)` | Destructive, selected manga frame, error box |
| `#BA1A1A` | High priority badge, local error token |
| `#79BDF8` / `rgba(77,166,255,...)` | Folder/resource blue highlight |
| `#22C55E` | Project detail action icon background |
| `#DB2777` | Project detail action icon background |
| `#EEEEEE` / `#161C25` | Active task filter chip and FAB contrast |
| `#FFFFFF` / `#FFF` | White icon/text on saturated backgrounds |

De xuat token neu can chuan hoa:

```ts
danger: '#EF4444',
dangerStrong: '#BA1A1A',
resourceBlue: '#79BDF8',
successStrong: '#22C55E',
pinkAccent: '#DB2777',
onLight: '#161C25',
onColor: '#FFFFFF',
```

## Usage Rules

- Uu tien import `Colors` tu `@/src/constants/colors` thay vi hard-code mau trong component.
- Nen toan man hinh dung `Colors.bg`.
- Card, search bar, input va panel dung `Colors.surface`.
- Container/chip noi hon dung `Colors.surfaceContainer`.
- Text chinh dung `Colors.text`; text phu dung `Colors.textMuted`; text rat nhe/disabled dung `Colors.textFaint`.
- `Colors.accent` la mau brand, chi dung cho CTA, active state, highlight quan trong va brand moment.
- Border mac dinh dung `Colors.borderSubtle`; khi can ro hon dung `Colors.borderFaint`.
- Trang thai workflow dung `statusPending`, `statusProgress`, `statusReview`, `statusDone`.
- Destructive/error nen giu mau do rieng, khong thay bang `Colors.accent`.
- Neu mot mau moi xuat hien o nhieu man, them token vao `Colors` va mirror sang `tailwind.config.js`.

## Quick Reference

```ts
import { Colors } from '@/src/constants/colors';

<View style={{ backgroundColor: Colors.bg }}>
  <View style={{ backgroundColor: Colors.surface, borderColor: Colors.borderFaint }}>
    <Text style={{ color: Colors.text }}>Title</Text>
    <Text style={{ color: Colors.textMuted }}>Metadata</Text>
  </View>
</View>
```
