# TechMart AI Customer Support

TechMart is a full-stack, multi-agent customer-support application. It uses FastAPI for the API, Next.js for the web interface, SQLite by default, and FAISS plus sentence-transformers to retrieve relevant material from `knowledge_base/`.

## What it provides

- JWT-based registration and sign-in
- Persistent chat sessions, feedback, tickets, and analytics
- Specialist agents for billing, products, technical issues, complaints, refunds, and FAQs
- Retrieval-augmented answers from the local knowledge base
- Optional email (SMTP) and WhatsApp (Twilio) notifications

## Requirements

- Python 3.10 or newer
- Node.js 18.17 or newer
- npm (use `npm.cmd` in PowerShell if script execution is disabled)
- An LLM provider: Groq, OpenAI, or a locally running Ollama instance

## Configuration

1. Copy the template:

   ```powershell
   Copy-Item env.example .env
   ```

2. Edit `.env`. At minimum, choose a provider and configure its credentials. For Groq:

   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=replace_with_your_key
   SECRET_KEY=replace_with_a_long_random_value
   ```

   `OLLAMA_BASE_URL` and `OLLAMA_MODEL` can be used instead when `LLM_PROVIDER=ollama`. The application runs with template fallback responses when an API key is missing, but a configured provider is needed for AI-generated answers.

## Run locally

Run the backend and frontend in separate terminals from the repository root.

### Backend

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The first backend start downloads the embedding model and builds the FAISS index from `knowledge_base/`; this may take a few minutes. Then open `http://localhost:8000/docs` for the interactive API documentation.

### Frontend

```powershell
Set-Location frontend
npm.cmd install
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api"
npm.cmd run dev
```

Open `http://localhost:3000`.

If PowerShell permits npm scripts, `npm install` and `npm run dev` work as well. `npm.cmd` avoids the Windows execution-policy error caused by `npm.ps1`.

## Verification and common errors

Use this check after starting the backend:

```powershell
Invoke-WebRequest http://localhost:8000/api/health
```

- `ModuleNotFoundError: No module named 'fastapi'`: activate the new `.venv` and run `python -m pip install -r requirements.txt`. The repository's existing `myvenv` is not a portable project dependency and may be incomplete.
- Browser requests blocked by CORS: set `CORS_ORIGINS` in `.env` to the comma-separated frontend origins, for example `http://localhost:3000,https://your-app.vercel.app`, then restart the backend.
- Frontend cannot connect: ensure the backend is running on port 8000 and `NEXT_PUBLIC_API_URL` ends with `/api`.
- First start is slow: the embedding model is downloaded and the vector index is created once. Later starts reuse it.
- `WinError 4551` while loading `torch_python.dll`: Windows Application Control has blocked PyTorch. Ask the device administrator to allow the PyTorch installation in your active virtual environment. Until then, chat still works, but without knowledge-base retrieval.

## Project layout

```text
backend/          FastAPI routes, agents, database models, and RAG services
frontend/         Next.js web application
knowledge_base/   Source documents for semantic search
datasets/         Sample and evaluation data
env.example       Environment-variable template
DEPLOYMENT.md     Production deployment guide
```

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md) for a Render + Vercel deployment path, required environment variables, PostgreSQL setup, and production checks.

## Security notes

Do not commit `.env`, API keys, SMTP passwords, Twilio credentials, or production database URLs. Set a unique `SECRET_KEY`, use PostgreSQL in production, and configure only your real frontend domains in `CORS_ORIGINS`.
