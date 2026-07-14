from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import traceback
import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.endpoints import users, admin, teams, market
import os

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    with open("error_log.txt", "w") as f:
        f.write(f"500 Error: {str(exc)}\n")
        f.write(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    with open("error_log.txt", "w") as f:
        f.write(f"422 Error: {str(exc.errors())}\n")
        f.write(f"Body: {exc.body}\n")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Endpoint de prueba para verificar que la API está funcionando.
    """
    return {"status": "ok", "project": settings.PROJECT_NAME}
