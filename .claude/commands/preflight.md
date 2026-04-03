Pre-flight before deploying:
1. Run `npm run build` — fix ALL TypeScript errors first
2. Check env vars exist: DATABASE_URL, CORS origins, API URLs
3. Commit all changes with a descriptive message
4. Deploy to Railway
5. Read logs — if it fails, fix and redeploy in a loop. Don't stop to ask me questions.
