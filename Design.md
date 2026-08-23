# Design System & Visual Specification

## 1. Visual Philosophy & Theme
**Theme**: Institutional Cryptographic Workstation  
**Design Category**: Operate Mode (High density, high precision, functional clarity)  
**Core Goal**: Deliver an authentic, professional financial tool that avoids generic AI visual clichés (no purple-to-cyan gradient text, no fuzzy drop-shadow glows, no unearned sparkles).

---

## 2. Color Palette & Surface Tokens

| Token | Hex Value | Role / Usage |
| :--- | :--- | :--- |
| **`bg-canvas`** | `#0b0d11` | Root canvas / viewport background |
| **`panel-surface`** | `#12151c` | Primary container & card background |
| **`panel-subtle`** | `#0f1217` | Nested data cards & metric blocks |
| **`border-base`** | `#1f242e` | 1px structural dividing lines & card borders |
| **`border-subtle`** | `#1a1e26` | Internal table & item dividers |
| **`input-surface`** | `#0b0d11` | Text and numerical input background |
| **`text-primary`** | `#f8fafc` | Main headings, primary labels, values |
| **`text-secondary`**| `#94a3b8` | Supporting copy, parameter explanations |
| **`text-muted`**    | `#64748b` | Sub-labels, Stars conversions, placeholders |

### Semantic Accents
* **Action Primary**: `#f8fafc` (Solid platinum on dark backgrounds for high-priority CTA).
* **Inflow / Success**: `#34d399` / `#10b981` (Emerald-400 for deposits and confirmed states).
* **Outflow / Info**: `#60a5fa` / `#3b82f6` (Blue-400 for withdrawals and active circuit links).
* **Warning / Witness**: `#fbbf24` (Amber-400 for private secret keys and warning notes).
* **Error / Destructive**: `#f87171` (Rose-400 for transaction failures).

---

## 3. Typography & Hierarchy

### Font Families
1. **Functional Sans (`Inter`, system-ui)**: Used for all UI controls, labels, buttons, navigation, and explanatory copy.
2. **Technical Monospace (`JetBrains Mono`, Menlo, monospace)**: Strictly reserved for:
   * Cryptographic addresses (`midnight1...`, `0x...`)
   * Transaction IDs and hash commitments
   * Token amounts and Stars numeric data
   * Circuit names and code references

### Tabular Numerals
All financial numbers use `font-variant-numeric: tabular-nums;` to guarantee fixed-width alignment in balance counters, inflow/outflow tallies, and audit logs.

### Type Scale
* **Display / Main Heading**: `1.75rem (28px)` / `font-bold` / `tracking-tight`
* **Card Heading**: `0.875rem (14px)` / `font-semibold` / `text-slate-100`
* **Metric Counter**: `1.5rem (24px)` / `font-bold` / `font-mono` / `tabular-nums`
* **Body / Description**: `0.75rem (12px)` to `0.8125rem (13px)` / `text-slate-400`
* **Micro Label**: `0.6875rem (11px)` / `font-mono` / `uppercase` / `tracking-wider`

---

## 4. Component Patterns & Affordances

### 4.1. Buttons & Controls
* **Primary Action**: Solid background (`bg-emerald-400` or `bg-blue-400` or `bg-slate-100`), dark contrasting text (`text-slate-950`), radius `0.5rem (8px)`, hover brightness adjustment.
* **Secondary / Outline**: `bg-[#181d26]`, `border border-[#272f3e]`, `text-slate-200`, hover `bg-[#202734]`.
* **Disabled State**: `opacity-40`, `cursor-not-allowed`.

### 4.2. Inputs
* Solid dark background (`#0b0d11`), border `#232936`.
* On Focus: 1px blue outline (`#3b82f6`) with zero fuzzy glow.
* Integrated unit badges (`tNIGHT` / `Stars`) embedded right inside the input field.

### 4.3. Execution Inspector Modal
* Solid dark backdrop with subtle blur (`backdrop-blur-sm`).
* Step checklist showing clear status icons: `Loader2` (running) / `CheckCircle2` (done) / `AlertCircle` (error).
* Non-intrusive dismiss button upon completion.

---

## 5. Craft Floor & Anti-Pattern Compliance
This UI has been audited and verified via `npx impeccable detect src/`:
* 0 gradient text elements.
* 0 low-contrast gray-on-color badges.
* 0 decorative zero-blur glowing drop shadows.
