# QR Code Logo & Color Customisation — Design Spec

## Goal

Enhance the QR code panel with: (a) a real PVM logo asset as the optional default overlay, (b) custom logo upload, and (c) freeform fg/bg color selection with preset shortcuts.

---

## Generator (`src/lib/qr-generator.ts`)

### Interface changes

```typescript
export interface QrOptions {
  url: string;
  fg?: string;       // hex color, e.g. "#1a2b4a" — default "#1a2b4a"
  bg?: string;       // hex color, e.g. "#ffffff" — default "#ffffff"
  dots?: QrDots;     // default "square"
  logoData?: string; // base64 data URL — undefined = no logo
  size?: number;     // PNG only, default 1000
}
```

`scheme: QrScheme` is **removed**. All color logic uses `fg`/`bg` directly.

### Logo overlay

When `logoData` is provided, the center overlay renders as:

```svg
<!-- White square background -->
<rect x="{lx}" y="{ly}" width="{logoSize}" height="{logoSize}" rx="{rx}" fill="{bg}"/>
<!-- Logo image, letterboxed (xMidYMid meet preserves aspect ratio) -->
<image
  href="{logoData}"
  x="{lx + padding}"
  y="{ly + padding}"
  width="{logoSize - padding*2}"
  height="{logoSize - padding*2}"
  preserveAspectRatio="xMidYMid meet"
/>
```

`padding` is 15% of `logoSize`. This letterboxes the landscape PVM asset (905×291) naturally — white space fills top and bottom within the square. The square remains 22% of total QR size.

When `logoData` is `undefined`, no overlay is rendered (fully optional).

---

## Route Handler (`src/app/api/qr/[code]/route.ts`)

### GET — updated params

| Param | Values | Default | Notes |
|-------|--------|---------|-------|
| `fg` | `#rrggbb` hex | `#1a2b4a` | Validated via `/^#[0-9a-fA-F]{6}$/` — falls back to default if invalid |
| `bg` | `#rrggbb` hex | `#ffffff` | Same validation |
| `logo` | `none` \| `default` | `none` | `default` → read `assets/PVM.png` from filesystem |
| `dots` | `square` \| `rounded` \| `circle` | `square` | Unchanged |
| `format` | `svg` \| `png` | `svg` | Unchanged |
| `size` | `500` \| `1000` \| `2000` | `1000` | PNG only, unchanged |

`scheme` param is **removed**.

When `logo=default`:
```typescript
const logoPath = path.join(process.cwd(), "assets", "PVM.png");
const logoBuffer = await fs.readFile(logoPath);
const logoData = `data:image/png;base64,${logoBuffer.toString("base64")}`;
```

### POST — new handler for custom logo

Accepts `multipart/form-data`. Fields:

| Field | Type | Notes |
|-------|------|-------|
| `logo` | File (PNG / JPG / SVG) | Required |
| `fg` | string | Same validation as GET |
| `bg` | string | Same validation as GET |
| `dots` | string | Same as GET |
| `format` | string | Same as GET |
| `size` | string | Same as GET |

Processing:
```typescript
const formData = await req.formData();
const file = formData.get("logo") as File;
const arrayBuffer = await file.arrayBuffer();
const base64 = Buffer.from(arrayBuffer).toString("base64");
const logoData = `data:${file.type};base64,${base64}`;
```

Returns identical response shape to GET (SVG or PNG, same headers). No file is stored — everything is in-memory per request.

---

## QrPanel (`src/components/admin/QrPanel.tsx`)

### Color controls

Replaces the `scheme` radio group.

**Presets row** — four named swatches:

| Name | fg | bg |
|------|----|----|
| Brand | `#1a2b4a` | `#ffffff` |
| Light | `#000000` | `#ffffff` |
| Dark | `#ffffff` | `#1a2b4a` |
| Inverted | `#ffffff` | `#000000` |

Clicking a swatch sets both `fg` and `bg` state and marks that swatch active. Initial state: Brand preset active.

**Custom pickers** — below the swatches:
- `<input type="color">` for fg ("Foreground")
- `<input type="color">` for bg ("Background")

Editing either picker deselects any active swatch (no swatch is highlighted).

### Logo controls

Replaces the checkbox. Three-way control:

| Option | Behaviour |
|--------|-----------|
| **None** | No logo — `logo` param omitted from GET URL |
| **PVM Logo** | Default asset — `logo=default` in GET URL |
| **Upload** | Reveals file input; switches panel to POST mode on file selection |

File input accepts: `image/png, image/jpeg, image/svg+xml`.

### Preview & download behaviour

**None / PVM Logo mode:**
- `<img src={builtGetUrl}>` — same pattern as current implementation
- Download: `<a href={builtGetUrl} download="qr-{code}.{format}">` anchor

**Upload mode (file selected):**
- `useEffect` watches `[file, fg, bg, dots, format, size]`
- POSTs FormData to `/api/qr/{code}`, stores result blob URL in state
- `<img src={blobUrl}>` for preview; opacity 50% while POST in flight
- Download: JS-triggered — fetch POST result, create object URL, trigger `<a download>` click, revoke URL

**Upload mode (no file yet):**
- Preview area shows "Select a file to preview" placeholder
- Download button disabled

### State shape

```typescript
type LogoMode = "none" | "default" | "upload";

const [fg, setFg] = useState("#1a2b4a");
const [bg, setBg] = useState("#ffffff");
const [activePreset, setActivePreset] = useState<string | null>("brand");
const [logoMode, setLogoMode] = useState<LogoMode>("none");
const [logoFile, setLogoFile] = useState<File | null>(null);
const [blobUrl, setBlobUrl] = useState<string | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
```

---

## Future Work (not in scope)

- **Auto-generated QR on redirect creation**: plain black/white, square dots, no logo. Stored on the redirect record. Displayed in the edit-page sidebar (currently "Coming soon").
- **Saved customisation**: persist `fg`, `bg`, `dots`, `logoMode` on the `Redirect` model. The sidebar shows the saved custom QR when present. Custom logo images stored in object storage (URL reference on the model).
- **Schema migration**: add `qrFg`, `qrBg`, `qrDots`, `qrLogoMode`, `qrLogoUrl` to the `Redirect` Prisma model.

---

## What Does Not Change

- Dot style options (square / rounded / circle)
- Format and size options
- Cache-Control and Content-Disposition headers
- QR error correction level (H — required for logo overlay)
- Placement of QrPanel on the redirect detail page
