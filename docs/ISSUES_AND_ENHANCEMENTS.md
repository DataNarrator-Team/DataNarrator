# Issues, Opportunities & Enhancements (Backlog)

Things found while linking the frontend to the backend. **None of these were
fixed**, so the existing code stays as it was. Each item says where it lives, why
it matters and a suggested fix.

Priority: 🔴 High (bug / security / blocks users) · 🟠 Medium · 🟢 Low / nice to have
Status: ✅ = verified by running it · 👀 = found by reading the code

---

## A. Backend: bugs and problems

| # | Pri | Where | Issue | Suggested fix |
| --- | --- | --- | --- | --- |
| A1 | 🔴 ✅ | `services/dataset_service.py` (`detect_datetime_columns`, `classify_columns`, `detect_invalid_column_formats`, …) | Text columns are checked with `dtype == "object"`. In **pandas 3** the default string dtype is `str`, so date columns are never detected and some checks are skipped. `requirements.txt` pins `pandas<3` as a workaround. | Use `pd.api.types.is_string_dtype(col) or col.dtype == object`. |
| A2 | 🔴 ✅ | `detect_datetime_columns` | `pd.to_datetime(..., dayfirst=True)` on ISO dates (`2026-01-15`) gives NaT for some rows, so ISO date columns are **not recognised as dates**. `15/01/2026` works. | Try ISO parsing first (`format="ISO8601"`), then fall back to `dayfirst=True`. |
| A3 | 🔴 ✅ | `services/visualization_service.py` `validate_visualization_for_analysis` | Line, area and step-line charts are only allowed when the dataframe has a real **datetime dtype** column. Dates read from CSV are text, so in practice **line charts never pass validation** and Gemini's first chart (the trend) is skipped. | Run the same date detection as `classify_columns`, or convert date-like columns with `pd.to_datetime` before validating. |
| A4 | 🔴 ✅ | `routes/auth_routes.py` `register_user` | Registering an existing username/email returns **500** (database IntegrityError) instead of a friendly 409. | Check for an existing username/email first, as `admin_routes.add_user` already does. |
| A5 | 🔴 ✅ | `routes/auth_routes.py` `login_user` | Uses `user_data["login"]`, so a missing field or non-JSON body returns **500**. | `request.get_json(silent=True)` + `.get()` + return 400. |
| A6 | 🔴 👀 | `services/ai_service.py` (module level) | `genai.Client(api_key=...)` runs on import. With no `GEMINI_API_KEY` the **whole app crashes at startup**, even login. | Create the client lazily inside the AI functions and return a clear error when the key is missing. |
| A7 | 🔴 ✅ | `routes/dataset_routes.py` `/dataset/test-upload` | **No `@jwt_required()`**: anyone can make the server parse uploaded files (risk of abuse or denial of service). | Require JWT and limit file size (`MAX_CONTENT_LENGTH`). |
| A8 | 🟠 ✅ | Flask-JWT default | Tokens expire after **15 minutes** (library default) and there is no refresh token, so users get logged out mid-analysis. | Set `JWT_ACCESS_TOKEN_EXPIRES`, or add refresh tokens. |
| A9 | 🟠 👀 | `routes/settings_routes.py` `/settings/logout` | Logout does nothing on the server, so a stolen token stays valid until it expires. | Add a token blocklist (`jti`) with `@jwt.token_in_blocklist_loader`. |
| A10 | 🟠 👀 | `routes/admin_routes.py` `add_user` | `request.get_json()` is called twice and `generate_password_hash` is imported twice. The `role` sent by the UI is ignored (always `user`). | Clean up; accept `role` (admin-only). |
| A11 | 🟠 👀 | `app.py` | `db.create_all()` and `SELECT 1` run at import time; `debug=True` is hard-coded; `print(app.url_map)` runs on every start. | Move to a CLI or migrations (Flask-Migrate); read debug from env. |
| A12 | 🟠 👀 | `/analysis/export/png`, `/export/pdf`, `/analysis/visualization` | Each call re-reads the file and re-runs the analysis or visualization. | Cache results in `AnalysisSession` or reuse stored chart data. |
| A13 | 🟠 👀 | `/dataset/upload` vs `/dataset/test-upload` | Saving and analysing are separate endpoints, so the frontend uploads the **same file twice**. | Return the quality report from `/dataset/upload` (or analyse by `dataset_id`). |
| A14 | 🟠 👀 | `GET /settings/profile` | Does not return `role` or the saved preferences (theme, currency, chart colour, number display), so they are write-only. | Include them in the response. |
| A15 | 🟠 👀 | Profile photo | Saved by `/settings/profile/photo`, but no route serves the image file. | Add a `send_from_directory` route, or store photos in Supabase Storage. |
| A16 | 🟠 👀 | Missing endpoints for UI features | No endpoints for: list a user's datasets/projects, suspend user, edit user, account-deletion requests, removing duplicate rows. | Add them (the UI already has the screens). |
| A17 | 🟢 👀 | `services/ai_service.py` | AI explanation is free text with markdown; the UI has to guess the structure. | Ask Gemini for JSON (`summary`, `insights[]`, `takeaway`). |
| A18 | 🟢 👀 | `uploads/` on local disk | Files are lost when the container restarts and are not shared between servers. | Use object storage (Supabase Storage or S3). |
| A19 | 🟢 👀 | Error format | Mix of `{"error": …}`, `{"message": …}` and JWT's `{"msg": …}`. | Standardise on one shape, e.g. `{"error": {"code", "message"}}`. |
| A20 | 🟢 👀 | Tests | No automated tests. | Add pytest with a Postgres test DB and stubbed AI (see the guide, section 14). |
| A21 | 🟢 👀 | Comments | Comments mix Arabic and English. | Pick one language for consistency. |

---

## B. Frontend: bugs and problems

| # | Pri | Where | Issue | Suggested fix |
| --- | --- | --- | --- | --- |
| B1 | 🔴 ✅ | `components/story-dashboard.tsx` `ChartContainer` | The card has `h-full`, so in single-chart mode it **stretches to the height of the whole dashboard** (huge empty card that overlaps the footer). It happens with demo data too. | Remove `h-full` from the outer `<div>` of `ChartContainer`. |
| B2 | 🔴 👀 | `lib/api.ts` | No global handling of **401** (expired token): calls just fail with an error message. | On 401, call `logout()` and redirect to `/` with a "session expired" message. |
| B3 | 🔴 ✅ | `components/signup-view.tsx` `handleSocialSignUp` | Google/GitHub buttons fake a login without a backend token. Since login now requires a token, the click silently does nothing useful (the user lands back on the home page, still logged out, with no message). | Hide the buttons or show "coming soon" until OAuth exists in the backend. |
| B4 | 🟠 👀 | `lib/api.ts` | The JWT is kept in `sessionStorage`, which any injected script can read (XSS). | Prefer an httpOnly cookie set by the backend (`JWT_TOKEN_LOCATION=["cookies"]`). |
| B5 | 🟠 👀 | `lib/auth.ts` | `isAdmin` is also true when `username === "admin"`, and demo profiles (`Shahad Saif`) are still the defaults. | Use only the backend `role`; remove the demo defaults. |
| B6 | 🟠 ✅ | `components/admin/admin-user-management.tsx` | Header badge is hard-coded `5 Accounts`; footer says "Synced & persisted locally". | `{users.length} Accounts` and "Synced with server". |
| B7 | 🟠 👀 | Admin screen | Suspend, edit and deletion requests still only change data in the browser (no endpoints, see A16). The old localStorage loader is disabled with `if (true) return;`. | Delete the dead demo code once the endpoints exist. |
| B8 | 🟠 👀 | `app/projects/page.tsx` | Placeholder page; the unused `fetchProjects()` calls `/api/projects`, which doesn't exist. | Build it on a "list my datasets" endpoint (A16). |
| B9 | 🟠 👀 | Upload: sample datasets | The 3 built-in samples are still offline demos (no backend). | Ship them as real CSV files in `public/` and upload them through the real flow. |
| B10 | 🟠 👀 | Column step: quick goals | `getDemoQuickGoals` is hard-coded per demo file name. | Use `GET /dataset/:id/quick-examples` (already exists). |
| B11 | 🟠 👀 | Cleaning studio | Only missing values are sent to the backend. Format fixes, removing duplicate rows and excluding columns stay in the UI, and the custom fill values (`NaN`, `null`, custom text) become `leave_missing`. | Wire `/correct-dates`, `/standardize-dates` and `/correct-numeric-range`; add backend support for custom values and duplicate removal. |
| B12 | 🟠 👀 | Settings | Preferences are saved but not loaded back from the backend (A14). The currency key in localStorage is misspelled `datanarrutor_currency_format`. | Load them on login; fix the key name. |
| B13 | 🟠 👀 | Dashboard multi-goal mode | Turned off for real uploads (it relies on demo quick goals). | Re-enable it using backend quick examples (B10). |
| B14 | 🟢 👀 | Dashboard charts | The SVG charts are simplified (at most 8 trend points, 6 bars, 4 donut slices + "Other"; box plot labels are fixed positions; the density curve is decorative). | Use a chart library (Recharts or visx) fed directly by backend data. |
| B15 | 🟢 👀 | `next.config.mjs` | `typescript.ignoreBuildErrors: true` hides type errors in production builds. | Turn it off and fix any errors. |
| B16 | 🟢 👀 | `frontend/` | Both `package-lock.json` and `pnpm-lock.yaml` exist, and `package.json` says `pnpm@12.3.4`. | Keep one package manager. |
| B17 | 🟢 👀 | Many components | Many `any` types for API data. | Add TypeScript interfaces for backend responses (or generate them from an OpenAPI spec). |
| B18 | 🟢 👀 | Frontend tests | None. | Add Vitest for `lib/backend-mappers.ts` and Playwright end-to-end tests for the main flow. |
| B19 | 🟢 👀 | Upload progress bar | The progress bar is simulated. | Use `XMLHttpRequest` upload progress events, or show a spinner. |

---

## C. Opportunities (new value)

| # | Idea | Notes |
| --- | --- | --- |
| C1 | **Project history**: reopen past analyses | `AnalysisSession` already stores the type, columns, chart recommendations and AI explanation. Add `GET /analysis/sessions`. |
| C2 | **Use all 3 recommended charts** on the dashboard at once | The backend already returns up to 3 charts. |
| C3 | **AI analysis recommendation** in step 3 | `/analysis/ai-recommend` exists but is unused. |
| C4 | **Validation endpoints** in the quality report | `/validate-dates`, `/validate-emails` and `/validate-numeric-range` exist but are unused. |
| C5 | **OpenAPI/Swagger** for the backend | Generates frontend types automatically and documents the API (e.g. `flask-smorest`). |
| C6 | **Docker Compose** (frontend + backend + Postgres) | One-command setup for new developers. |
| C7 | **CI** (GitHub Actions): lint, type-check, tests | Catches regressions. |
| C8 | **Background jobs** for long AI calls | Avoids proxy timeouts; poll for status or use websockets. |
| C9 | **Rate limiting** on the AI endpoints | Protects the Gemini quota (`flask-limiter`). |
| C10 | **Arabic / RTL support** | Many comments are in Arabic, so the audience may want it. |

---

## D. Notes about the integration itself

- **D1.** Frontend analysis ids are mapped to backend types in `lib/api.ts`
  (`ANALYSIS_TYPE_MAP`). "Trend" maps to `comparative`, the only type where the
  backend allows line charts. Revisit this after A3 is fixed.
- **D2.** The dashboard shows only the chart types the backend produced. If A3 is
  fixed, line and area charts will appear automatically.
- **D3.** The only changes to UI behaviour made for the integration were: a
  password field in the delete-account dialog (the backend requires it), the
  admin "Add user" form now sends its temporary password, and a loading/error
  line on the dashboard.
