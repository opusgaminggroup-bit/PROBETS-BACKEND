# Deploy ProBets Backend to Render (Free) + Aiven MySQL

## 0) Prerequisites
- GitHub repo with this backend code.
- Aiven account (free MySQL plan).
- Render account (free web service).

## 1) Create Aiven MySQL
1. Create service: **MySQL** (Free).
2. Create database: `probets_credit`.
3. In Aiven service overview, copy:
   - Host
   - Port (usually 3306)
   - Username
   - Password
   - Database name
4. In Aiven, add Render outbound IP allowlist if required (or temporarily allow all for first deploy).

## 2) Apply schema
Run this locally (PowerShell):

```powershell
cd C:\Users\Nurul\.openclaw\workspace\probets-backend
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < schema.mysql.sql
```

If `mysql` CLI is missing, use MySQL Workbench / DBeaver and execute `schema.mysql.sql`.

## 3) Create Render Web Service
1. Render -> New -> Web Service -> connect your GitHub repo.
2. Root Directory:
   - `probets-backend` if monorepo
   - empty if this repo is backend-only
3. Build Command: `npm ci && npm run build`
4. Start Command: `npm run start:prod`
5. Set Environment Variables:
   - `NODE_ENV=production`
   - `DB_HOST`
   - `DB_PORT=3306`
   - `DB_USER`
   - `DB_PASS`
   - `DB_NAME=probets_credit`
   - `ODDS_API_KEY`
   - `SPORTS_MAX_STAKE_PER_BET=5000`
   - `SPORTS_MAX_EXPOSURE_PER_USER_EVENT_MARKET=20000`
   - `SPORTS_LIVE_DELAY_SECONDS=10`
   - `SPORTS_LIVE_QUEUE_ENABLED=1`
   - `SPORTS_LIVE_QUEUE_MAX_ATTEMPTS=5`
   - `SPORTS_MARGIN_PCT=0`
   - `SPORTS_ODDS_PICK=min`
   - `SPORTS_ALERT_DEAD_RATE=0.2`
   - `SPORTS_ALERT_LIABILITY=100000`
   - `SPORTS_ALERT_AUTO_PAUSE_MINUTES=5`
   - `SYSTEM_ADMIN_ID=1`
   - `SPORTS_ALLOWED_BOOKMAKERS=`
   - `TZ=Asia/Kuala_Lumpur`

## 4) Post-deploy smoke test
Assume URL is `https://probets-backend.onrender.com`.

```bash
curl https://probets-backend.onrender.com/odds/sports
curl "https://probets-backend.onrender.com/bets/sports/queue/metrics?hours=24"
curl "https://probets-backend.onrender.com/bets/risk/overview?limit=20"
curl "https://probets-backend.onrender.com/bets/ops/dashboard?hours=24&limit=20"
```

## 5) Demo checklist (运营后台)
- Odds endpoints return data.
- Place sports bet works.
- Queue metrics shows success/dead/failed rates.
- Risk overview shows worstCaseLiability.
- Ops dashboard aggregates queue + risk + deadTop.
- Queue pause control works:
  - `GET /bets/ops/queue-pause`
  - `POST /bets/ops/queue-pause/5`

## 6) Known free-tier caveats
- Render free sleeps after inactivity (first request cold start).
- Free DB quotas are limited.
- Keep cron frequency light to avoid quota exhaustion.

## 7) Minimal production hardening (next)
- Add JWT auth and guards before exposing public internet.
- Restrict CORS origins.
- Add API rate-limit and IP allowlist for ops endpoints.
- Move manual queue pause to persistent state (DB/Redis) if multi-instance.
