@echo off
chcp 65001 >nul
echo.
echo  Iniciando FinancasBR...
echo.

:: Verificar se foi instalado
if not exist backend\venv (
    echo  [ERRO] App nao instalado ainda!
    echo  Execute setup.bat primeiro.
    pause
    exit /b 1
)

:: Iniciar backend em nova janela
echo  Iniciando servidor backend...
start "FinancasBR - Backend" cmd /c "cd backend && venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000"

:: Aguardar backend iniciar
echo  Aguardando backend iniciar...
timeout /t 4 /nobreak >nul

:: Iniciar frontend em nova janela
echo  Iniciando interface...
start "FinancasBR - Frontend" cmd /c "cd frontend && npm run dev"

:: Aguardar frontend iniciar
echo  Aguardando interface iniciar...
timeout /t 6 /nobreak >nul

:: Abrir navegador
echo  Abrindo navegador...
start http://localhost:5173

echo.
echo  ============================================
echo   FinancasBR esta rodando!
echo   Acesse: http://localhost:5173
echo.
echo   Para fechar o app:
echo   Feche as duas janelas pretas abertas
echo   (FinancasBR Backend e FinancasBR Frontend)
echo  ============================================
echo.
