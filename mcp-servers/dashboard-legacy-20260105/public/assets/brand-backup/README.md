# 🔶 Pyrite Brand Assets - SACRED BACKUP

**DO NOT DELETE THIS FOLDER**

This folder contains the core brand assets for _pyrite Mission Control.

## Files

| File | Size | Purpose |
|------|------|---------|
| `pyrite-logo-512.svg` | 512×512 | Standard logo |
| `pyrite-logo-1024.svg` | 1024×1024 | High-res logo |
| `favicon.svg` | 32×32 | Browser favicon |
| `BACKUP_diamond_animations.css` | - | Animation keyframes |

## Brand Colors

```css
--accent: #ff9d3d;           /* Main amber/orange */
--accent-bright: #ffb86c;    /* Lighter amber */
--accent-dim: rgba(255, 157, 61, 0.15);
--accent-glow: rgba(255, 157, 61, 0.4);
--bg-deep: #0a0806;          /* Dark background */
--border: #3d352d;           /* Border color */
```

## The Diamond Symbol

The ◈ (U+25C8) character represents _pyrite:
- "Fool's gold" — shiny, promising, experimental
- Not everything will pan out, and that's okay

## Animations

### gemRotate (8s loop)
- Subtle rotation: -5° to +5°
- Scale pulse: 1.0 to 1.1
- Glow intensity varies

### glowPulse (3s loop)
- Radial glow behind diamond
- Opacity: 0.3 to 0.6
- Scale: 1.0 to 1.2

## Usage

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">

<!-- Brand in HTML -->
<span class="brand-gem">◈</span>

<!-- Logo image -->
<img src="assets/pyrite-logo-512.svg" alt="_pyrite logo">
```

---

*Backed up: 2024-12-28*
*Never delete these files*

