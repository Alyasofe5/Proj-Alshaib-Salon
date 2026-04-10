# 📐 Universal Project Rules & Best Practices

> **Scope:** This file applies to ALL project types — Web (Frontend / Backend / Full-Stack), Mobile (iOS / Android / Cross-platform), APIs, CLIs, and Desktop apps.
> **Languages:** Language-agnostic — applies to JavaScript, TypeScript, Python, Dart, Swift, Kotlin, Go, Rust, PHP, Ruby, Java, C#, and any other language.
> **Databases:** Covers Relational, NoSQL, Cloud-managed, and Embedded databases.
>
> ⚠️ **The AI must read and follow every rule in this file before writing, editing, or reviewing any code.**

---

## 🎨 1. UX/UI Design & World-Class Frontend

> Applies to: Web apps, Mobile apps, Desktop apps. Skip visual sections for CLI/API-only projects.
> **Standard:** Every UI produced must meet the quality bar of top-tier SaaS products (Linear, Vercel, Stripe, Notion, Raycast, Loom). Generic AI-looking interfaces are not acceptable.

---

### 🧠 UX Research First
- Before any design, identify **who the user is** and what they need
- Use Personas, User Journeys, and Empathy Maps
- Never start designing before defining the problem being solved
- Validate assumptions with real users when possible
- Every screen must answer: *What does the user need to do here, and what happens next?*

### 🗺️ User Flow
- Map the user's journey through the app before building
- Every screen serves one clear, primary purpose
- Minimize steps to reach any goal — apply the **3-click rule** for core actions
- Avoid dead ends — every state must have a clear next action
- Handle all UI states explicitly: **empty, loading, error, success, partial**

### 📐 Wireframing
- Start with low-fidelity wireframes before full design
- Get approval on structure and flow before applying colors and details
- Tools: Figma, Balsamiq, Whimsical, or paper sketches

---

### 🏗️ Design System — The Foundation

A design system is non-negotiable. Every project must have one.

**Design Tokens (the single source of truth):**
```css
:root {
  /* Colors */
  --color-brand-primary: #6366f1;
  --color-brand-secondary: #8b5cf6;
  --color-accent: #06b6d4;
  --color-surface-1: #0a0a0f;
  --color-surface-2: #111118;
  --color-surface-3: #1a1a24;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.16);
  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #475569;

  /* Typography */
  --font-sans: 'Inter Variable', 'Geist', system-ui, sans-serif;
  --font-display: 'Cal Sans', 'Syne', 'Clash Display', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;

  /* Spacing Scale (4pt grid) */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-20: 80px; --space-24: 96px;

  /* Border Radius */
  --radius-sm: 6px;   --radius-md: 10px;
  --radius-lg: 16px;  --radius-xl: 24px;
  --radius-2xl: 32px; --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
  --shadow-glow: 0 0 40px rgba(99,102,241,0.25);
  --shadow-glow-accent: 0 0 60px rgba(6,182,212,0.2);

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;
}
```

**Rules:**
- Never hardcode any color, spacing, font, or shadow value — always use tokens
- Every reusable component is documented: purpose, props/variants, do's and don'ts
- Tokens change in one place and propagate everywhere

---

### ✨ Visual Design — World-Class Standards

**The golden rule:** Every interface must feel *crafted*, not generated. If it looks like a default Tailwind template, it fails.

#### Color & Theme
- Use a **dark-first** palette for SaaS products — it reads as premium and modern
- Build a primary brand color with a full ramp (50→950) for flexibility
- Use **gradient accents** purposefully — not decoratively:
  ```css
  /* Brand gradient — used for CTAs, highlights, active states */
  --gradient-brand: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);

  /* Subtle surface gradient — used for cards, sections */
  --gradient-surface: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%);

  /* Glow overlay — used behind hero text, feature icons */
  --gradient-glow: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.3), transparent);
  ```
- Glass morphism for floating elements (modals, dropdowns, sidebars):
  ```css
  .glass {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  ```
- Noise texture for depth on surfaces (subtle, not distracting):
  ```css
  .surface-noise::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,..."); /* SVG noise */
    opacity: 0.03;
    pointer-events: none;
  }
  ```

#### Typography
- Use **variable fonts** for performance and flexibility
- Establish a clear type scale:
  ```css
  /* Display — hero headlines, landing sections */
  .text-display { font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }

  /* Heading levels */
  .text-h1 { font-size: clamp(1.75rem, 3vw, 2.5rem); font-weight: 650; letter-spacing: -0.025em; line-height: 1.15; }
  .text-h2 { font-size: clamp(1.375rem, 2vw, 1.875rem); font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
  .text-h3 { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.015em; line-height: 1.3; }

  /* Body */
  .text-body-lg { font-size: 1.125rem; line-height: 1.75; color: var(--color-text-secondary); }
  .text-body    { font-size: 1rem;     line-height: 1.7;  color: var(--color-text-secondary); }
  .text-sm      { font-size: 0.875rem; line-height: 1.6;  }
  .text-xs      { font-size: 0.75rem;  line-height: 1.5;  letter-spacing: 0.02em; }

  /* Label / Badge */
  .text-label { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  ```
- Negative letter-spacing on headings is mandatory — it makes text feel designed
- Never use font-weight 400 for headings — minimum 600
- Pair a display/serif font for headlines with a clean sans for body text

#### Layout & Spacing
- Build on a **4pt grid** — all spacing values are multiples of 4
- Use **generous whitespace** — SaaS interfaces breathe; crowded = amateur
- Section padding: minimum `80px` vertical on desktop, `48px` on mobile
- Content max-width: `1200px` for wide layouts, `760px` for reading content
- Use **asymmetric layouts** to break monotony — not everything needs to be centered
- Apply **visual hierarchy** through size, weight, and color contrast — not just position

#### Borders & Surfaces
- Use **subtle borders** for definition — never thick/heavy:
  ```css
  border: 1px solid var(--color-border); /* default */
  border: 1px solid var(--color-border-hover); /* hover/active */
  ```
- Layer surfaces with slight lightness steps — creates depth without shadows:
  - Surface 1 (page bg): `#0a0a0f`
  - Surface 2 (cards): `#111118`
  - Surface 3 (elevated): `#1a1a24`
- Use **inner glow** on interactive elements to signal interactivity:
  ```css
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3);
  ```

---

### 🎬 Animation & Motion — The Differentiator

Animation is what separates a great product from a good one. Every interaction should feel **alive**.

#### Core Principles
- **Purpose over decoration** — every animation communicates something (state change, hierarchy, feedback)
- **Fast in, slow out** — elements appear quickly, exit gracefully
- **Spring physics** for interactive elements — feels natural, not robotic
- **Stagger children** — list items, cards, and grid elements animate in sequence
- **Respect `prefers-reduced-motion`** — always provide a no-animation fallback

#### Micro-interactions (apply to every interactive element)
```css
/* Button — lift on hover, press on click */
.btn {
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out),
              background var(--duration-base) var(--ease-smooth);
}
.btn:hover  { transform: translateY(-1px); box-shadow: var(--shadow-glow); }
.btn:active { transform: translateY(0) scale(0.98); }

/* Card — subtle lift */
.card {
  transition: transform var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-smooth);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  border-color: var(--color-border-hover);
}

/* Link — underline slide */
.link {
  background: linear-gradient(var(--color-brand-primary), var(--color-brand-primary)) no-repeat;
  background-size: 0% 1px;
  background-position: 0 100%;
  transition: background-size var(--duration-base) var(--ease-out);
}
.link:hover { background-size: 100% 1px; }

/* Input — glow focus */
.input {
  transition: border-color var(--duration-fast) var(--ease-smooth),
              box-shadow var(--duration-fast) var(--ease-smooth);
}
.input:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
  outline: none;
}
```

#### Page & Section Animations
```css
/* Fade + slide up — for page elements on load */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Fade in — for overlays, modals */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Scale in — for modals, popovers */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Glow pulse — for CTAs, active indicators */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
  50%       { box-shadow: 0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.2); }
}

/* Shimmer — for skeleton loading states */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-surface-3) 50%, var(--color-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**Stagger pattern for lists/grids:**
```css
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 60ms; }
.item:nth-child(3) { animation-delay: 120ms; }
.item:nth-child(4) { animation-delay: 180ms; }
/* Or use JS/Framer Motion for dynamic stagger */
```

#### Scroll-Triggered Animations
- Use `IntersectionObserver` to trigger animations when elements enter the viewport
- Standard reveal: fade + translate Y 32px → 0, duration 600ms, ease-out
- Apply to: feature sections, testimonials, pricing cards, stats, images
- Use `data-animate` attribute pattern for clean separation:
  ```js
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  ```

#### Recommended Animation Libraries
| Library | Use For |
|---|---|
| **Framer Motion** | React — spring physics, layout animations, gestures |
| **GSAP** | Complex timelines, ScrollTrigger, morphing |
| **Motion One** | Lightweight CSS animations via JS |
| **Lottie** | After Effects animations exported as JSON |
| **React Spring** | Physics-based animations in React |
| **Auto Animate** | Zero-config list/layout animations |

---

### 🌐 3D & Advanced Visual Effects

Use 3D elements for: hero sections, product showcases, feature highlights, and brand differentiation.

#### Three.js / React Three Fiber
```js
// Standard setup for a hero 3D scene
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, MeshTransmissionMaterial } from '@react-three/drei'

// Rules:
// - Always use <Suspense> with a fallback
// - Use <Float> for ambient movement — never static 3D objects
// - Use MeshTransmissionMaterial for glass/crystal effects
// - Set camera FOV between 35–60 for natural perspective
// - Enable shadows only when necessary — they're expensive
// - Use <Environment> preset for realistic lighting: 'city', 'studio', 'sunset'
// - Cap pixel ratio at 2: gl={{ pixelRatio: Math.min(window.devicePixelRatio, 2) }}
// - Dispose geometries and materials on unmount
```

**Performance rules for 3D:**
- Lazy-load the Canvas — don't block initial render
- Use `dpr={[1, 2]}` to cap pixel ratio
- Keep polygon count low — use Level of Detail (LOD) for complex scenes
- Bake lighting into textures where possible
- Use instanced mesh for repeated objects (`<Instances>`)
- Fallback to a static image/gradient for low-end devices and `prefers-reduced-motion`

#### CSS 3D & Perspective Effects
```css
/* 3D card tilt — applied via JS mouse tracking */
.card-3d {
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform var(--duration-base) var(--ease-out);
}

/* Parallax depth layers */
.layer-deep    { transform: translateZ(-100px) scale(1.1); }
.layer-mid     { transform: translateZ(-50px)  scale(1.05); }
.layer-surface { transform: translateZ(0); }

/* 3D flip */
.flip-card { transform-style: preserve-3d; transition: transform 600ms var(--ease-out); }
.flip-card:hover { transform: rotateY(180deg); }
.flip-card-front, .flip-card-back { backface-visibility: hidden; }
.flip-card-back { transform: rotateY(180deg); }
```

**Mouse-tracking 3D tilt (apply to hero cards, feature mockups):**
```js
const handleMouseMove = (e, card) => {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to 0.5
  const y = (e.clientY - rect.top)  / rect.height - 0.5;
  card.style.transform = `
    perspective(1000px)
    rotateX(${y * -12}deg)
    rotateY(${x * 12}deg)
    translateZ(8px)
  `;
};
```

#### Spline (No-Code 3D)
- Use Spline for hero 3D scenes when Three.js is overkill
- Embed via `@splinetool/react-spline` — always lazy load
- Use Spline for: product mockups, abstract 3D logos, interactive brand elements

---

### 🌟 Signature SaaS Design Patterns

These patterns are used by top SaaS products. Apply them consistently.

#### Hero Section
```
Structure:
  - Announcement badge (pill) at top: "✨ New — Feature X is live →"
  - Display headline: large, tight letter-spacing, gradient text accent
  - Subheadline: muted color, max 2 lines, 18–20px
  - CTA buttons: primary (gradient fill) + secondary (ghost/outline)
  - Social proof: "Trusted by X,000+ teams" + logo strip
  - Hero visual: 3D mockup, floating UI screenshot, or abstract 3D scene
  - Background: dark with radial gradient glow behind headline
```

**Gradient text (essential for hero headlines):**
```css
.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Feature Cards (Bento Grid)
- Use asymmetric bento grid layouts — not uniform grids
- Each card has: icon, title, short description, and a visual demo/illustration
- Cards use glass morphism with subtle border glow on hover
- Large feature card spans 2 columns — highlights the most important feature
- Subtle animated background (gradient shift, floating particles) on key cards

#### Navigation
```css
/* Floating/sticky nav with blur */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--duration-base) var(--ease-smooth);
}
```
- Logo left, links center, actions right
- Active link: brand color indicator (underline or dot)
- Mobile: slide-in drawer, not a dropdown

#### Pricing Section
- 3-tier layout: Starter / Pro / Enterprise
- Highlight the recommended plan with brand border and "Most Popular" badge
- Annual/monthly toggle with smooth pill animation
- Feature list with checkmarks — group features by category
- CTA button inherits the plan's visual weight

#### Social Proof
- Logo strip: grayscale logos, opacity 40%, hover to full opacity
- Testimonials: card grid with avatar, name, role, company logo, and quote
- Stats section: large numbers with gradient, short label below, count-up animation on scroll

#### Dashboard / App UI
```
Layout rules:
  - Sidebar: 240–280px, dark surface-2, icons + labels
  - Topbar: 60–64px height, search, notifications, avatar
  - Content area: fluid width, 24–32px padding, max-width 1200px
  - Cards: consistent 16–24px padding, 1px border, subtle shadow
  - Tables: zebra striping with surface-2/surface-3, sticky header
  - Data visualization: use chart libraries styled to match design tokens
```

#### Empty States
- Never show a blank area — always render an empty state with:
  - Centered illustration or icon (not generic)
  - Clear headline: "No projects yet"
  - Helpful subtext: "Create your first project to get started"
  - Primary CTA button

#### Loading States
- Use skeleton screens — never spinners for content areas
- Skeleton matches the exact shape of the content it replaces
- Use shimmer animation (see animation section)
- Show spinners only for: button actions, inline operations

---

### 📱 Responsive & Adaptive Design

**Web — Mobile-first breakpoints:**
```css
/* Base styles = mobile (375px+) */
@media (min-width: 640px)  { /* sm  — large mobile  */ }
@media (min-width: 768px)  { /* md  — tablet        */ }
@media (min-width: 1024px) { /* lg  — small desktop */ }
@media (min-width: 1280px) { /* xl  — desktop       */ }
@media (min-width: 1536px) { /* 2xl — wide desktop  */ }
```
- Use `clamp()` for fluid type and spacing between breakpoints
- No horizontal scroll at any viewport width
- Touch targets: minimum **44×44px** on mobile
- Test with real devices — not just browser resize

**Mobile Apps:**
- iOS: support iPhone SE (375pt) → Pro Max (430pt), handle safe areas with `SafeAreaView`
- Android: support 360dp → 600dp+, handle system bars and navigation
- Support both portrait and landscape orientations
- Handle keyboard appearance — adjust scroll/layout so inputs aren't covered

---

### ♿ Accessibility (a11y)
- All interactive elements are keyboard-navigable (Tab, Enter, Space, Escape, Arrow keys)
- Minimum contrast ratio: **4.5:1** normal text, **3:1** large text and UI components
- Use semantic HTML: `<button>`, `<nav>`, `<main>`, `<section>`, `<label>`, `<form>`
- All images have meaningful `alt` text (or `alt=""` for decorative images)
- Screen reader support: proper ARIA roles, labels, and live regions
- Focus ring is always visible — style it, don't hide it:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
  }
  ```
- Never rely on color alone to convey information
- Animations respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

### 🚫 Frontend Hard Rules

1. **Never use default browser styles** — reset and define everything explicitly
2. **Never use `!important`** — fix the specificity instead
3. **Never hardcode colors or spacing** — always use design tokens
4. **Never ship a page without defined empty, loading, and error states**
5. **Never use placeholder lorem ipsum in production** — use real or realistic content
6. **Never use generic stock UI** — every interface must have a distinct visual identity
7. **Never animate without a purpose** — if the animation doesn't communicate something, remove it
8. **Never ignore `prefers-reduced-motion`** — accessibility is not optional
9. **Never use a spinner for full page or section loads** — use skeleton screens
10. **Never ship 3D without a fallback** — always provide a static alternative for low-end devices

---

## 💻 2. Code Quality

> These rules apply to every language and every project type.

### Clean Code
- Every function/method does **one thing only**
  - If you need "and" to describe what it does → split it
- Naming conventions:
  - Functions/methods: action verbs → `getUserById`, `calculateTotal`, `sendEmail`, `parseToken`
  - Variables: descriptive nouns → `userList`, `isLoading`, `totalPrice`
  - Booleans: prefix with `is`, `has`, `can`, `should` → `isAuthenticated`, `hasPermission`
  - Constants: UPPER_SNAKE_CASE → `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`
- No abbreviations unless universally understood (`id`, `url`, `http`)
- No magic numbers — use named constants:
  ```
  # ❌ Bad
  if attempts > 3: block_user()

  # ✅ Good
  MAX_LOGIN_ATTEMPTS = 3
  if attempts > MAX_LOGIN_ATTEMPTS: block_user()
  ```
- Maximum function/method length: **20–30 lines** — extract if longer
- Maximum file length: **300–400 lines** — split into modules if longer
- Delete commented-out code — Git history preserves it
- No deep nesting — maximum **3 levels** deep; use early returns (guard clauses)

### SOLID Principles
- **S — Single Responsibility:** Each class/module has one reason to change
- **O — Open/Closed:** Open for extension, closed for modification — use interfaces, abstract classes, or higher-order functions
- **L — Liskov Substitution:** Subtypes must be fully substitutable for their base types
- **I — Interface Segregation:** No class should be forced to implement methods it doesn't use — split large interfaces
- **D — Dependency Inversion:** Depend on abstractions, not concrete implementations — inject dependencies

### DRY — Don't Repeat Yourself
- Extract repeated logic into shared functions, utilities, or modules
- If you write the same code twice, note it. On the third time, refactor it
- Shared/reusable code lives in:
  - Web/Node: `/utils`, `/helpers`, `/shared`, `/lib`
  - Mobile: `utils/`, `core/`, `common/`
  - Backend: `common/`, `shared/`, `infrastructure/`
- DRY applies to: logic, config values, validation rules, error messages, and styles

### KISS — Keep It Simple, Stupid
- The simplest solution that works is always preferred
- Do not over-engineer for hypothetical future requirements
- Avoid premature abstraction — abstract only when you have 3+ real use cases
- Complex code is a liability — if it needs a long explanation, rewrite it

### YAGNI — You Aren't Gonna Need It
- Never build features that are not required right now
- Do not add parameters, configs, or abstractions "just in case"
- Every line of code has a maintenance cost — write only what's needed

### Error Handling
- **Never swallow errors silently:**
  ```
  # ❌ Bad
  try:
      process()
  except:
      pass

  # ✅ Good
  try:
      process()
  except ValueError as e:
      logger.error("Processing failed: %s", e)
      raise
  ```
- Always handle: network failures, null/undefined values, invalid input, and timeout scenarios
- Show meaningful error messages to users — never expose raw stack traces
- Use structured error types — create custom error classes when needed
- Log errors with context: timestamp, user ID, action, and error details

### Testing
- Write tests **before or alongside** feature code (TDD encouraged)
- Every feature must have unit tests before merging
- Cover: happy path, edge cases, failure paths, and boundary values
- Minimum coverage target: **80%** — 100% for critical business logic
- Test naming: `should [expected result] when [condition]`
- Types of tests:
  - **Unit Tests** — test a single function/component in isolation (mock all dependencies)
  - **Integration Tests** — test modules working together (real DB connections allowed)
  - **E2E Tests** — simulate full user flows from UI to DB
  - **Snapshot Tests** — for UI components to detect unintended changes
- Common testing tools by platform:
  - JavaScript/TypeScript: Jest, Vitest, Cypress, Playwright
  - Python: pytest, unittest
  - Dart/Flutter: flutter_test, integration_test
  - Swift: XCTest
  - Kotlin/Android: JUnit, Espresso
  - Go: built-in `testing` package
  - PHP: PHPUnit
  - Ruby: RSpec
  - Java: JUnit, Mockito
  - C#: xUnit, NUnit

### Code Review
- No code merges to `main`/`master` without **at least one review**
- Reviewer must check: logic correctness, performance implications, security concerns, test coverage, and readability
- Use PR/MR templates that include: what changed, why it changed, and how to test it
- Keep PRs small and focused — one concern per PR (< 400 lines changed ideally)
- Resolve all comments before merging — no unresolved threads

### Design Patterns
Use patterns only when they solve a real, present problem — not speculatively:

| Pattern | Use When |
|---|---|
| **Repository** | Abstract data access from business logic |
| **Factory** | Object creation logic is complex or conditional |
| **Observer / Event Bus** | Decoupled communication between modules |
| **Strategy** | Swappable algorithms or behaviors |
| **Adapter** | Wrap incompatible interfaces |
| **Singleton** | Shared resource (DB connection, config) — use sparingly |
| **Builder** | Construct complex objects step by step |
| **Middleware / Chain of Responsibility** | Sequential processing of requests |
| **CQRS** | Separate read and write models at scale |

---

## ⚙️ 3. Architecture & Project Structure

### Folder Structure Principles
- Structure by **feature/domain**, not by type:
  ```
  # ❌ Bad — structured by type
  /controllers
  /models
  /views

  # ✅ Good — structured by feature
  /features
    /auth
      auth.controller
      auth.service
      auth.repository
      auth.test
    /users
    /payments
  ```
- Every module/feature is self-contained: its own logic, tests, and types
- Shared cross-cutting concerns go in `/shared`, `/common`, or `/core`

### Architecture Patterns — Choose Based on Scale

| Scale | Pattern | When to Use |
|---|---|---|
| Small / Solo | **Monolith** | Early-stage, single team, fast iteration |
| Medium | **Modular Monolith** | Clear domain boundaries, multiple teams on same codebase |
| Large | **Microservices** | Independent scaling, separate deployments, large org |
| Real-time heavy | **Event-Driven** | High-throughput async processing |
| Read-heavy | **CQRS + Read Replicas** | Separate optimized read and write paths |

- Document the chosen architecture in `/docs/architecture.md`
- Include a diagram showing system components and data flow
- Every service/module must have one clearly defined responsibility

### Git & Version Control
- **Branch strategy:**
  ```
  main          → production-ready code only
  develop       → integration branch (optional for larger teams)
  feature/*     → new features
  fix/*         → bug fixes
  hotfix/*      → urgent production fixes
  refactor/*    → code improvements without behavior change
  chore/*       → tooling, dependencies, config
  docs/*        → documentation only
  ```
- **Commit messages follow Conventional Commits:**
  ```
  feat(auth): add OAuth2 login with Google
  fix(cart): correct total price calculation on discount
  refactor(api): simplify error handling middleware
  test(user): add unit tests for registration flow
  chore(deps): upgrade all dependencies to latest
  docs(readme): add local development setup guide
  perf(search): add index on users.email column
  security(auth): rotate JWT secret and shorten expiry
  ```
- Commit types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `security`, `style`
- Never commit directly to `main` or `master` — always use PRs/MRs
- Tag all releases using Semantic Versioning: `v1.0.0`, `v1.2.3`, `v2.0.0`
  - `MAJOR` — breaking changes
  - `MINOR` — new backward-compatible features
  - `PATCH` — backward-compatible bug fixes

### CI/CD Pipeline
- Every push to any branch triggers: **lint → test → build**
- Merges to `main` additionally trigger: **staging deploy → smoke tests → production deploy**
- All pipeline checks must pass before merging
- Environment configs are separated:
  - `.env.development` — local dev
  - `.env.staging` — staging environment
  - `.env.production` — production (values set in CI/CD secrets, never in files)
- Secrets are **never** hardcoded or committed — use CI/CD secret stores

### Documentation
- Every project must have a `README.md` at the root covering:
  - Project purpose and overview
  - Tech stack and architecture summary
  - Local setup and installation steps
  - All required environment variables (with `.env.example`)
  - Available scripts/commands
  - Deployment process
  - Links to further docs
- Document all public APIs — inputs, outputs, errors, and example requests/responses
- Keep docs updated — outdated documentation is worse than no documentation
- Use inline comments for **why**, never for **what**:
  ```
  # ❌ Bad: increment counter
  counter += 1

  # ✅ Good: retry limit reached — fail fast before hitting the external API
  if counter >= MAX_RETRIES:
      raise RetryLimitExceeded()
  ```

### Security Best Practices
- **Authentication:**
  - Never store passwords in plain text — use bcrypt (cost ≥ 12) or Argon2id
  - Use short-lived access tokens (15–60 min) with refresh token rotation
  - Invalidate all sessions on password change
- **Input Validation:**
  - Validate and sanitize **all** user input on the server — never trust the client
  - Whitelist allowed values; reject everything else
  - Validate data type, length, format, and range
- **Injection Prevention:**
  - Never concatenate user input into SQL queries — always use parameterized queries or ORMs
  - Escape output when rendering user-supplied content in HTML
- **Authorization:**
  - Check permissions on every request — never rely on UI-only restrictions
  - Apply principle of least privilege — users and services get only what they need
- **Transport:**
  - HTTPS everywhere — no plain HTTP in staging or production
  - Set security headers: `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`
- **Dependencies:**
  - Run dependency audits regularly: `npm audit`, `pip-audit`, `bundle audit`, etc.
  - Keep all dependencies updated — especially security patches
- **Secrets:**
  - All secrets in environment variables or a vault (AWS Secrets Manager, HashiCorp Vault, Doppler)
  - Rotate secrets regularly and immediately after any exposure
  - Add `.env` to `.gitignore` — always

### Performance
- Lazy-load routes, screens, and heavy components — load only what's needed
- Paginate all list endpoints — never return unbounded arrays
- Avoid N+1 queries — use joins, eager loading, or DataLoader
- Add database indexes on all columns used in `WHERE`, `JOIN`, `ORDER BY`, and foreign keys
- Cache expensive or repeated operations (see caching strategy in Section 5)
- Compress and optimize all images — use WebP/AVIF for web, appropriate formats for mobile
- Measure before optimizing — use profilers, not intuition
- Performance targets:
  - Web: Lighthouse score > 80, LCP < 2.5s, FID < 100ms, CLS < 0.1
  - Mobile: app launch < 2s cold start, smooth 60fps scrolling
  - API: < 200ms for simple queries, < 1s for complex operations
  - Background jobs: define and monitor SLA per job type

---

## 🗄️ 4. Database Rules (All Types)

### Universal Rules — Apply to Every Database

- Every record must have a **unique identifier** (primary key or equivalent `_id`)
- Never store sensitive data (passwords, tokens, PII) without encryption
- Never delete important data permanently — use **soft deletes** (`deleted_at` timestamp or `is_deleted` flag)
- Every write-heavy table/collection must have an **audit trail** (who changed what and when)
- Use **migrations** for all schema changes — never modify a production schema manually
- All migrations must be: versioned, reversible (with a down migration), and committed to the repository
- Always **back up** before running migrations in production
- No business logic inside the database (stored procedures, triggers) unless absolutely necessary — keep logic in the application layer

---

### 🐘 PostgreSQL / MySQL / MariaDB (Relational / SQL)

**Schema Design:**
- Normalize to at least **3NF** — eliminate redundancy
- Use meaningful, lowercase, snake_case names for tables and columns: `user_profiles`, `order_items`
- Every table must have:
  - `id` — primary key (UUID or auto-increment bigint)
  - `created_at` — timestamp with timezone, default `NOW()`
  - `updated_at` — timestamp with timezone, updated automatically
- Use `NOT NULL` constraints wherever a value is always required
- Use `CHECK` constraints to enforce business rules at the DB level
- Use `FOREIGN KEY` constraints to enforce referential integrity

**Indexes:**
- Index every foreign key column
- Index columns used in `WHERE`, `ORDER BY`, `GROUP BY`, and `JOIN`
- Use composite indexes when multiple columns are always queried together
- Avoid over-indexing — each index slows down writes
- Use `EXPLAIN ANALYZE` to verify index usage and query performance

**Queries:**
- Always use parameterized queries — never string concatenation
- Use transactions for operations that must succeed or fail together
- Avoid `SELECT *` — always specify the columns you need
- Use `LIMIT` on all queries that could return large result sets
- Prefer `EXISTS` over `COUNT(*)` when checking for record existence

**PostgreSQL Specific:**
- Use `UUID` for primary keys in distributed systems
- Use `JSONB` (not `JSON`) for flexible structured data
- Use `ENUM` types for fixed value sets
- Use `pg_trgm` extension for fuzzy text search
- Use `LISTEN/NOTIFY` for lightweight real-time events
- Consider `Row Level Security (RLS)` for multi-tenant applications

---

### 🟢 Supabase

**Architecture:**
- Supabase = PostgreSQL + Auth + Storage + Realtime + Edge Functions
- All PostgreSQL rules above apply fully
- Use **Row Level Security (RLS)** on every table — it is not optional
- Always enable RLS before exposing a table via the API:
  ```sql
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);
  ```

**Authentication:**
- Use Supabase Auth for all authentication — don't build your own
- Use JWT claims and RLS together — validate `auth.uid()` in every policy
- For social auth: configure redirect URLs in both Supabase dashboard and provider
- Store user metadata in a `profiles` table linked to `auth.users` via foreign key

**Storage:**
- Use Storage Buckets for all file uploads — never store files as base64 in the database
- Apply bucket policies to restrict access: public vs. private buckets
- Use signed URLs for temporary access to private files
- Set file size limits and allowed MIME types per bucket

**Realtime:**
- Use Supabase Realtime only for data that genuinely needs live updates
- Filter subscriptions as tightly as possible — don't subscribe to entire tables
- Unsubscribe from channels when the component/screen unmounts

**Edge Functions:**
- Use for: webhooks, third-party API calls, sensitive logic that must not run on the client
- Keep Edge Functions small and single-purpose
- Store all secrets in Supabase Vault — never hardcode in function code

---

### 🍃 MongoDB / DocumentDB (NoSQL / Document)

**Schema Design:**
- Design schema based on **how data is queried**, not how it's related
- Embed documents when: data is always accessed together, child data doesn't exist independently, array size is bounded (< 100 items)
- Reference documents when: data is shared between many documents, child data grows unboundedly, data needs to be accessed independently
- Every document must have consistent required fields — use schema validation:
  ```js
  db.createCollection("users", {
    validator: {
      $jsonSchema: {
        required: ["email", "createdAt"],
        properties: {
          email: { bsonType: "string" },
          createdAt: { bsonType: "date" }
        }
      }
    }
  })
  ```

**Indexes:**
- Create indexes on all frequently queried fields
- Use compound indexes for queries on multiple fields
- Use **TTL indexes** for data that should auto-expire (sessions, OTPs, temporary tokens)
- Use **text indexes** for full-text search fields
- Analyze slow queries with `explain("executionStats")`

**Operations:**
- Use transactions (multi-document) for operations that must be atomic
- Always use projection in queries — return only needed fields
- Use aggregation pipelines instead of fetching and filtering in application code
- Use `bulkWrite` for batch operations — avoid looping single writes

---

### 🔥 Firebase / Firestore (Cloud NoSQL)

**Data Modeling:**
- Design around read patterns — Firestore charges per read/write
- Denormalize intentionally — duplicate data to avoid extra reads
- Keep documents small (< 1MB) — split large documents into sub-collections
- Use sub-collections for data that belongs to a parent but grows independently
- Avoid deeply nested sub-collections (max 3 levels)

**Security Rules:**
- Every collection must have explicit Security Rules — default deny everything:
  ```js
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if false; // deny all by default
      }
      match /users/{userId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
  ```
- Test all security rules using the Firebase Emulator before deploying
- Never use `allow read, write: if true` in production

**Performance:**
- Use pagination with `startAfter` cursors — never `offset`
- Use `onSnapshot` for real-time listeners; unsubscribe when no longer needed
- Batch reads and writes when operating on multiple documents
- Cache Firestore data locally — use offline persistence

---

### ⚡ Redis (In-Memory / Cache / Queue)

**Use Cases:**
- Caching expensive query results or computed values
- Session storage
- Rate limiting counters
- Job queues (with Bull, BullMQ, Sidekiq, etc.)
- Pub/Sub messaging
- Leaderboards and sorted sets
- Real-time counters and analytics

**Key Design:**
- Use descriptive, hierarchical key names: `user:1234:profile`, `session:abc123`, `cache:products:list`
- Always set a **TTL** on every key — never store data indefinitely without expiry
- Group related keys with a consistent prefix for easy scanning and deletion
- Document key naming conventions in `/docs/redis-keys.md`

**Operations:**
- Use `MGET`/`MSET` for batch operations — avoid multiple round trips
- Use Redis transactions (`MULTI/EXEC`) for atomic operations
- Monitor memory usage — set `maxmemory` and an eviction policy (`allkeys-lru` for cache, `noeviction` for queues)
- Never store sensitive data (passwords, tokens) in Redis without encryption
- Use Redis Cluster or Redis Sentinel for high availability in production

---

### 💎 SQLite (Embedded / Local)

**Use Cases:** Mobile apps (iOS/Android), desktop apps, CLI tools, local development, edge/serverless

**Rules:**
- Enable WAL (Write-Ahead Logging) mode for better concurrency: `PRAGMA journal_mode=WAL`
- Enable foreign key enforcement (off by default): `PRAGMA foreign_keys=ON`
- Use transactions for all multi-step write operations
- Keep the database file in a platform-appropriate location:
  - iOS: Application Support directory
  - Android: internal storage via Room/SQLDelight
  - Desktop: user data directory
- Use an ORM or query builder — avoid raw SQL strings in application code:
  - Android: Room
  - iOS/macOS: Core Data or GRDB
  - Flutter: Drift (formerly Moor) or sqflite
  - Desktop: SQLDelight, better-sqlite3

---

### 🌊 Other Databases — Universal Rules

| Database | Primary Use | Key Rule |
|---|---|---|
| **Elasticsearch** | Full-text search, logs | Design mappings before indexing; use aliases for zero-downtime reindex |
| **Cassandra / ScyllaDB** | Time-series, high write throughput | Model around queries, not entities; choose partition keys carefully |
| **DynamoDB** | Serverless, variable load | Single-table design; define access patterns before creating the table |
| **InfluxDB / TimescaleDB** | Time-series metrics | Use retention policies; downsample old data automatically |
| **Neo4j** | Graph data, relationships | Model relationships as first-class citizens; avoid deep traversals without limits |
| **PlanetScale** | Serverless MySQL | Use branching for schema changes; avoid foreign key constraints (use app-level) |
| **CockroachDB** | Distributed SQL | Follow PostgreSQL rules; avoid hotspot keys in range-sharded tables |
| **Prisma / Drizzle** | ORM (language-agnostic) | Always review generated SQL; use migrations, never `db push` in production |

---

## 🌐 5. API Design

### RESTful API
- Use resource nouns, not action verbs in URLs:
  ```
  ✅  GET    /users
  ✅  POST   /users
  ✅  GET    /users/:id
  ✅  PATCH  /users/:id
  ✅  DELETE /users/:id
  ✅  GET    /users/:id/orders

  ❌  GET    /getUsers
  ❌  POST   /createUser
  ❌  POST   /users/:id/doDelete
  ```
- Use correct HTTP methods: `GET` (read), `POST` (create), `PUT` (full replace), `PATCH` (partial update), `DELETE` (remove)
- Use correct HTTP status codes:
  ```
  200 OK                    → successful GET, PATCH, PUT
  201 Created               → successful POST
  204 No Content            → successful DELETE
  400 Bad Request           → invalid input
  401 Unauthorized          → not authenticated
  403 Forbidden             → authenticated but not permitted
  404 Not Found             → resource doesn't exist
  409 Conflict              → duplicate resource
  422 Unprocessable Entity  → validation errors
  429 Too Many Requests     → rate limit exceeded
  500 Internal Server Error → unexpected server error
  ```
- Version all APIs: `/api/v1/`, `/api/v2/`
- Use consistent response envelopes:
  ```json
  // Success
  {
    "success": true,
    "data": { ... },
    "message": "User created successfully"
  }

  // Error
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Email is required",
      "details": [{ "field": "email", "issue": "required" }]
    }
  }

  // Paginated list
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "total": 200,
      "page": 1,
      "perPage": 20,
      "totalPages": 10
    }
  }
  ```
- Implement rate limiting on all public endpoints
- Require authentication on all non-public endpoints

### GraphQL (When Used)
- Use a schema-first approach — define the schema before implementation
- Always paginate list queries using cursor-based pagination
- Use DataLoader to batch and cache database calls — prevent N+1 queries
- Never expose internal database IDs directly — use opaque cursor tokens
- Implement query complexity and depth limits to prevent abuse
- Use persisted queries in production for security and performance

### WebSocket / Realtime
- Authenticate the WebSocket connection on handshake — not after
- Implement heartbeat/ping-pong to detect stale connections
- Handle reconnection logic on the client with exponential backoff
- Clean up subscriptions and listeners when disconnecting

### Caching Strategy
| Layer | Tool | What to Cache | TTL |
|---|---|---|---|
| **CDN** | Cloudflare, CloudFront | Static assets, public API responses | Hours–days |
| **Application** | Redis, Memcached | Computed results, DB query results | Minutes–hours |
| **In-memory** | Local Map/Dict | Config values, lookup tables | Process lifetime |
| **HTTP** | Cache-Control headers | GET responses | Per endpoint |
| **Client** | React Query, SWR, Apollo | API responses | Per query config |

- Always define a TTL — never cache indefinitely
- Invalidate cache immediately when source data changes
- Use cache-aside pattern: check cache → on miss, fetch from DB → store in cache

---

## 📋 6. Project Management

### Agile / Scrum
- Work in sprints of **1–2 weeks**
- Sprint ceremonies:
  - **Planning:** define sprint goal and pick backlog items
  - **Daily standup:** what was done, what's next, any blockers (< 15 min)
  - **Review:** demo completed work to stakeholders
  - **Retrospective:** what went well, what to improve
- Backlog must be groomed and prioritized before each sprint starts

### User Stories
- Format: `As a [type of user], I want to [action], so that [benefit]`
- Every story must have **Acceptance Criteria** before development starts
- Stories must be completable within one sprint — split if larger
- Definition of Done:
  - Code written and reviewed
  - Tests written and passing
  - Documentation updated
  - Deployed to staging and verified

### MVP Strategy
- Launch the minimum that delivers real, measurable value
- Validate assumptions before building — use prototypes or mockups first
- Use feature flags to ship incomplete features safely
- Measure actual usage before building v2 of any feature

---

## 👥 7. Team & Collaboration

### Pull Request / Merge Request Rules
- Every PR must have: a clear title, description of what changed and why, screenshots (for UI changes), and test instructions
- Keep PRs small — one concern per PR, ideally < 400 lines changed
- No self-merging without at least one approval
- All CI checks must be green before merging
- Delete the branch after merging

### Pair Programming
- Use for: complex features, onboarding, critical bugs, and knowledge sharing
- Rotate pairs regularly — avoid knowledge silos
- Driver writes code; navigator reviews and thinks ahead
- Switch roles every 25–30 minutes

### Kanban / Task Tracking
- Every task must be tracked — no undocumented work
- Columns: `Backlog → To Do → In Progress → In Review → Done`
- Each task has: title, description, assignee, priority, and estimate
- WIP limit: **2–3 active tasks per person** maximum
- A task is "Done" only when: merged, tests passing, deployed, and verified

---

## ✅ Pre-Launch Checklist

Before shipping any feature or release:

**Code Quality**
- [ ] All tests pass (unit, integration, E2E)
- [ ] No linting errors or warnings
- [ ] No `console.log`, `print`, `debugger` statements left in code
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] No commented-out code blocks

**Security**
- [ ] All user inputs are validated and sanitized
- [ ] Authentication and authorization verified on all protected routes
- [ ] Security headers configured
- [ ] Dependency audit passed (`npm audit`, `pip-audit`, etc.)

**Database**
- [ ] All migrations are written, tested, and reversible
- [ ] New queries have appropriate indexes
- [ ] No N+1 query issues in new endpoints

**UI / UX**
- [ ] Responsive design tested: mobile, tablet, desktop
- [ ] All interactive states handled: empty, loading, error, success
- [ ] Accessibility audit passed (keyboard navigation, contrast, ARIA)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

**Performance**
- [ ] Lighthouse score > 80 (web)
- [ ] No unbounded queries or response payloads
- [ ] Images optimized and compressed

**Documentation**
- [ ] README is up to date
- [ ] New API endpoints are documented
- [ ] `.env.example` includes all new environment variables
- [ ] Changelog updated

---

## 🚫 Hard Rules — Never Break These

1. **Never push directly to `main`** — always use PRs/MRs with reviews
2. **Never commit secrets** — API keys, passwords, tokens, and certificates belong in `.env` or a vault
3. **Never skip tests** to meet a deadline — negotiate the deadline, not the quality
4. **Never ignore failing tests** — fix them before writing new code
5. **Never return raw database errors or stack traces** to the client
6. **Never trust client-side input** — always validate on the server
7. **Never store passwords in plain text** — always hash with bcrypt or Argon2
8. **Never hardcode environment-specific values** — use environment variables or config files
9. **Never modify a production database schema manually** — always use migrations
10. **Never deploy on Fridays** or before holidays unless it's a critical hotfix
11. **Never leave a TODO comment** without a linked issue in the tracker
12. **Never write code without tests** for critical business logic — no exceptions

---

*This file is language-agnostic and applies to all project types: Web, Mobile, API, CLI, and Desktop.*
*Keep this file versioned alongside your codebase and update it as your team's standards evolve.*
*Every team member and every AI assistant working on this project must read and follow this document.*