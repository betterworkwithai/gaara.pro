#!/bin/bash
# Inicia o Rastreador de Despesas (FinançasBR)

echo "🟠 Iniciando FinançasBR..."

# Backend
echo "📡 Iniciando backend (FastAPI)..."
cd backend
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Aguarda backend iniciar
sleep 2

# Frontend
echo "🌐 Iniciando frontend (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ FinançasBR iniciado!"
echo "   Backend API: http://localhost:8000"
echo "   Docs API:    http://localhost:8000/docs"
echo "   Frontend:    http://localhost:5173"
echo ""
echo "Para parar, pressione CTRL+C"

wait $BACKEND_PID $FRONTEND_PID
