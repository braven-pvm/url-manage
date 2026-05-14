# PVM URL Admin — Brand Spec

Extracted from pvm.co.za screenshots (mp3xe7pz, mp3xf04g) on 2026-05-13.

## Color tokens

```css
:root {
  --bg:      #EEF1F5;   /* page background */
  --surface: #FFFFFF;   /* cards, nav */
  --fg:      #0D1F35;   /* primary text, dark navy */
  --muted:   #6B7280;   /* secondary text, labels */
  --border:  #E5E7EB;   /* card and input borders */
  --accent:  #F5C400;   /* yellow — top stripe ONLY, max 1 use */
  --teal:    #0284C7;   /* URL links, destination text */
  --green:   #16A34A;   /* Matched / Active status */
  --amber:   #D97706;   /* Campaign purpose */
  --purple:  #7C3AED;   /* Event purpose */
  --red:     #DC2626;   /* Expired / danger */
}
```

## Typography

- Display/headings: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`, weight 700
- Body: same stack, weight 400–500
- Mono (URLs, codes): `'JetBrains Mono', 'Fira Code', ui-monospace, monospace`, 12–13px
- Table headers: 11px, uppercase, letter-spacing 0.06em, weight 600, --muted color

## Layout posture

1. Yellow accent appears ONLY as a 3px horizontal stripe at the very top of every page
2. Primary CTA buttons use `--fg` (dark navy) fill, white text — NOT yellow
3. White cards on grey background; 1px `--border` border; 8–12px radius
4. Monospace font for all short URLs, destination URLs, and codes
5. Table column headers in UPPERCASE with wide letter-spacing (AI-slop rule: don't ignore this)
6. Category/purpose pills are colored badges; tag chips are plain grey
7. "Edit" actions are inline text links, not full buttons, in list rows
