# UI Font Implementation Plan

## Objective

Replace Google Fonts (Geist Sans & Geist Mono) with self-hosted fonts that do not depend on external services like Google Fonts, ensuring faster page loads, better privacy compliance (GDPR), and offline-first rendering.

## Current State Analysis

### Files Involved
| File | Font Usage |
|------|-----------|
| `src/ui/src/app/layout.tsx` | Imports `Geist` and `Geist_Mono` from `next/font/google` (line 2) |
| `src/ui/src/app/globals.css` | CSS variables `--font-sans`, `--font-mono` (lines 10-12) |
| `src/ui/package.json` | No font packages currently installed |

### Current Font Pipeline

1. `layout.tsx` uses Next.js's `next/font/google` loader to import Geist at build time
2. Font variable names (`--font-geist-sans`, `--font-geist-mono`) are injected into the `<html>` className
3. CSS `@theme inline` block maps Tailwind's font utility variable names to:
   - `--font-sans` → `var(--font-sans)` (undefined — points to itself)
   - `--font-mono` → `var(--font-geist-mono)` (indirectly references Geist Mono)
4. HTML body applies `font-sans` class for base typography

**Note:** The current setup has a subtle issue — `--font-sans` references itself (`var(--font-sans)`) rather than the Geist variable, meaning Tailwind's `font-sans` class may not actually resolve to Geist Sans. This is a bug to be fixed during migration.

## Recommended Approach: Using `@fontsource` Packages

### Why @fontsource?

- **Zero-config self-hosting**: Fonts are bundled with the app at build time
- **Automatic font-display optimization**: Uses `font-display: swap` by default
- **CDN-free / offline-first**: No external network requests to font services
- **TypeScript support**: Proper type definitions for Next.js integration
- **Subset selection**: Can limit to used character subsets (e.g., `latin`, `latin-ext`)
- **Framework agnostic**: Works with Next.js, Vite, etc.

### Font Recommendation: Inter (Sans) + Fira Code/IBM Plex Mono (Mono)

| Property | Sans Font | Mono Font |
|----------|-----------|-----------|
| Family | **Inter** by Rasmus Andersson | **Fira Code** (or IBM Plex Mono) |
| Use Case | Body text, headings, UI elements | Code snippets, terminal output |
| License | Open Font License (OFL) — free for all uses | OFL — free for all uses |
| npm package | `@fontsource/inter` | `@fontsource/fira-mono` (or IBM Plex Mono) |
| Package size (latin subset, variable font WOFF2) | ~34 KB (compressed) | ~16 KB (compressed) |
| Weight range | 200–900 | 400, 500, 600, 700 (or variable) |

### Alternative Font Families to Consider

| Sans Option | Mono Option |
|-------------|-------------|
| Inter (default recommendation) | Fira Code |
| Source Sans 3 | IBM Plex Mono |
| DM Sans (variable font) | JetBrains Mono |

## Implementation Steps

### Step 1: Install Font Packages

```bash
cd src/ui && npm install @fontsource/inter @fontsource/fira-mono
```

### Step 2: Update `layout.tsx` — Replace next/font/google with @fontsource

**Before:**
```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({...}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
```

**After:**
```tsx
import "fontsource/inter";           // Inter variable font (all weights)
import "fontsource/fira-mono";      // Fira Mono (standard weight)

export default function RootLayout({...}) {
  return (
    <html lang="en" className="h-full antialiased" style={
      { fontFamily: "'Inter', system-ui, -apple-system, sans-serif", fontFeatureSettings: "cv11" }
    }>
```

**Migration Notes:**
- Remove `next/font/google` import entirely — can also remove from devDependencies via cleanup
- Replace CSS variable approach with inline `fontFamily` on `<html>` for simplicity (faster runtime, no CSS variable indirection)
- Add `font-feature-settings: "cv11"` for Inter's contextual alternates (improves typography quality)
- Include system font stack as additional fallback: `system-ui, -apple-system, "Segoe UI", Roboto`
- Consider adding a `<link>` preload tag in metadata for critical font files

### Step 3: Update `globals.css` — Fix CSS Variable References

**Changes required:**
1. Remove or reassign `--font-sans` to a proper stack string instead of self-reference:
   ```css
   --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
   ```
2. Update `--font-mono` to reference Fira Mono:
   ```css
   --font-mono: 'Fira Mono', ui-monospace, monospace;
   ```

Alternatively, if switching to inline styles in layout.tsx (recommended), these CSS variables can be removed from the `@theme inline` block to simplify.

### Step 4: Update `/lib/store/` and Other Components (if needed)

Scan any components that manually reference `font-sans`, `font-mono`, or font variables. Verify no hardcoded `font-family` overrides exist elsewhere.

### Step 5: Clean Up Dependencies

- **No removal needed**: `next/font/google` is part of Next.js itself (not a separate package)
- Run `npm audit fix` after installation
- Verify no leftover Geist imports in any file

### Step 6: Build Verification

Run the build and verify:
```bash
cd src/ui && npm run build
npm start
```

Check in browser DevTools:
1. Network tab — no requests to `fonts.googleapis.com` or `fonts.gstatic.com`
2. Styles panel on body element — verify correct font applied
3. Performance tab — confirm no layout shift (FOIT → FOUT mitigated by font-display: swap)

### Step 7: Testing (Optional Enhancement)

Add a visual regression test or manual QA checklist:
- Verify UI renders correctly on light and dark modes
- Confirm code blocks use monospace font consistently
- Check that no text renders with unexpected fonts

## Deployment Considerations

| Concern | Detail |
|---------|--------|
| Docker build | Fonts are npm dependencies — included in `node_modules`, no extra steps needed |
| CI/CD pipeline | No changes to `.gitlab-ci.yml` expected |
| Bundle size impact | ~50 KB additional for both font subsets (vs. similar current size with Geist) |
| Caching | Font files cached by browser with long-lived caching headers (handled at build time) |
| Vercel hosting | No Google Fonts CDN to worry about — everything served from app's own CDN/static host |

## Risk Assessment and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Font loading slower than cached Google Fonts | Low (fonts are already cached by browser on first load) | Use `<link rel="preload">` for critical font weights in `layout.tsx` metadata |
| Missing characters (CJK, emoji) | Low | Add system font fallbacks; consider bundle size impact of additional subsets |
| Inter font slightly different visual weight than Geist | Medium (design review needed) | Review in staging; adjust if needed before deploying to production |
| Next.js font optimizations lost (auto-subsetting) | Low | @fontsource supports subset selection; trade-off is acceptable for self-hosting |

## Rollback Plan

If issues arise, rollback changes in reverse order:
1. Revert `layout.tsx` to use `next/font/google` imports (one command revert)
2. Revert CSS variable changes in `globals.css`
3. Uninstall @fontsource packages: `npm uninstall @fontsource/inter @fontsource/fira-mono`

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Installation + layout.tsx changes | 15–20 min |
| CSS updates + cleanup | 10–15 min |
| Build verification + visual QA | 20–30 min |
| Code review + CI pass | 15–30 min |
| **Total** | **~1 to 2 hours** |

## Acceptance Criteria

- [ ] No requests to `fonts.googleapis.com` or `fonts.gstatic.com` in network tab (verified after build)
- [ ] Inter font loads correctly as primary sans-serif across all pages and components
- [ ] Fira Mono renders correctly in mono-text contexts (code blocks, terminal outputs)
- [ ] Font loads without layout shift or flash of invisible text (FOIT/FOUT)
- [ ] Light and dark mode rendering verified — fonts render legibly on both backgrounds
- [ ] Build succeeds without warnings or errors related to font loading
- [ ] Docker build succeeds and container runs correctly with new fonts

## References

- [@fontsource documentation](https://fontsource.org/)
- [Inter font family (GitHub)](https://github.com/rsms/inter)
- [Fira Mono font family (Mozilla)](https://github.com/mozilla/Fira)
- [CSS `font-display` behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)