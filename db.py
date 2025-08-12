
import os, json
from contextlib import contextmanager
from datetime import datetime
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "")  # Set on Railway
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS run_logs (
    id SERIAL PRIMARY KEY,
    log_date DATE NOT NULL,
    run_type VARCHAR(32),
    planned_desc TEXT,
    target_pace_cool VARCHAR(16),
    target_pace_heat VARCHAR(16),
    actual_distance NUMERIC,
    actual_pace VARCHAR(16),
    rpe INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lift_logs (
    id SERIAL PRIMARY KEY,
    log_date DATE NOT NULL,
    day_type VARCHAR(16),
    exercise VARCHAR(128),
    weight NUMERIC,
    sets INT,
    reps INT,
    rpe INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(64) UNIQUE NOT NULL,
    value TEXT NOT NULL
);
"""

def init_db():
    if engine is None:
        return False
    with engine.begin() as conn:
        conn.execute(text(SCHEMA_SQL))
    return True

@contextmanager
def session():
    if engine is None:
        yield None
        return
    with engine.begin() as conn:
        yield conn

def set_setting(key, value):
    if engine is None: return
    with session() as conn:
        conn.execute(text("INSERT INTO settings(key, value) VALUES (:k,:v) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"),
                     {"k": key, "v": value})

def get_setting(key, default=None):
    if engine is None: return default
    with session() as conn:
        res = conn.execute(text("SELECT value FROM settings WHERE key=:k"), {"k": key}).fetchone()
        return res[0] if res else default

def add_run_log(log_date, run_type, planned_desc, target_pace_cool, target_pace_heat,
                actual_distance, actual_pace, rpe, notes):
    if engine is None: return
    with session() as conn:
        conn.execute(text("""
            INSERT INTO run_logs (log_date, run_type, planned_desc, target_pace_cool, target_pace_heat,
                                  actual_distance, actual_pace, rpe, notes)
            VALUES (:d,:t,:p,:pc,:ph,:ad,:ap,:r,:n)
        """), {"d": log_date, "t": run_type, "p": planned_desc, "pc": target_pace_cool, "ph": target_pace_heat,
               "ad": actual_distance, "ap": actual_pace, "r": rpe, "n": notes})

def add_lift_log(log_date, day_type, exercise, weight, sets, reps, rpe, notes):
    if engine is None: return
    with session() as conn:
        conn.execute(text("""
            INSERT INTO lift_logs (log_date, day_type, exercise, weight, sets, reps, rpe, notes)
            VALUES (:d,:dt,:e,:w,:s,:r,:rp,:n)
        """), {"d": log_date, "dt": day_type, "e": exercise, "w": weight, "s": sets, "r": reps, "rp": rpe, "n": notes})
