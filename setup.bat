@echo off
chcp 65001 >nul
echo.
echo  ============================================
echo   FinancasBR - Instalacao (primeira vez)
echo  ============================================
echo.

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo  Instale o Python em: https://www.python.org/downloads/
    echo  IMPORTANTE: Durante a instalacao, marque a caixa:
    echo  "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
echo  [OK] Python encontrado
python --version

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo  Instale o Node.js em: https://nodejs.org/
    echo  Baixe a versao LTS (botao verde grande)
    echo  Depois feche e abra este arquivo novamente.
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js encontrado
node --version

echo.
echo  Instalando dependencias do backend (aguarde 2-5 min)...
echo  --------------------------------------------------------
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt

:: Criar .env se nao existir
if not exist .env (
    copy .env.example .env
    echo  [OK] Arquivo de configuracao criado: backend\.env
)
cd ..

echo.
echo  Instalando dependencias do frontend (aguarde 1-2 min)...
echo  --------------------------------------------------------
cd frontend
call npm install
cd ..

echo.
echo  ============================================
echo   Instalacao concluida com sucesso!
echo.
echo   Para iniciar o app: clique duas vezes em
echo   run.bat
echo  ============================================
echo.
pause
