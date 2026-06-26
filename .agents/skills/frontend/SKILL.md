---
name: neuro-anchor-frontend
description: Frontend styling guide and components design system for Neuro-Anchor webview sidebars, emphasizing glassmorphism, responsive micro-interactions, and accessibility.
---

# 🎨 Neuro-Anchor Frontend Design System

distraction-free, accessible, and high-performance layout guidelines designed to prevent cognitive overload.

---

## 💎 The Glassmorphism Token System

Use this unified CSS token dictionary to keep layouts visually clean and lightweight.

```css
:root {
  /* Colors */
  --bg-gradient: radial-gradient(circle at top left, #120e2e 0%, #080614 100%);
  --color-primary: #8b5cf6;     /* Vibrant Violet */
  --color-secondary: #06b6d4;   /* Cyan */
  --color-success: #10b981;     /* Emerald Green */
  --color-warning: #f59e0b;     /* Amber */
  --color-danger: #ef4444;      /* Coral Red */

  /* Glassmorphism Fill */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-hover: rgba(255, 255, 255, 0.06);

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-base: 13px;
  --font-size-small: 11px;
}
```

---

## 💡 Rules of Thumb

### 👁 Rule 1: Visual Hierarchy & Spacing
* **Paddings**: Group components inside glass cards using `14px` padding and `14px` margins to avoid cramped components.
* **Headers**: Keep headers small, bold, and in uppercase (`letter-spacing: 0.8px`) to look professional and legible.

### 🍃 Rule 2: Cognitive Load Dampening
* **Color Usage**: Limit bright primary colors (`--color-primary`) to interactive action buttons and check status states. Keep descriptions in muted gray (`--text-muted`).
* **Animations**: All interactive hover transitions must use smooth eases (`transition: all 0.2s ease`) to prevent jarring visual changes.
* **Timer Progress**: The Interruption Shield timer uses an SVG circle with `stroke-dashoffset` transitions to give visual pacing feedback.

### ⌨️ Rule 3: Single-Click Actions
* **Open Files**: Filenames must be rendered as clickable chips that dispatch `openFile` commands instantly.
* **Run Commands**: Actionable terminal items must feature inline `▶ Run` buttons to let users trigger commands without typing.
