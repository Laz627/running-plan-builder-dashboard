
# Railway Notes

If your service boots but shows "Application failed to respond", check:

1) **Start command**: set to `npm run start` (this binds to `$PORT` and `0.0.0.0`).
2) **Env var**: `DATABASE_URL` must be set (Railway Postgres → Connect → Postgres Connection URL).
3) **Build succeeded?** Open Deployments → Build logs. Then check **Runtime Logs**.
4) **Schema**: this project runs `prisma db push` automatically on startup (`prestart` script).
5) **Node version**: pinned to 18.x via `package.json` → `"engines"`.

If it still won't respond, open the **Shell** and run:
```
npx prisma db push
node -v
npm run start
```
