This is the MediaRouteX frontend, built with Next.js and Tailwind CSS for a premium dark telecom control panel.

## Current Scope

Phase 1 in this repo focuses on control-plane scaffolding only.

- Dashboard
- Customers
- Vendors
- Nodes
- Media Pools
- Usage
- Logs
- Settings

Current product rules reflected in the UI and backend scaffold:

- Customer identity is based only on source dialer IP
- Customers do not receive media pools directly
- Vendors can have one or more assigned media pools
- Media pools contain media IPs from nodes
- Each server can expose up to 61 media IPs later
- Default per-media-IP capacity is 30 concurrent calls and 5 CPS
- Pool selection logic is scaffolded around balanced least-used behavior
- No prefix matching, real SIP routing, RTP engine integration, or SSH scanning yet

## Getting Started

Frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the UI.

Backend from the `backend` folder:

```bash
venv\Scripts\activate.bat
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend modules currently include SQLite-ready tables and CRUD-style routers for:

- customers
- customer_ips
- vendors
- vendor_media_pools
- nodes
- node_ips
- media_pools
- media_pool_ips
- logs

The schema and routers are intentionally modular so future SIP/media integrations can be added without rewriting the control panel foundation.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
