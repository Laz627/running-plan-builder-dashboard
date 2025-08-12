
# Run + Lift Dashboard (Streamlit) — v3.1
Adds **Charts** and an **Editable Plan Builder** on top of v3 (Today view, Postgres, mobile UI).

## New in v3.1
- **Editable Plan Builder** (drag-and-edit table, then Save)
- **Planned Weekly Mileage chart**
- Hooks in place for more charts (RPE trend, pace vs temp) as logs accumulate

## Local Dev
```bash
pip install -r requirements.txt
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"   # optional
streamlit run app.py
```

## Deploy to Railway
- Push to GitHub → Railway → Deploy from GitHub
- Add `DATABASE_URL` env var (Railway Postgres plugin)
- Open your URL

## Tips
- Use the **Builder** tab to customize your 12-week plan. Click **Save Plan**; it persists in the DB.
- The **Charts** tab currently shows planned weekly mileage. Once you start logging, we can add:
  - RPE trend (runs/lifts)
  - Pace vs. temperature scatter
  - Long-run progression and total volume
