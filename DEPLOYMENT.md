# Deployment guide

This guide deploys the FastAPI backend to Render and the Next.js frontend to Vercel. Equivalent platforms work if they use the same build and start commands.

## Before deploying

1. Push the repository without `.env`, virtual environments, `.next`, or generated FAISS indexes.
2. Create a managed PostgreSQL database. Copy its connection string.
3. Generate a long random `SECRET_KEY`:

   ```powershell
   py -3 -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

4. Decide the public frontend URL, such as `https://techmart-support.vercel.app`.

## Deploy the backend (Render)

1. Create a new **Web Service** from the repository.
2. Use Python 3.10+ and set:

   ```text
   Build command: pip install -r requirements.txt
   Start command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```

3. Set these environment variables:

   ```text
   LLM_PROVIDER=groq
   GROQ_API_KEY=<your key>
   GROQ_MODEL=llama-3.1-8b-instant
   DATABASE_URL=<managed PostgreSQL connection string>
   SECRET_KEY=<generated secret>
   DEBUG=false
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

   Add `SMTP_*` and `TWILIO_*` only if email or WhatsApp alerts are required. Use the provider's secret manager rather than committing these values.

4. Deploy and confirm `https://<your-backend>/api/health` and `https://<your-backend>/docs` respond.

The service builds the vector index at startup. Keep `knowledge_base/` in the repository. For large knowledge bases, use persistent storage or move indexing to a separate build/job process so it is not repeated after every new instance.

## Deploy the frontend (Vercel)

1. Import the repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add this environment variable, using the deployed backend URL:

   ```text
   NEXT_PUBLIC_API_URL=https://<your-backend-host>/api
   ```

4. Deploy. Vercel automatically runs the Next.js build.
5. Copy the Vercel URL into the backend's `CORS_ORIGINS`, then redeploy the backend.

## Post-deployment checks

1. Visit the frontend and register a test user.
2. Send a message and verify a response is saved in the database.
3. Check the backend health endpoint and logs.
4. Confirm that requests from a different origin are rejected and that the frontend origin is accepted.

## Production recommendations

- Use PostgreSQL, not SQLite, when more than one backend instance can run.
- Set `CORS_ORIGINS` to exact HTTPS origins; never use `*` with credentialed requests.
- Rotate LLM, database, SMTP, and Twilio credentials regularly.
- Add platform health checks for `/api/health` and monitor startup failures caused by embedding-model downloads.
- Back up PostgreSQL and keep the knowledge-base source documents under version control or in durable storage.

