---
name: Fleet Dispatch Logistics
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#44474c'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#525f75'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0f1c2f'
  on-primary-container: '#78849c'
  inverse-primary: '#bac7e1'
  secondary: '#0050cc'
  on-secondary: '#ffffff'
  secondary-container: '#0266ff'
  on-secondary-container: '#f9f7ff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3fd'
  primary-fixed-dim: '#bac7e1'
  on-primary-fixed: '#0f1c2f'
  on-primary-fixed-variant: '#3b475c'
  secondary-fixed: '#dae1ff'
  secondary-fixed-dim: '#b3c5ff'
  on-secondary-fixed: '#001849'
  on-secondary-fixed-variant: '#003fa4'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for mission-critical commercial fleet breakdown dispatch, roadside assistance, and mobile tyre repair operations. 

### Brand Personality & Core Mood
- **Relentlessly Reliable & Mission-Critical:** When a commercial semi-trailer or 30-tonne rig suffers a tyre blowout on an isolated highway shoulder, stress is acute and downtime costs compound by the minute. The aesthetic projects authoritative competence, rapid response, and operational readiness.
- **Utilitarian & Ergonomic:** Built for truck drivers, mobile tyre fitters, and fleet controllers operating under harsh environmental conditions—such as bright direct sunlight through a cab windscreen, oily fingers, or nighttime roadside emergencies with hazard lights flashing.
- **High-Contrast Precision:** Visual clutter is eliminated in favor of definitive hierarchy, clear vehicle telemetry cues, and unmistakable situational urgency.

### Design Movement
The system balances **Modern Utilitarianism** with **High-Contrast Ergonomics**:
- Crisp, razor-sharp information density without cognitive overload.
- Generous, tactile touch surfaces (minimum 48–56px) suited for roadside one-handed device use.
- High-visibility safety accents borrowed directly from transport logistics and highway breakdown services.

## Colors

The palette draws directly from industrial automotive logistics, combining authoritative dark navy foundations with high-luminescence roadside emergency signaling tones.

### Color Tokens & Roles

- **Primary (`#0E1B2E` - Deep Industrial Navy):** Represents heavy-duty transport authority, structural solidity, and institutional trust. Used for top app bars, heavy primary structural containers, dark brand accents, and prominent headers.
- **Secondary (`#0066FF` - Azure Dispatch Blue):** The primary interactive driver. Drives high-confidence user flows, GPS navigation route indicators, interactive dispatch triggers, and primary confirmation buttons. Paired with an electric highlight (`#00D2FF`) for active location beacons and live telemetry pings.
- **Tertiary (`#F59E0B` - Highway Caution Amber):** Directly mirrors roadside breakdown triangles and hazard beacons. Reserved strictly for warnings, pending tyre inspection dispatches, tyre pressure critical alerts, and time-sensitive status flags.
- **Neutral (`#1F2937` - Industrial Charcoal Slate):** Grounds the typographic baseline for maximum legibility. Supported by canvas background shades (`#F3F5F9` light background and `#FFFFFF` crisp card surfaces) to deliver stark optical separation under outdoor glare.
- **Emergency Functional Accent (`#EF4444` - Critical Blowout Red):** Applied to active roadside stops, emergency safety toggles, and cancellation actions.
- **Success Functional Accent (`#10B981` - Job Cleared Green):** Reserved for fitted & inspected confirmations, driver signature verifications, and fleet payment receipts.

### Color Contrast & Environmental Adaptability
All body and critical numerical data (e.g., tyre axle positions, GPS ETA minutes, quote totals) guarantee an AAA contrast ratio (>= 7:1) against background surfaces to maintain instant scannability inside high-glare vehicle cabins.

## Typography

Typography balances rapid scannability with mechanical precision:
- **Headlines (Plus Jakarta Sans):** Geometric clarity with assertive terminal cuts. Delivers high impact for job codes, vehicle registrations, and critical stage titles.
- **Body & Data (Inter):** Highly legible, neutral, and systematically optimized for small screens, numerical lists (tyre dimensions, PSI metrics, pricing tables), and tabular breakdown manifests.

### Typographic Hierarchy Rules
- Tabular figures (`font-variant-numeric: tabular-nums`) must be used for all truck coordinates, tyre specification strings (e.g., `315/80 R22.5`), ETAs, and repair invoices to prevent visual jitter during live updates.
- Uppercase styling with expanded tracking (`0.05em`) is strictly reserved for micro status badges (e.g., `DISPATCHED`, `EN ROUTE`, `ON SITE`, `COMPLETED`).

## Layout & Spacing

This design system uses a **fluid, mobile-first single-column structure** optimized for hand-held field devices (360px to 430px viewports) with adaptive multi-column expansion for tablet cab-mounts and fleet control consoles.

### Mobile Screen Geometry
- Standard mobile margins are compact (`margin-mobile: 0.75rem`) to maximize visible screen real estate for axle diagrams, maps, and fitment checklists.
- Component padding relies heavily on `space-md` (16px) and `space-lg` (24px) around interactive triggers to guarantee generous hit targets.
- Stacked elements maintain a baseline 8px rhythm.

### Ergonomics & Safe Zones
- **Bottom-Heavy Primary Actions:** Breakdown emergency buttons and dispatch acceptance cards are pinned to the lower bottom sheet thumb-zone with minimum 52px target heights.
- **Top Bar Utility:** Reserved purely for status telemetry, SOS quick-call shortcuts, and back navigation.

## Elevation & Depth

Visual hierarchy uses **tonal layer separation combined with crisp, low-contrast structural outlines**. Heavy blur effects and diffuse ethereal shadows are avoided to keep cards legible in harsh direct sunlight.

### Layer Hierarchy
1. **Base Surface (Level 0):** Canvas `#F3F5F9`. Flat neutral background hosting list content and map viewports.
2. **Card & Panel Layer (Level 1):** Solid white `#FFFFFF` bounded by a 1px structural stroke in `#E2E8F0` and an ultra-subtle grounding shadow (`box-shadow: 0 1px 3px rgba(14, 27, 46, 0.06), 0 1px 2px rgba(14, 27, 46, 0.04)`).
3. **Floating & Dynamic Drawers (Level 2):** Breakdown acceptance prompts, active repairer track cards, and bottom action sheets use elevated white containers (`box-shadow: 0 8px 24px -4px rgba(14, 27, 46, 0.12), 0 2px 6px -1px rgba(14, 27, 46, 0.05)`).
4. **Critical Modal & Alert Overlays (Level 3):** Modal backdrop `#0E1B2E` with 70% opacity, hosting cards with crisp white borders and deep isolation shadows.

## Shapes

The system implements **Roundedness Tier 2 (0.5rem base radius)**, creating balanced, industrial corners that reflect contemporary vehicle dashboards and hardware interfaces.

### Curvature Guidelines
- **Buttons & Text Inputs:** 8px (`0.5rem`) corner radius. Balances visual softness with mechanical structure.
- **Cards, Modals & Tyre Axle Selectors:** 12px to 16px (`rounded-lg` / `rounded-xl`) corner radius, creating clear visual containers without feeling decorative.
- **Pills & Status Chips:** Full rounded pill format (`9999px`) used exclusively for status chips (e.g., `En Route`, `Dual Axle`) to differentiate informational badges from clickable rectilinear cards.

## Components

### Buttons
- **Primary Breakdown / Dispatch CTA:** Height 52px minimum. Filled with `#0066FF`, high-contrast white `#FFFFFF` text in `label-lg` (Inter SemiBold). On active press, darkens to `#0052CC`. Full-width on mobile viewports.
- **Emergency Roadside Trigger:** High-visibility `#0E1B2E` background with a `#F59E0B` hazard perimeter stroke and amber indicator icon for rapid roadside distress logging.
- **Secondary Actions:** White background, 1.5px `#E2E8F0` border, `#0E1B2E` text, subtle hover/press tint of `#F3F5F9`.

### Interactive Tyre & Axle Selector
- Custom commercial component displaying standard truck/trailer axle configurations (e.g., 2-axle steer/drive, tri-axle trailer).
- Axle positions are rendered as distinct, tactile button modules:
  - **Normal State:** Neutral stroke `#CBD5E1`, white fill.
  - **Damaged / Selected State:** Bold `#EF4444` or `#0066FF` fill with high-contrast tyre position labeling (`L1`, `R1`, `L2-Outer`, etc.).
  - Touch target for each tyre on mobile is a minimum of 44x44px.

### Dispatch Cards
- Constructed on `#FFFFFF` surfaces with 1px `#E2E8F0` borders.
- Top section displays vehicle registration and tyre specs (e.g., `CA 492-811` • `315/80 R22.5 Steer`) using `headline-sm` with tabular numbers.
- Integrated status chip in top-right corner.
- Bottom card actions host direct "Call Driver" and "Navigate GPS" quick-action dual buttons.

### Chips & Badges
- Pill-shaped (`9999px`), 28px height, containing uppercase `label-sm` text.
- **Pending/Searching:** `#FEF3C7` background with `#B45309` amber text.
- **Dispatched/Fitter En Route:** `#EFF6FF` background with `#1D4ED8` azure text.
- **Job Completed:** `#ECFDF5` background with `#047857` green text.

### Form Inputs & Roadside Location Pickers
- Input height: 48px to 52px with 16px horizontal internal padding.
- 1px border in `#CBD5E1`, transitioning to 2px `#0066FF` on focus with no glow ring.
- Accompanied by prominent leading icons (e.g., GPS pinpoint, tyre tread icon, clipboard number) in `#64748B`.
- Integrated instant "Use Current Roadside GPS" pin button embedded inside the input suffix.

### Lists & Activity Feeds
- Clean row dividers (`1px solid #E2E8F0`) with minimum 56px row height.
- Prominent timestamps rendered in `body-sm` (`#64748B`) aligned right.
- High-visibility leading status indicators (12px circular state dots or vehicle state icons).