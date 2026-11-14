# DataNarrator
DataNarrator Graduation Project

## Running locally (frontend + backend)

The Next.js frontend talks to the Flask backend through `/api/*`.
`frontend/next.config.mjs` proxies those requests to the backend, so no CORS
setup is needed.

### 1. Backend (Flask, port 5000)

Create a `.env` file in the project root (see `.env.example`):

```
JWT_SECRET_KEY=change-me
DATABASE_URL=postgresql://user:password@host:5432/database
GEMINI_API_KEY=your-gemini-key
```

```bash
cd backend
pip install -r requirements.txt
python app.py            # http://127.0.0.1:5000
python create_admin.py   # optional: create an admin account
```

### 2. Frontend (Next.js, port 3000)

```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

If the backend runs somewhere else, start the frontend with
`BACKEND_URL=http://host:port npm run dev`.

### How the screens map to the API

| Screen | Endpoints |
| --- | --- |
| Log in / Sign up | `POST /login`, `POST /register`, `GET /settings/profile` |
| Upload & quality report | `POST /dataset/test-upload`, `POST /dataset/upload`, `GET /dataset/<id>/preview`, `GET /dataset/<id>/ai-recommend-columns` |
| Data cleaning | `POST /dataset/<id>/clean-missing` |
| Column selection | `POST /dataset/<id>/select-columns`, `POST /analysis/recommend` |
| Dashboard | `POST /analysis/execute`, `POST /analysis/visualization` |
| Export PDF / PNG | `POST /analysis/export/pdf`, `POST /analysis/export/png` |
| Settings | `/settings/profile`, `/settings/profile/photo`, `/settings/password`, `/settings/preferences/*`, `/settings/logout`, `/settings/account` |
| Admin users | `GET/POST /admin/users`, `DELETE /admin/users/<id>` |

The built-in sample datasets on the upload page are still offline demos and
do not call the backend.

### Further documentation

- [`docs/INTEGRATION_GUIDE.md`](docs/INTEGRATION_GUIDE.md): how the frontend is linked to the backend and the visualizations (a learning guide for junior developers)
- [`docs/ISSUES_AND_ENHANCEMENTS.md`](docs/ISSUES_AND_ENHANCEMENTS.md): known issues and ideas to implement later
