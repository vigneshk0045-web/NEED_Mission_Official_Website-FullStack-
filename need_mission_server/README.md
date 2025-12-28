# NEED Mission — Node/Express API (MongoDB)

This server saves form submissions from the static website to a local MongoDB.
It can also serve the static site so the forms are same-origin (recommended).

## Prerequisites
- Node.js 18+
- MongoDB running locally (default URI: `mongodb://127.0.0.1:27017/need_mission`)

## Setup
```bash
cd need_mission_server
npm install
cp .env.example .env
# (optional) edit .env to change PORT or MONGODB_URI
npm run dev
```

By default, the server also serves the static site from `../NEED_Mission_Site`.
Visit:
- http://localhost:4000  (website)
- POST API endpoints:
  - `POST /api/memberships`
  - `POST /api/contact`

## Using a separate static server
If you prefer to serve the site separately (e.g., `python -m http.server 8000`),
set `SERVE_STATIC=false` in `.env`. CORS is enabled for localhost ports by default.
The forms are wired in `script.js` to POST to `/api/...`.

## View saved data
Open a Mongo shell or Compass and inspect:
- Database: `need_mission`
- Collections: `memberships`, `contactmessages`


## MongoDB Compass
- Install MongoDB Compass and open it.
- Paste the URI `mongodb://127.0.0.1:27017/need_mission` and connect.
- Collections will appear after you submit a form or run `npm run seed`.
