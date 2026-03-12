from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.routers import (
    auth,
    transactions,
    categories,
    investments,
    debts,
    budgets,
    goals,
    documents,
    dashboard,
    charts,
    projections,
    insights,
    reports,
)

app = FastAPI(
    title="Rastreador de Despesas",
    description="API para controle financeiro pessoal em BRL",
    version="1.0.0",
)

import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    create_tables()


app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(investments.router)
app.include_router(debts.router)
app.include_router(budgets.router)
app.include_router(goals.router)
app.include_router(documents.router)
app.include_router(dashboard.router)
app.include_router(charts.router)
app.include_router(projections.router)
app.include_router(insights.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "Rastreador de Despesas API", "docs": "/docs"}
