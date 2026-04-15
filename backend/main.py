from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routers import auth, customers, dashboard, logs, media_pools, nodes, settings, usage, vendors
from app.schemas import HealthResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="MediaRouteX API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(vendors.router)
app.include_router(nodes.router)
app.include_router(media_pools.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(usage.router)
app.include_router(logs.router)


@app.get("/", response_model=HealthResponse)
def read_root() -> HealthResponse:
    return HealthResponse(status="Backend Running")
