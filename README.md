# FinançasBR — Rastreador de Despesas Pessoais

> Controle total das suas finanças: despesas, receitas, investimentos, dívidas, metas e muito mais. Com inteligência artificial para importar extratos bancários e sugerir melhorias.

---

## O que é isso?

**FinançasBR** é um aplicativo web de finanças pessoais que roda no seu computador. Tudo fica salvo localmente — nenhum dado vai para a nuvem.

**Funcionalidades principais:**
- Registre receitas e despesas com categorias automáticas
- Visualize gráficos de gastos por categoria e evolução mensal
- Defina orçamentos e acompanhe se está cumprindo
- Crie metas de poupança (Viagem, Reserva de emergência, Carro...)
- Importe extratos do banco ou fatura do cartão em PDF — a IA lê e categoriza automaticamente
- Veja seu **Score de Saúde Financeira** (0–100) com sugestões de melhoria
- Projete seu patrimônio para os próximos anos
- Exporte relatórios mensais/anuais e resumo para Imposto de Renda

---

## Antes de Começar

### O que você vai precisar instalar

> **Novo no desenvolvimento?** Não se preocupe. Este guia explica cada passo com detalhes. Você vai precisar instalar 2 programas antes de começar.

#### 1. Python 3.8 ou superior

Python é a linguagem de programação usada no "motor" do aplicativo.

**Verificar se já está instalado:**
```bash
python --version
# ou
python3 --version
```
Se aparecer `Python 3.8.x` ou superior, você já tem. Pule para o próximo item.

**Instalar Python:**
- **Windows:** Acesse https://www.python.org/downloads/ e baixe o instalador. **Importante:** marque a opção "Add Python to PATH" durante a instalação.
- **macOS:** `brew install python3` (requer [Homebrew](https://brew.sh)) — ou baixe em https://www.python.org/downloads/
- **Linux (Ubuntu/Debian):** `sudo apt install python3 python3-pip python3-venv`
- **Linux (Fedora/CentOS):** `sudo dnf install python3`

**Verificar instalação:**
```bash
python --version
# Deve mostrar: Python 3.8.x ou superior
```

---

#### 2. Node.js 16 ou superior

Node.js é necessário para rodar a interface visual do aplicativo.

**Verificar se já está instalado:**
```bash
node --version
npm --version
```
Se aparecer `v16.x.x` ou superior em ambos, você já tem.

**Instalar Node.js:**
- Acesse https://nodejs.org/ e baixe a versão **LTS** (recomendada para a maioria dos usuários)
- Instale normalmente como qualquer programa
- Feche e abra o terminal novamente após a instalação

**Verificar instalação:**
```bash
node --version
# Deve mostrar: v16.x.x ou superior

npm --version
# Deve mostrar: 8.x.x ou superior
```

---

#### 3. Chave de API da Anthropic (opcional, mas recomendada)

A chave de API é necessária apenas para as funcionalidades de inteligência artificial:
- Importar extratos bancários em PDF automaticamente
- Receber sugestões de melhoria financeira personalizadas

**Sem a chave:** o aplicativo funciona normalmente. Você apenas preenche as transações manualmente.

**Com a chave:** você pode arrastar um PDF do seu banco e a IA extrai todas as transações automaticamente.

**Como obter:**
1. Acesse https://console.anthropic.com
2. Crie uma conta (gratuita para começar)
3. Vá em "API Keys" e clique em "Create Key"
4. Copie a chave — ela começa com `sk-ant-...`
5. Guarde em local seguro (você vai usar daqui a pouco)

---

## Instalação Passo a Passo

> **O que é um terminal?** É uma janela onde você digita comandos de texto. No Windows, procure por "PowerShell" ou "Prompt de Comando" no menu iniciar. No macOS, procure por "Terminal" no Spotlight (Cmd+Espaço). No Linux, pressione Ctrl+Alt+T.

### Passo 1 — Obtenha o projeto

**Opção A: Com Git (recomendado)**
```bash
git clone <url-do-repositório>
cd expense-tracker
```

**Opção B: Download manual**
1. Baixe o arquivo ZIP do projeto
2. Extraia em uma pasta de sua escolha
3. Abra o terminal e navegue até a pasta:
```bash
cd caminho/para/expense-tracker
# Exemplo Windows: cd C:\Users\SeuNome\Downloads\expense-tracker
# Exemplo macOS/Linux: cd ~/Downloads/expense-tracker
```

---

### Passo 2 — Configure o Backend (motor do aplicativo)

O "backend" é o servidor que processa seus dados e os salva no banco de dados.

#### 2.1 — Entre na pasta do backend
```bash
cd backend
```

#### 2.2 — Crie um ambiente virtual

> **O que é um ambiente virtual?** É como uma pasta isolada que guarda as dependências do projeto sem misturar com outros programas Python do seu computador. Pense como uma caixa separada para cada projeto.

```bash
python -m venv venv
# ou, se o comando acima não funcionar:
python3 -m venv venv
```

**Verificar:** Uma pasta chamada `venv` deve ter sido criada dentro de `backend/`.

#### 2.3 — Ative o ambiente virtual

Este passo é diferente dependendo do seu sistema operacional:

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

> **Erro no PowerShell?** Execute primeiro: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` e tente novamente.

**Windows (Prompt de Comando / CMD):**
```cmd
venv\Scripts\activate
```

**macOS ou Linux:**
```bash
source venv/bin/activate
```

**Como saber se funcionou:** O prompt do terminal deve mostrar `(venv)` no início:
```
(venv) C:\Users\SeuNome\backend>     # Windows
(venv) usuario@computador:~/backend$ # macOS/Linux
```

> **Importante:** Sempre que abrir um novo terminal para rodar o aplicativo, você precisará ativar o ambiente virtual novamente.

#### 2.4 — Instale as dependências Python

```bash
pip install -r requirements.txt
```

Isso vai instalar todos os pacotes necessários. Aguarde — pode demorar 1-3 minutos na primeira vez.

**Verificar instalação:**
```bash
python -c "import fastapi; print('Instalação OK!')"
# Deve mostrar: Instalação OK!
```

---

### Passo 3 — Configure o Frontend (interface visual)

O "frontend" é a parte visual do aplicativo que você vê no navegador.

#### 3.1 — Volte para a pasta raiz e entre no frontend
```bash
cd ..
cd frontend
```

#### 3.2 — Instale as dependências do Node.js

```bash
npm install
```

Aguarde 1-2 minutos. Você verá uma barra de progresso e ao final algo como `added 172 packages`.

**Verificar:** A pasta `node_modules` deve existir dentro de `frontend/`.

#### 3.3 — Volte para a pasta raiz
```bash
cd ..
```

---

### Passo 4 — Configure as variáveis de ambiente

As variáveis de ambiente são configurações do aplicativo guardadas em um arquivo especial chamado `.env`. Esse arquivo fica na pasta `backend/` e contém informações como a chave da API.

#### 4.1 — Copie o arquivo de exemplo

**macOS ou Linux:**
```bash
cp backend/.env.example backend/.env
```

**Windows (PowerShell):**
```powershell
Copy-Item backend\.env.example backend\.env
```

**Windows (Prompt de Comando):**
```cmd
copy backend\.env.example backend\.env
```

#### 4.2 — Abra o arquivo `.env` para editar

Use qualquer editor de texto (Bloco de Notas, VS Code, Notepad++):

```
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL=sqlite:///./expense_tracker.db
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

#### 4.3 — Configure a chave de API (se tiver)

Substitua `your-anthropic-api-key-here` pela sua chave real:
```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXX
```

**Não tem chave?** Deixe a linha como está ou apague apenas o valor:
```
ANTHROPIC_API_KEY=
```

O aplicativo vai funcionar normalmente — só as funções de IA ficarão desativadas.

#### 4.4 — Mude a chave secreta (recomendado)

A `SECRET_KEY` é usada para proteger os logins. Para maior segurança, gere uma aleatória:

**macOS/Linux:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Windows:**
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copie o resultado e cole no `.env`:
```
SECRET_KEY=a1b2c3d4e5f6...  (sua chave gerada)
```

---

## Rodando o Aplicativo

### Opção A — Script automático (recomendado para iniciantes)

Este script inicia o backend e o frontend automaticamente:

**macOS ou Linux:**
```bash
bash start.sh
```

**Windows (Git Bash):**
```bash
bash start.sh
```

**Windows (PowerShell — se o script não funcionar):** Use a Opção B abaixo.

Após iniciar, você verá:
```
🟠 Iniciando FinançasBR...
📡 Iniciando backend (FastAPI)...
🌐 Iniciando frontend (Vite)...

✅ FinançasBR iniciado!
   Backend API: http://localhost:8000
   Docs API:    http://localhost:8000/docs
   Frontend:    http://localhost:5173

Para parar, pressione CTRL+C
```

Abra seu navegador em **http://localhost:5173** para usar o aplicativo.

Para parar os servidores: pressione **Ctrl+C** no terminal.

---

### Opção B — Inicialização manual (dois terminais)

Use esta opção se o script automático não funcionar, ou se preferir mais controle.

Você vai precisar de **dois terminais abertos ao mesmo tempo**.

**Terminal 1 — Backend:**
```bash
cd backend

# Ative o ambiente virtual:
source venv/bin/activate       # macOS/Linux
# ou
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# ou
venv\Scripts\activate          # Windows CMD

# Inicie o servidor:
uvicorn app.main:app --reload --port 8000
```

Aguarde até ver:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Aguarde até ver:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## Lista de Verificação

Após iniciar o aplicativo, confirme que tudo está funcionando:

- [ ] **Backend funcionando:** Abra http://localhost:8000 no navegador → deve aparecer `{"message":"Bem-vindo ao FinançasBR API"}`

- [ ] **Frontend funcionando:** Abra http://localhost:5173 no navegador → deve aparecer a tela de login do FinançasBR

- [ ] **Banco de dados criado:** Verifique se o arquivo `backend/expense_tracker.db` foi criado (acontece automaticamente na primeira execução)

- [ ] **Documentação da API:** Abra http://localhost:8000/docs → deve mostrar o explorador interativo da API (Swagger UI)

- [ ] **Criar primeira conta:** Clique em "Criar conta" na tela de login → preencha email e senha → faça login → deve aparecer o Dashboard com 20 categorias já criadas automaticamente

---

## Resolução de Problemas

### "python: command not found" ou "python não é reconhecido"

Python não está instalado ou não está no PATH do sistema.

**Solução:**
1. Reinstale Python de https://www.python.org/downloads/
2. **Windows:** Durante a instalação, marque obrigatoriamente "Add Python to PATH"
3. Feche e abra um novo terminal
4. Tente `python3 --version` (em vez de `python`)

---

### "npm: command not found"

Node.js não está instalado ou não foi adicionado ao PATH.

**Solução:**
1. Reinstale Node.js de https://nodejs.org/ (versão LTS)
2. **Reinicie o terminal completamente** após a instalação
3. Verifique: `node --version`

---

### "ModuleNotFoundError: No module named 'fastapi'"

O ambiente virtual não está ativado ou as dependências não foram instaladas.

**Solução:**
```bash
cd backend
source venv/bin/activate   # macOS/Linux
# ou .\venv\Scripts\Activate.ps1 no Windows

pip install -r requirements.txt
```

Verifique se `(venv)` aparece no início do prompt do terminal.

---

### "Cannot activate virtual environment" (Windows PowerShell)

O PowerShell está bloqueando a execução de scripts por política de segurança.

**Solução:** Execute este comando **uma única vez**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Depois tente ativar o ambiente virtual novamente.

---

### "Port 8000 is already in use" ou "Endereço já em uso"

Outro programa está usando a porta 8000.

**Solução Windows:**
```powershell
# Encontrar o processo na porta 8000:
netstat -ano | findstr :8000
# Anote o PID (número na última coluna) e encerre:
taskkill /PID <numero> /F
```

**Solução macOS/Linux:**
```bash
# Encontrar e encerrar o processo na porta 8000:
lsof -ti:8000 | xargs kill -9
```

---

### "EACCES: permission denied" (ao executar npm install)

Problema de permissões do npm no macOS/Linux.

**Solução:**
```bash
# Opção 1: Use npx (sem instalação global)
npx npm install

# Opção 2: Corrija as permissões do npm
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

---

### Tela em branco no navegador ou "Cannot connect to backend"

O backend pode não ter iniciado corretamente.

**Diagnóstico:**
1. Verifique o Terminal 1 (backend) — deve mostrar `Application startup complete`
2. Abra http://localhost:8000 diretamente → se não carregar, o backend falhou
3. Leia a mensagem de erro no terminal e consulte os outros itens desta seção

**Solução mais comum:**
- Ambiente virtual não ativado (ver "ModuleNotFoundError" acima)
- Arquivo `.env` não criado (ver Passo 4 da instalação)

---

### Erro ao instalar dependências Python (cryptography, bcrypt, etc.)

Este projeto usa implementações puras em Python para autenticação, sem dependências de bibliotecas nativas compiladas. Se você encontrar erros com `cryptography` ou `bcrypt`:

**Solução:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

---

## Primeiros Passos no Aplicativo

Agora que está funcionando:

### 1. Crie sua conta
- Clique em **"Criar conta"** na tela de login
- Preencha nome, email e senha
- Ao fazer login, **20 categorias** são criadas automaticamente (Alimentação, Moradia, Transporte, Saúde, etc.)

### 2. Adicione sua primeira transação
- Clique em **"Transações"** no menu lateral
- Clique em **"Adicionar Transação"**
- Preencha: data, descrição, valor, categoria e tipo (Receita ou Despesa)
- O Dashboard atualiza automaticamente

### 3. Configure seu orçamento
- Clique em **"Orçamento"** no menu lateral
- Defina quanto quer gastar por categoria no mês
- Ex: Alimentação = R$ 800, Transporte = R$ 300
- O app mostrará alertas quando estiver se aproximando do limite

### 4. Crie uma meta de poupança
- Clique em **"Metas"** no menu lateral
- Exemplos: "Viagem" R$ 5.000, "Reserva de Emergência" R$ 10.000
- O app calcula: *"Você precisa guardar R$ 416/mês para chegar lá em 12 meses"*

### 5. Importe extratos bancários (requer chave de API)
- Baixe o extrato do seu banco ou fatura do cartão em PDF
- Clique em **"Importar"** no menu lateral
- Arraste o arquivo PDF para a área indicada
- A IA lê e extrai todas as transações automaticamente
- Revise, corrija se necessário, e confirme a importação

### 6. Veja seus Insights
- Clique em **"Insights"** no menu lateral
- Veja seu **Score de Saúde Financeira** (0–100)
  - 80–100: Excelente
  - 60–79: Bom
  - 40–59: Regular
  - 0–39: Crítico
- Leia as sugestões personalizadas de melhoria

### 7. Explore as Projeções
- Clique em **"Projeções"** no menu lateral
- Use os controles deslizantes para simular cenários
- Veja como seu patrimônio evolui nos próximos anos

---

## Estrutura do Projeto

```
expense-tracker/
├── backend/                    # Servidor Python (FastAPI)
│   ├── app/
│   │   ├── main.py             # Ponto de entrada da API
│   │   ├── models/             # Estrutura do banco de dados
│   │   ├── routers/            # Endpoints da API
│   │   └── services/           # Lógica de negócio e IA
│   ├── requirements.txt        # Dependências Python
│   ├── .env.example            # Modelo de configuração
│   └── expense_tracker.db      # Banco de dados (criado automaticamente)
│
├── frontend/                   # Interface visual (React)
│   ├── src/
│   │   ├── pages/              # Telas do aplicativo
│   │   └── components/         # Componentes reutilizáveis
│   └── package.json            # Dependências JavaScript
│
└── start.sh                    # Script de inicialização
```

**Como funciona:**
```
Seu Navegador (localhost:5173)
        ↕ envia e recebe dados
Servidor Backend (localhost:8000)
        ↕ lê e grava
Banco de Dados SQLite (arquivo local)
        ↕ (opcional)
API da Anthropic (IA para PDF e insights)
```

Todos os seus dados ficam no arquivo `backend/expense_tracker.db` no seu computador. Nada é enviado para servidores externos, exceto quando você usa as funções de IA.

---

## Fazendo Backup dos Seus Dados

Seus dados ficam em um único arquivo:
```
backend/expense_tracker.db
```

Para fazer backup, copie esse arquivo para outro lugar (HD externo, nuvem, etc.). Para restaurar, substitua o arquivo e reinicie o aplicativo.

---

## Parar o Aplicativo

No terminal onde o aplicativo está rodando:

```
Ctrl + C
```

Isso encerra tanto o backend quanto o frontend.

---

## Informações Técnicas

| Componente | Tecnologia | Porta |
|---|---|---|
| Backend (API) | Python + FastAPI | 8000 |
| Frontend (Interface) | React + TypeScript + Vite | 5173 |
| Banco de Dados | SQLite | (arquivo local) |
| Documentação da API | Swagger UI | 8000/docs |

**Tecnologias principais:**
- **Backend:** Python 3.8+, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts
- **IA:** Claude API (Anthropic) — opcional
