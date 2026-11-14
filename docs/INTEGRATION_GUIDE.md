# DataNarrator — How the Frontend Is Linked to the Backend

> A learning guide for junior developers. It explains **what** was connected,
> **how** it works, and **why** it was done this way. Read it top to bottom the
> first time; later you can jump to a section.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Project layout](#2-project-layout)
3. [Running everything locally](#3-running-everything-locally)
4. [Step 1 — Making the browser reach Flask (the proxy)](#4-step-1--making-the-browser-reach-flask-the-proxy)
5. [Step 2 — One place for all API calls (`lib/api.ts`)](#5-step-2--one-place-for-all-api-calls-libapits)
6. [Step 3 — Authentication with JWT](#6-step-3--authentication-with-jwt)
7. [Step 4 — Translating data with mappers (`lib/backend-mappers.ts`)](#7-step-4--translating-data-with-mappers-libbackend-mappersts)
8. [Step 5 — The upload & data-quality flow](#8-step-5--the-upload--data-quality-flow)
9. [Step 6 — Columns and analysis type](#9-step-6--columns-and-analysis-type)
10. [Step 7 — How visualization is linked (the dashboard)](#10-step-7--how-visualization-is-linked-the-dashboard)
11. [Step 8 — Exporting PDF / PNG](#11-step-8--exporting-pdf--png)
12. [Step 9 — Settings and Admin](#12-step-9--settings-and-admin)
13. [Endpoint ↔ screen reference table](#13-endpoint--screen-reference-table)
14. [How it was tested (without a Gemini key)](#14-how-it-was-tested-without-a-gemini-key)
15. [Debugging tips](#15-debugging-tips)
16. [Glossary](#16-glossary)
17. [Exercises to learn the codebase](#17-exercises-to-learn-the-codebase)

---

## 1. The big picture

DataNarrator has two separate programs:

| Part | Tech | Port | Job |
| --- | --- | --- | --- |
| **Frontend** | Next.js 16 + React 19 + Tailwind | 3000 | Screens the user clicks on |
| **Backend** | Flask (Python) + SQLAlchemy + pandas + Gemini | 5000 | Stores users/datasets, reads files, runs analysis, asks the AI, draws PNG/PDF |
| **Database** | PostgreSQL (Supabase) | 5432 | Users, datasets, analysis sessions |

Before the integration, the frontend was a **clickable prototype**: every screen
used hard-coded "demo" data (`🟢 START DEMO / SIMULATION CODE` comments) and
`localStorage`. The backend already had real endpoints but nothing called them.

**The goal was: replace the fake data with real backend calls while changing the
existing screens as little as possible.**

```
 ┌────────────── Browser ──────────────┐
 │  React screens (components/*.tsx)   │
 │            │                        │
 │            ▼                        │
 │  lib/backend-mappers.ts  (translate)│
 │            │                        │
 │            ▼                        │
 │  lib/api.ts  fetch("/api/...")      │
 └────────────┬────────────────────────┘
              │  same origin: http://localhost:3000/api/...
              ▼
 ┌──────── Next.js server ─────────────┐
 │  next.config.mjs  rewrites()        │  "/api/:path*" → "http://127.0.0.1:5000/:path*"
 └────────────┬────────────────────────┘
              ▼
 ┌──────── Flask backend ──────────────┐
 │  routes/*.py  →  services/*.py      │──► PostgreSQL
 │                                     │──► Gemini (AI)
 │                                     │──► uploads/ (files on disk)
 └─────────────────────────────────────┘
```

The strategy in one sentence: **add a thin layer (proxy + API client + mappers)
between the existing UI and the backend, so the UI components keep receiving
data in the same shape they always did.**

---

## 2. Project layout

```
DataNarrator-Merged/
├── .env.example              ← copy to .env (backend secrets)
├── backend/
│   ├── app.py                ← Flask app, registers blueprints
│   ├── requirements.txt      ← Python dependencies (added during integration)
│   ├── routes/               ← HTTP endpoints (what URL does what)
│   │   ├── auth_routes.py        /login /register /profile
│   │   ├── dataset_routes.py     /dataset/...
│   │   ├── analysis_routes.py    /analysis/...
│   │   ├── settings_routes.py    /settings/...
│   │   └── admin_routes.py       /admin/users...
│   ├── services/             ← business logic (pandas, AI, charts, PDF)
│   └── models/               ← database tables (User, Dataset, AnalysisSession)
├── frontend/
│   ├── next.config.mjs       ← ★ proxy to the backend
│   ├── app/                  ← pages (routes): /, /upload, /settings, /admin...
│   ├── components/           ← UI pieces (upload-workspace, story-dashboard...)
│   └── lib/
│       ├── api.ts            ← ★ NEW: every backend call lives here
│       ├── backend-mappers.ts← ★ NEW: backend JSON → frontend models
│       ├── auth.ts           ← login state (now uses the backend)
│       └── dataset-models.ts ← TypeScript types + demo datasets
└── docs/
    ├── INTEGRATION_GUIDE.md        ← this file
    └── ISSUES_AND_ENHANCEMENTS.md  ← backlog of things to fix later
```

★ = the files you should read first.

---

## 3. Running everything locally

**Backend**

```bash
# project root: create .env
JWT_SECRET_KEY=change-me
DATABASE_URL=postgresql://user:password@host:5432/database
GEMINI_API_KEY=your-gemini-key

cd backend
pip install -r requirements.txt
python app.py              # → http://127.0.0.1:5000
python create_admin.py     # optional: create an admin account
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                # → http://localhost:3000
# backend on another host?  BACKEND_URL=http://host:5000 npm run dev
```

Open `http://localhost:3000`, sign up, upload a CSV, and follow the 4 steps.

---

## 4. Step 1 — Making the browser reach Flask (the proxy)

### The problem: CORS

The frontend runs on `localhost:3000`, the backend on `localhost:5000`.
Browsers treat a different **port** as a different **origin**. By default a
page from origin A is not allowed to read responses from origin B unless B
sends special `Access-Control-Allow-*` headers (this rule is called **CORS**).
Flask did not send those headers.

### Two possible fixes

1. Install `flask-cors` in the backend → **changes backend code**.
2. Make the browser think everything is on port 3000 → **no backend change**. ✅

We chose option 2 using Next.js **rewrites**
(`frontend/next.config.mjs`):

```js
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000"

async rewrites() {
  return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }]
}
```

Now when React calls `fetch("/api/login")`:

1. The browser sends it to `localhost:3000/api/login` (same origin → no CORS).
2. The Next.js server sees the rule and forwards it to `127.0.0.1:5000/login`.
3. Flask answers; Next.js passes the answer back to the browser.

Notice the `/api` prefix is **removed** — Flask routes are `/login`, not `/api/login`.

We also set `experimental.proxyTimeout: 180000` (3 minutes) because the AI
analysis can take longer than the default proxy timeout.

> 💡 **Lesson:** a reverse proxy is a common, clean way to connect a frontend
> and an API in development *and* production (Nginx does the same job).

---

## 5. Step 2 — One place for all API calls (`lib/api.ts`)

Instead of writing `fetch(...)` inside every component, all calls go through
`frontend/lib/api.ts`. Benefits: one place to add the auth header, one place to
handle errors, and components stay readable.

### The core function: `apiRequest`

```ts
export async function apiRequest<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, raw = false } = options
  const headers: Record<string, string> = {}

  if (auth) {                                     // 1. attach the JWT
    const token = getToken()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }

  let payload
  if (body instanceof FormData) payload = body    // 2. files: let the browser set multipart headers
  else if (body !== undefined) {                  //    objects: send JSON
    headers["Content-Type"] = "application/json"
    payload = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: payload })
  ...
  if (!response.ok) {                             // 3. turn backend errors into exceptions
    const message = data?.error || data?.message || data?.msg || `Request failed (${response.status})`
    throw new ApiError(message, response.status, data)
  }
  return data
}
```

Things to notice:

- **`FormData` vs JSON.** File uploads must be `multipart/form-data`. When you
  pass a `FormData`, you must **not** set `Content-Type` yourself — the browser
  adds it with the correct "boundary".
- **Error messages.** The Flask code returns errors as either `{"error": ...}`
  or `{"message": ...}` (and flask-jwt-extended uses `{"msg": ...}`). The client
  checks all three so the UI can show the backend's real message, e.g.
  *"Incorrect password"*.
- **`ApiError`** keeps the HTTP `status` and full `data`, so callers can react
  to specific cases (the dashboard reads `err.data.supported_analysis_types`).

### Grouped helpers

On top of `apiRequest` there are small, named groups:

```ts
authApi.login(login, password)            // POST /login
datasetApi.upload(file)                   // POST /dataset/upload
analysisApi.execute(id, columns, type)    // POST /analysis/execute
settingsApi.changePassword(...)           // PATCH /settings/password
adminApi.listUsers()                      // GET /admin/users
```

Components call these, so reading a component tells you exactly which endpoint
it uses.

### Downloading files: `apiDownload`

PDF/PNG exports return binary data, not JSON. `apiDownload` reads the response
as a `Blob`, creates a temporary URL (`URL.createObjectURL`) and clicks an
invisible `<a download>` link to save it.

---

## 6. Step 3 — Authentication with JWT

### What is a JWT?

A **JSON Web Token** is a signed string the backend gives you after login. You
send it back on every request in the header `Authorization: Bearer <token>`.
The backend verifies the signature and knows who you are — no server-side
session needed. In Flask this is `@jwt_required()` + `get_jwt_identity()`.

### The login flow (`lib/auth.ts` → `loginWithBackend`)

```
User submits form (components/auth-view.tsx)
   │
   ▼
loginWithBackend(identifier, password)
   ├─ POST /login {login, password}         → {access_token, user_id, role}
   ├─ setToken(access_token)                 (saved in sessionStorage)
   ├─ GET /settings/profile                  → {username, email, display_name}
   ├─ saveStoredUserProfile(profile)         (the old demo storage, reused!)
   └─ setLoggedIn(true)
   │
   ▼
onSuccess(role) → router.push(role === "admin" ? "/admin" : "/upload")
```

**Why reuse `saveStoredUserProfile`?** The rest of the app (sidebar, avatar,
`useAuth()` hook) already read the profile from there. By filling it with real
backend data we didn't have to touch those components. This is the
"minimal change" idea in action.

**Sign-up** (`registerWithBackend`) = `POST /register` → `loginWithBackend` →
optional `PATCH /settings/profile` to save the display name (the register
endpoint doesn't accept a display name).

**"Am I logged in?"** `getIsLoggedIn()` now requires both the old flag **and** a
token. That way an old demo session without a token doesn't look logged in.

**Logout** calls `POST /settings/logout` (the backend just says "OK" — JWTs are
stateless) and then deletes the token locally.

> 💡 **Lesson:** with JWTs, "logging out" really means *the client forgets the
> token*. The token stays valid until it expires (see the issues document).

---

## 7. Step 4 — Translating data with mappers (`lib/backend-mappers.ts`)

This is the most important idea of the integration.

The UI components were built around TypeScript types in
`lib/dataset-models.ts`, e.g.:

```ts
interface DatasetMeta { id; name; rowCount; colCount; columns: ColumnDefinition[]; recommendedAnalysisId; ... }
interface StoryBoardConfig { metrics; insights; trendData?; barData?; donutData?; boxPlotData?; scatterData?; histogramBars? }
```

The backend returns **different** shapes, for example:

```json
{ "column_names": ["Order_Date", "Region", "Revenue"],
  "column_categories": { "datetime": ["Order_Date (column 1)"], "numerical": ["Revenue (column 3)"], ... },
  "missing_values_by_column": { "Revenue (column 3)": 8 } }
```

Rather than rewriting the components to understand backend JSON, we wrote
**mapper functions** that convert backend JSON → the existing frontend types.
This pattern is often called an **adapter** or **anti-corruption layer**.

| Mapper | Input (backend) | Output (frontend) |
| --- | --- | --- |
| `buildDatasetMetaFromBackend` | `/dataset/test-upload` result | `DatasetMeta` |
| `applyAiColumnRecommendation` | `/dataset/:id/ai-recommend-columns` | updates `isAiPick` on columns |
| `buildValidationReportFromBackend` | test-upload + `/preview` | `ValidationReport` (quality modal) |
| `mapCleaningToStrategies` | user's cleaning choices | `{ "Revenue (column 3)": "mean" }` for `/clean-missing` |
| `backendTypeToFrontendId` | `"comparative"` | `"comparison"` |
| `applyAnalysisResultToStory` | `/analysis/execute` | `StoryBoardConfig` |
| `mergeVisualization` | one chart's `visualization` object | fills `trendData` / `barData` / ... |

### A detail worth learning: column keys

The backend names columns like `"Revenue (column 3)"`. It adds the position so
that two columns with the same name can be told apart. The UI wants plain
`"Revenue"`, so `cleanColumnKey()` strips the suffix:

```ts
export function cleanColumnKey(key: string) {
  return String(key).replace(/\s*\(column \d+\)$/, "")
}
```

But **some endpoints need the original key back** — `/clean-missing` rejects
`"Revenue"` and only accepts `"Revenue (column 3)"`. That's why each missing
value item keeps a hidden `backendKey`. This bug was found during testing (the
endpoint returned 400 `Invalid column: Revenue`) — a good reminder to always
test against the real backend.

---

## 8. Step 5 — The upload & data-quality flow

File: `components/upload-workspace.tsx` → `handleFileSelect`.

```
User drops file.csv
   │
   ├─ (in parallel)
   │    POST /dataset/test-upload   → quality report, column types (no saving)
   │    POST /dataset/upload        → saves file for this user → dataset_id
   │
   ├─ GET /dataset/{id}/preview     → rows + duplicate rows
   │
   ├─ buildDatasetMetaFromBackend()   → activeDataset (with backendId = dataset_id)
   ├─ buildValidationReportFromBackend() → validationReport
   │      → open the existing DataValidationModal (unchanged component)
   │
   └─ (background, doesn't block) GET /dataset/{id}/ai-recommend-columns
          → applyAiColumnRecommendation() → marks "Recommended" columns
```

Why two upload calls? The backend splits the job: `test-upload` *analyses* a
file without saving, `upload` *saves* it but returns no analysis. Calling both
with `Promise.all` gives us both results at the same time without changing the
backend. (It sends the file twice — noted in the issues document.)

`backendId` is the key that links everything after this step. **If a dataset
has a `backendId`, it's a real upload and later steps call the backend. If not
(the built-in sample datasets), the old demo behaviour runs.** That's how real
and demo modes live side by side.

The fake progress bar now just animates until the requests finish.

### Cleaning

`handleApplyCleaningAndRecheck` maps the chosen fill options to the strategies
the backend understands (`mean`, `mode`, `leave_missing`) and calls
`POST /dataset/{id}/clean-missing`. The backend writes a **new cleaned file**
and points the dataset at it, so all later analysis uses the cleaned data.

---

## 9. Step 6 — Columns and analysis type

When the user clicks *Continue* on the column step (`onNext` in
`upload-workspace.tsx`):

1. `POST /dataset/{id}/select-columns` — the backend checks the columns exist.
2. `POST /analysis/recommend` — returns e.g. `["descriptive", "comparative"]`.
3. The first suitable type is converted to a frontend id and stored in
   `activeDataset.recommendedAnalysisId`, so the existing `AnalysisType`
   component highlights it as "AI Pick".

### Two vocabularies for analysis types

| Frontend id (UI card) | Backend type |
| --- | --- |
| `trend` | `comparative` *(only type where the backend allows line/area charts)* |
| `comparison` | `comparative` |
| `desc_freq` | `descriptive` |
| `desc_numeric` | `distribution` |
| `correlation` | `relationship` |

This table is `ANALYSIS_TYPE_MAP` in `lib/api.ts`. If the backend says the
chosen type isn't valid for these columns, it answers 400 with
`supported_analysis_types`, and the dashboard automatically retries with the
first supported one.

---

## 10. Step 7 — How visualization is linked (the dashboard)

File: `components/story-dashboard.tsx` (component `StoryDashboard`).

### 10.1 What the backend gives us

`POST /analysis/execute` does a lot in one call:

1. Runs the statistical analysis (pandas) → `result`.
2. Asks Gemini which charts fit → up to 3 "charts", each with a list of
   `visualization_options` (e.g. `["vertical_bar_chart","horizontal_bar_chart","lollipop_chart"]`).
3. For each chart, picks the first option that passes validation and computes
   its data → `selected_visualization` + `visualization`.
4. Asks Gemini to explain the result in plain text → `ai_explanation`.
5. Saves everything in an `AnalysisSession` row → `analysis_session_id`.

Example (trimmed):

```json
{
  "analysis_session_id": 12,
  "analysis_type": "comparative",
  "selected_columns": ["Region", "Revenue"],
  "charts": [
    { "chart_id": 2,
      "reason": "Bars compare average values per group.",
      "visualization_options": ["vertical_bar_chart", "horizontal_bar_chart", "lollipop_chart"],
      "selected_visualization": "vertical_bar_chart",
      "visualization": {
        "visualization_type": "vertical_bar_chart",
        "category_column": "Region", "value_column": "Revenue",
        "data": [ {"category": "West", "value": 883.7}, {"category": "North", "value": 742.7} ]
      } }
  ],
  "ai_explanation": "## Summary\nRevenue grew steadily..."
}
```

**Important:** the backend returns **chart data (numbers)**, not images, for the
dashboard. The frontend draws the charts itself with its existing SVG
components (`BarGraphic`, `DonutGraphic`, `LineAreaGraphic`, `BoxPlotGraphic`,
`ScatterGraphic`). Images are only produced for export (Step 8).

### 10.2 Calling the backend from the dashboard

```tsx
useEffect(() => {
  if (!backendId || confirmedColumns.length === 0) return   // demo datasets: skip
  setBackendStatus("loading")
  analysisApi.execute(backendId, confirmedColumns, ANALYSIS_TYPE_MAP[analysisTypeId])
    .catch(retryWithSupportedType)
    .then((result) => { setBackendResult(result); setBackendStatus("done") })
    .catch((err) => { setBackendError(err.message); setBackendStatus("error") })
}, [backendId, analysisTypeId, confirmedColumns.join("|"), runCounter])
```

- A small "Running analysis…" line shows while loading, and an error box with a
  **Retry** button (it increments `runCounter`, which re-runs the effect).
- `cancelled` flag: if the user leaves the page before the answer arrives, we
  ignore the late answer (prevents setting state on an unmounted component).

### 10.3 Turning backend data into the existing chart props

The dashboard always built a `storyConfig` with `getDashboardStory(...)` (demo
data). Now, when a backend result exists, we **overlay** real data on top:

```tsx
let storyConfig = getDashboardStory(datasetMeta, analysisTypeId, confirmedColumns)
if (backendResult) {
  storyConfig = applyAnalysisResultToStory(storyConfig, backendResult, datasetMeta)
  if (extraVisualizations[activeVisualizationType])
    storyConfig = mergeVisualization(storyConfig, extraVisualizations[activeVisualizationType])
}
```

`mergeVisualization` looks at `visualization_type` and calls a converter:

| Backend `visualization_type` | Converter | Fills | Drawn by |
| --- | --- | --- | --- |
| `line_chart`, `area_chart`, `step_line_chart` | `toTrend` | `trendData` | `LineAreaGraphic` |
| `vertical_bar_chart`, `horizontal_bar_chart`, `lollipop_chart`, `frequency_bar_chart`, `stacked_proportional_bar` | `toBars` | `barData` | `BarGraphic` / `LollipopGraphic` |
| `pie_chart`, `donut_chart`, `frequency_bar_chart` | `toDonut` | `donutData` | `DonutGraphic` / `PieGraphic` |
| `box_plot` | `toBox` | `boxPlotData` | `BoxPlotGraphic` |
| `frequency_histogram` | `toHistogram` | `histogramBars` | `BoxPlotGraphic` (histogram mode) |
| `scatter_plot_with_trendline`, `bubble_chart` | `toScatter` | `scatterData` | `ScatterGraphic` |

**Why converters are needed — SVG coordinates.** The existing SVG components
expect *screen positions*, not raw values. For example `TrendPoint` needs `x`
between 40 and 460 and `y` between ~35 and 170 (SVG's y axis grows
**downwards**). So `toTrend` scales values:

```ts
const x = 40 + (420 * i) / (data.length - 1)                // spread points left → right
const y = 170 - ((value - min) / (max - min)) * 135          // big value → small y (higher on screen)
```

Similarly, bars use `val` as a **percentage of the tallest bar** (0–100), donut
segments use `share` as a **percentage of the total**, and long series are
**sampled** (max 8 trend points, 6 bars, 4 donut slices + "Other") so the small
SVGs stay readable. The real number is still shown in `displayVal`
(formatted by `fmt()`: 12 300 → `12.3K`).

`ScatterGraphic` originally ignored data and always drew the same dots; it got
an optional `data` prop so it can draw real points (falls back to the old dots
when no data is given).

### 10.4 Text: metrics and insights

`applyAnalysisResultToStory` also replaces:

- **Metric cards** → rows, selected columns, number of charts generated.
- **Explanation / takeaway / insights** → split from `ai_explanation`
  (`splitExplanation`: removes markdown symbols, first line = summary,
  next lines = bullet insights). Falls back to each chart's `reason`.

### 10.5 The chart switcher (radio buttons)

The UI lets users switch between chart types (e.g. Vertical Bar ↔ Horizontal
Bar). We link this to the backend like so:

1. `CHART_ID_TO_VISUALIZATION` maps UI ids → backend names
   (`horizontal_bar` → `horizontal_bar_chart`).
2. `backendOptions` = every option the backend listed in
   `visualization_options`. **When a backend result exists, the switcher only
   shows those options**, so the user never sees a chart type the backend
   didn't produce.
3. If the currently selected type isn't among them, the dashboard jumps to the
   backend's first `selected_visualization`.
4. Choosing an option that wasn't pre-computed triggers
   `POST /analysis/visualization {analysis_session_id, chart_id, visualization_type}`.
   The answer is cached in `extraVisualizations` so switching back is instant.

`effectiveAnalysisTypeId` tells `ChartContainer` which family of graphic to draw
(trend / comparison / desc_freq / ...) for the selected chart.

---

## 11. Step 8 — Exporting PDF / PNG

The dashboard's `TopNavigation` got an optional `backendExport` prop:

```ts
{ sessionId: 12, chartId: 2, visualizationType: "horizontal_bar_chart" }
```

- When it exists (real upload): **Export → PDF** calls
  `POST /analysis/export/pdf` and **PNG** calls `POST /analysis/export/png`.
  The backend re-draws the chart with matplotlib and (for PDF) builds a report
  with reportlab including the AI explanation. The browser downloads it via
  `apiDownload`.
- When it doesn't (demo data): the original in-browser canvas/PDF code runs.

---

## 12. Step 9 — Settings and Admin

### Settings (`components/settings-workspace.tsx`)

| UI action | Endpoint |
| --- | --- |
| Page opens | `GET /settings/profile` (fills name/username) |
| Save Profile | `PATCH /settings/profile {username, display_name}` |
| Upload photo | `POST /settings/profile/photo` (form field `profile_image`) |
| Update password | `PATCH /settings/password {current_password, new_password, confirm_password}` |
| Chart palette | `PATCH /settings/preferences/chart-color` (`warm/emerald/purple/cool`; "accessible" is UI-only) |
| Currency | `PATCH /settings/preferences/currency` |
| Compact numbers | `PATCH /settings/preferences/number-display` (`compact`/`full`) |
| Theme toggle | `PATCH /settings/preferences/theme` |
| Delete account | `DELETE /settings/account {current_password}` — a password field was added to the confirm dialog because the backend requires it |

Errors from the backend (e.g. *"Current password is incorrect."*) are shown in
the existing feedback areas.

### Admin (`components/admin/admin-user-management.tsx`)

- `GET /admin/users` loads the table (`mapBackendUser` converts rows to the
  existing `ManagedUser` shape; fields the backend doesn't have, like
  "joined date", show `-`).
- **Add user** → `POST /admin/users` (sends the modal's existing temporary
  password field).
- **Delete user** / approve deletion → `DELETE /admin/users/{id}`.
- Suspend, edit, deletion-request list: **no backend endpoints exist**, so they
  still work only locally (documented as future work).

---

## 13. Endpoint ↔ screen reference table

| Screen / action | Frontend code | Endpoint(s) |
| --- | --- | --- |
| Log in | `auth-view.tsx` → `loginWithBackend` | `POST /login`, `GET /settings/profile` |
| Sign up | `auth-view.tsx`, `signup-view.tsx` → `registerWithBackend` | `POST /register`, `POST /login`, `PATCH /settings/profile` |
| Log out | `auth.ts` → `logout` | `POST /settings/logout` |
| Upload | `upload-workspace.tsx` → `handleFileSelect` | `POST /dataset/test-upload`, `POST /dataset/upload`, `GET /dataset/:id/preview`, `GET /dataset/:id/ai-recommend-columns` |
| Clean data | `handleApplyCleaningAndRecheck` | `POST /dataset/:id/clean-missing` |
| Choose columns | `onNext` (step 2) | `POST /dataset/:id/select-columns`, `POST /analysis/recommend` |
| Dashboard | `StoryDashboard` | `POST /analysis/execute`, `POST /analysis/visualization` |
| Export | `TopNavigation` | `POST /analysis/export/pdf`, `POST /analysis/export/png` |
| Settings | `settings-workspace.tsx` | `/settings/*` |
| Admin users | `admin-user-management.tsx` | `GET/POST /admin/users`, `DELETE /admin/users/:id` |

Endpoints that exist but are **not used yet**: `/dataset/:id/quick-examples`,
`/analysis/ai-recommend`, `/analysis/select-type`, `/dataset/:id/validate-*`,
`/dataset/:id/correct-*`, `/dataset/:id/standardize-dates`,
`/dataset/:id/detect-duplicate-rows`, `/dataset/:id/columns`,
`/admin/users/:id` (GET), `/profile`.

---

## 14. How it was tested (without a Gemini key)

You can't run the real AI without a key, and AI answers change every time,
which makes testing hard. The trick used: a small **test runner** script that
imports the real Flask app and replaces ("stubs" / "mocks") only the AI
functions with fixed answers, then starts the server. Nothing in the project
was changed.

```python
# run_backend_test.py  (keep it outside the repo or in a tests/ folder)
import os, sys
os.environ["GEMINI_API_KEY"] = "dummy-test-key"   # the genai client refuses an empty key
sys.path.insert(0, "backend"); os.chdir("backend")
import app as backend_app
import routes.analysis_routes as ar, routes.dataset_routes as dr

ar.get_ai_visualization_recommendation = lambda prompt: ({"charts": [
    {"chart_id": 1, "purpose": "Trend", "reason": "Line fits dates.",
     "visualization_options": ["line_chart", "area_chart", "step_line_chart"]},
    {"chart_id": 2, "purpose": "Compare", "reason": "Bars compare groups.",
     "visualization_options": ["vertical_bar_chart", "horizontal_bar_chart", "lollipop_chart"]},
]}, None)
ar.get_ai_explanation = lambda prompt: ("## Summary\nRevenue grew steadily.\n- North leads.", None)
dr.get_validated_ai_column_recommendation = lambda p, cols: {
    "grouping_column": "Region", "measure_columns": ["Revenue"], "reason": "Region groups the data."}

backend_app.app.run(port=5000)
```

> Why does replacing `ar.get_ai_explanation` work? `analysis_routes.py` did
> `from services.ai_service import get_ai_explanation`, which copies the
> function into the `routes.analysis_routes` module's namespace. Replacing it
> **there** changes what the route calls. (Patching `services.ai_service`
> instead would *not* work — a classic Python mocking gotcha.)

Then the whole flow was driven in a real browser with **Playwright**
(log in → upload a CSV → clean → choose columns → generate dashboard → switch
chart → export PDF), checking each `/api/...` response status.

Handy manual checks with `curl`:

```bash
# login and keep the token
TOKEN=$(curl -s -XPOST localhost:5000/login -H 'Content-Type: application/json' \
  -d '{"login":"tester","password":"Passw0rd!"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# call a protected endpoint
curl -s localhost:5000/settings/profile -H "Authorization: Bearer $TOKEN"

# the same call through the Next.js proxy
curl -s localhost:3000/api/settings/profile -H "Authorization: Bearer $TOKEN"
```

---

## 15. Debugging tips

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| "Cannot reach the DataNarrator server" | Flask not running / wrong port | `curl localhost:5000/login` ; `BACKEND_URL` |
| Everything returns 401 after a while | JWT expired (default 15 min) | Log in again (see issues doc) |
| 422 `Signature verification failed` | `JWT_SECRET_KEY` changed since login | Log out / clear storage |
| Upload works but columns look wrong | pandas 3 installed | `pip show pandas` → use `<3` |
| Date column shown as "category" | Backend date detection (ISO dates, CSV text) | See issues doc |
| Dashboard error "AI visualization recommendation is temporarily unavailable" | Gemini key missing/quota | backend console |
| 400 `Invalid column: X` on clean | Sent plain name instead of `"X (column N)"` | `backendKey` in mappers |

General method:

1. Open the browser **DevTools → Network** tab, filter by `/api/`.
2. Click the failing request → look at **Payload** (what we sent) and
   **Response** (what Flask answered).
3. Look at the Flask terminal for Python tracebacks.
4. Reproduce with `curl` to know whether the bug is frontend or backend.

---

## 16. Glossary

- **API** — a set of URLs a program exposes for other programs to call.
- **Endpoint** — one URL + HTTP method, e.g. `POST /login`.
- **CORS** — browser rule blocking cross-origin reads unless allowed.
- **Reverse proxy / rewrite** — a server that forwards requests to another server.
- **JWT** — signed token proving who you are; sent as `Authorization: Bearer ...`.
- **FormData / multipart** — the request format used to upload files.
- **Mapper / adapter** — function converting one data shape into another.
- **Blueprint (Flask)** — a group of routes registered on the app.
- **Stub / mock** — fake replacement of a function used in tests.
- **SVG viewBox** — the internal coordinate system of an SVG drawing.
- **useEffect** — React hook that runs side effects (like API calls) after render.

---

## 17. Exercises to learn the codebase

Try these in order; each touches a different layer.

1. **Trace a request.** Put a `console.log` in `apiRequest` and a `print` in
   Flask's `login_user`. Log in and follow the request end to end.
2. **Use an unused endpoint.** Show the backend's
   `/dataset/:id/quick-examples` on the column step instead of the hard-coded
   quick goals (`getDemoQuickGoals`).
3. **Handle expired tokens.** In `apiRequest`, when status is 401, call
   `logout()` and redirect to `/`.
4. **Load preferences.** Add the user's saved theme/currency to
   `GET /settings/profile` in the backend and apply them on login.
5. **Write a mapper test.** Feed `buildValidationReportFromBackend` a sample
   backend JSON and assert the result (e.g. with Vitest).
6. Pick any item from `docs/ISSUES_AND_ENHANCEMENTS.md` and fix it.
