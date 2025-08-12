
import streamlit as st
import pandas as pd
import numpy as np
from datetime import date, datetime, timedelta
import json, re

from db import init_db, set_setting, get_setting, add_run_log, add_lift_log

st.set_page_config(page_title="Run + Lift Dashboard", layout="wide")

# ---------- Styles ----------
st.markdown("""
<style>
html, body, [class*="css"]  { font-family: Inter, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
.block-container { padding-top: 1rem; padding-bottom: 2rem; }
.card { border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 16px; background: #fff; box-shadow: 0 .5rem 1rem rgba(0,0,0,.03); }
.metric { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; background: #fbfbfc; }
.divider { height: 1px; background: rgba(0,0,0,0.06); margin: 10px 0 18px 0; }
@media (max-width: 640px) {.card { padding: 12px; border-radius: 14px; }}
</style>
""", unsafe_allow_html=True)

# ---------- Sidebar ----------
with st.sidebar:
    st.title("⚙️ Settings")
    # Dates
    start_date = st.date_input("Training Start Date", value=date.fromisoformat(get_setting("start_date", date.today().isoformat())))
    race_date  = st.date_input("Race Date", value=date.fromisoformat(get_setting("race_date", (date.today()+timedelta(weeks=12)).isoformat())))
    set_setting("start_date", start_date.isoformat())
    set_setting("race_date", race_date.isoformat())

    st.markdown("---")
    goal_mp = st.text_input("Goal MP (mm:ss)", value=get_setting("goal_mp", "9:40"))
    tempo_base = st.text_input("Tempo (mm:ss)", value=get_setting("tempo_base", "9:00"))
    easy_base = st.text_input("Easy (mm:ss)", value=get_setting("easy_base", "10:30"))
    speed_base = st.text_input("Speed (mm:ss)", value=get_setting("speed_base", "7:55"))
    recovery_base = st.text_input("Recovery (mm:ss)", value=get_setting("recovery_base", "10:35"))
    for k,v in [("goal_mp",goal_mp),("tempo_base",tempo_base),("easy_base",easy_base),("speed_base",speed_base),("recovery_base",recovery_base)]:
        set_setting(k,v)

    st.markdown("---")
    temp = int(st.number_input("Temperature (°F)", min_value=-10, max_value=130, value=int(get_setting("temp","80"))))
    humidity = int(st.slider("Humidity (%)", min_value=0, max_value=100, value=int(get_setting("humidity","60"))))
    set_setting("temp", str(temp)); set_setting("humidity", str(humidity))

    st.markdown("---")
    inc_upper = int(st.number_input("Upper Body +lb", 1, 20, int(get_setting("inc_upper","5"))))
    inc_lower = int(st.number_input("Lower Body +lb", 1, 30, int(get_setting("inc_lower","10"))))
    inc_assist = int(st.number_input("Assistance -lb", 1, 20, int(get_setting("inc_assist","5"))))
    for k,v in [("inc_upper",inc_upper),("inc_lower",inc_lower),("inc_assist",inc_assist)]:
        set_setting(k, str(v))

ok = init_db()
if not ok:
    st.warning("Database not connected. Set DATABASE_URL on Railway to enable persistence.")

# ---------- Helpers ----------
def mmss_to_min(p):
    try:
        m, s = p.split(":")
        return int(m) + int(s)/60
    except Exception:
        return None

def min_to_mmss(x):
    m = int(x)
    s = round((x - m) * 60)
    if s == 60:
        m += 1; s = 0
    return f"{m}:{s:02d}"

def heat_humidity_factor(t, h):
    if t <= 60: heat = 0.00
    elif t <= 65: heat = 0.01
    elif t <= 70: heat = 0.02
    elif t <= 75: heat = 0.03
    elif t <= 80: heat = 0.04
    elif t <= 85: heat = 0.05
    elif t <= 90: heat = 0.07
    else: heat = 0.10
    humid = 0.02 if h >= 80 else (0.01 if h >= 60 else 0.00)
    return 1 + heat + humid

def pace_bands(base_min, kind):
    if kind in ["Easy","Recovery"]:
        return base_min + 0.25, base_min, base_min - 0.25
    else:
        return base_min + 0.17, base_min, base_min - 0.17

def adjust_with_weather(min_per_mile, t, h):
    return min_per_mile * heat_humidity_factor(t, h)

def fueling_for_run(desc):
    m = re.search(r"\d+", desc)
    if not m: return "Rest day"
    miles = int(m.group())
    if miles < 5:
        return "Pre: 12 oz water; no fuel needed"
    elif miles <= 8:
        return "Pre: 12–16 oz water; 20g carbs pre; Hydrate if >70°F"
    elif miles <= 12:
        return "Pre: 12–16 oz + electrolytes; 20–30g carbs pre; 3–5 oz water q20m; 20g carbs halfway"
    else:
        return "Pre: 12–16 oz + electrolytes; 30–40g carbs pre; 3–5 oz water q15–20m; 20–30g carbs q30–40m"

def current_week_and_day(start):
    today = date.today()
    delta_days = (today - start).days
    if delta_days < 0:
        return 1, "Mon"
    week = min(12, delta_days // 7 + 1)
    day_index = delta_days % 7
    days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    return week, days[day_index]

# ---------- Default Plan ----------
days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
default_runs = [
    ["ER 5 mi (Easy)", "TR 5–6 mi (Tempo)", "MR 6–7 mi (Easy)", "SR 5 mi (8×400m)", "ER 5 mi (Easy)", "LR 8–10 mi (Easy)", "Rest"],
    ["ER 5 mi (Easy)", "TR 5–6 mi (Tempo)", "MR 6–7 mi (Easy)", "SR 5 mi (8×400m)", "ER 5 mi (Easy)", "LR 8–10 mi (Easy)", "Rest"],
    ["ER 5 mi (Easy)", "TR 5–6 mi (Tempo)", "MR 6–7 mi (Easy)", "SR 5 mi (8×400m)", "ER 5 mi (Easy)", "LR 9–11 mi (Easy)", "Rest"],
    ["ER 5 mi (Easy)", "TR 5–6 mi (Tempo)", "MR 6–7 mi (Easy)", "SR 5 mi (8×400m)", "ER 5 mi (Easy)", "LR 10 mi (Easy)", "Rest"],
    ["ER 5 mi (Easy)", "TR 7 mi (Tempo)", "MR 8 mi (Last 2 @ MP)", "SR 6 mi (6×800m)", "ER 5 mi (Easy)", "LR 12 mi (Last 3 @ MP)", "Rest"],
    ["ER 5 mi (Easy)", "TR 7 mi (Tempo)", "MR 8 mi (Last 2 @ MP)", "SR 6 mi (6×800m)", "ER 5 mi (Easy)", "LR 13 mi (Last 3 @ MP)", "Rest"],
    ["ER 5 mi (Easy)", "TR 7 mi (Tempo)", "MR 8 mi (Last 2 @ MP)", "SR 6 mi (6×800m)", "ER 5 mi (Easy)", "LR 14 mi (Last 3 @ MP)", "Rest"],
    ["ER 5 mi (Easy)", "TR 7 mi (Tempo)", "MR 8 mi (Last 2 @ MP)", "SR 6 mi (6×800m)", "ER 5 mi (Easy)", "LR 15 mi (Last 3 @ MP)", "Rest"],
    ["ER 5 mi (Easy)", "TR 8 mi (Tempo)", "MR 9 mi (Last 3 @ MP)", "SR 6 mi (10×400m)", "ER 5 mi (Easy)", "LR 18 mi (Last 4 @ MP)", "Rest"],
    ["ER 5 mi (Easy)", "TR 8 mi (Tempo)", "MR 9 mi (Last 3 @ MP)", "SR 6 mi (10×400m)", "ER 5 mi (Easy)", "LR 20 mi (Last 4 @ MP)", "Rest"],
    ["ER 4 mi (Easy)", "TR 5 mi (Tempo)", "MR 6 mi (Easy)", "SR 4 mi (6×400m)", "ER 4 mi (Easy)", "LR 10–12 mi (Easy)", "Rest"],
    ["ER 4 mi (Easy)", "TR 5 mi (Tempo)", "MR 6 mi (Easy)", "SR 4 mi (6×400m)", "ER 4 mi (Easy)", "LR 6 mi (Easy)", "Rest"]
]

# Load custom plan (if any)
saved = get_setting("custom_plan_json", None)
plan_runs = json.loads(saved) if saved else default_runs

# ---------- Header ----------
st.markdown('<div class="metric">🏁 Race: <strong>{}</strong> &nbsp; | &nbsp; 🌡️ Weather adj: <strong>{:.0f}%</strong></div>'.format(
    race_date.strftime("%b %d, %Y"), (heat_humidity_factor(temp, humidity)-1)*100
), unsafe_allow_html=True)
st.markdown("<div class='divider'></div>", unsafe_allow_html=True)

# ---------- Tabs ----------
tab_today, tab_builder, tab_run, tab_lift, tab_charts, tab_logs = st.tabs(["Today","Builder","Running Plan","Lifting Plan","Charts","Logs"])

# ---------- Today ----------
with tab_today:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("Today")
    wk, day = current_week_and_day(start_date)
    st.caption(f"Week {wk} • {day}")
    desc = plan_runs[wk-1][["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].index(day)]
    def base_pace_for_desc(desc):
        d = desc.lower()
        if "tempo" in d:   return "Tempo", mmss_to_min(tempo_base)
        if "mp" in d:      return "MP", mmss_to_min(goal_mp)
        if "recovery" in d:return "Recovery", mmss_to_min(recovery_base)
        if "easy" in d:    return "Easy", mmss_to_min(easy_base)
        if "400" in d or "800" in d: return "Speed", mmss_to_min(speed_base)
        return "", None
    kind, base = base_pace_for_desc(desc)
    if base is not None:
        cons, targ, aggr = pace_bands(base, kind)
        cons_w = adjust_with_weather(cons, temp, humidity)
        targ_w = adjust_with_weather(targ, temp, humidity)
        aggr_w = adjust_with_weather(aggr, temp, humidity)
        c1, c2 = st.columns([1,1])
        with c1:
            st.write("**Planned Run**")
            st.write(desc)
            st.write(f"Type: `{kind}`")
            st.write(f"Cool Bands: **{min_to_mmss(cons)} · {min_to_mmss(targ)} · {min_to_mmss(aggr)}**")
            st.write(f"Heat Bands: **{min_to_mmss(cons_w)} · {min_to_mmss(targ_w)} · {min_to_mmss(aggr_w)}**")
            st.write(f"Fueling: {fueling_for_run(desc)}")
        with c2:
            st.write("**Quick Log**")
            dcol1, dcol2 = st.columns(2)
            with dcol1:
                actual_distance = st.number_input("Distance (mi)", min_value=0.0, step=0.1, value=0.0, key="qd")
                actual_pace = st.text_input("Actual Pace (mm:ss)", value="", key="qp")
            with dcol2:
                rpe = st.slider("RPE", 1, 10, 7, key="qr")
                notes = st.text_area("Notes", height=100, key="qn")
            if st.button("Save Run Log", key="save_quick"):
                add_run_log(date.today(), kind, desc, min_to_mmss(targ), min_to_mmss(targ_w),
                            actual_distance, actual_pace, int(rpe), notes)
                st.success("Saved run log.")
    else:
        st.info("Rest day. Consider mobility or full recovery.")
    st.markdown('</div>', unsafe_allow_html=True)

# ---------- Builder (Editable Plan) ----------
with tab_builder:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("Editable Plan Builder")
    st.caption("Edit any cell. Click **Save Plan** to persist. Use the template format (e.g., `TR 5–6 mi (Tempo)`).")

    rows = []
    for w in range(12):
        for i, dname in enumerate(days):
            rows.append({"Week": w+1, "Day": dname, "Run": plan_runs[w][i]})
    df_edit = pd.DataFrame(rows)
    edited = st.data_editor(df_edit, use_container_width=True, num_rows="fixed", key="builder")

    if st.button("Save Plan"):
        new_plan = [["" for _ in range(7)] for _ in range(12)]
        for _, r in edited.iterrows():
            w = int(r["Week"]) - 1
            d = days.index(r["Day"])
            new_plan[w][d] = r["Run"]
        set_setting("custom_plan_json", json.dumps(new_plan))
        plan_runs = new_plan
        st.success("Plan saved. Changes will reflect across the app.")
    st.markdown('</div>', unsafe_allow_html=True)

# ---------- Running Plan Tab ----------
with tab_run:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("Running Plan (12 Weeks)")
    def base_pace_for_desc(desc):
        d = desc.lower()
        if "tempo" in d:   return "Tempo", mmss_to_min(tempo_base)
        if "mp" in d:      return "MP", mmss_to_min(goal_mp)
        if "recovery" in d:return "Recovery", mmss_to_min(recovery_base)
        if "easy" in d:    return "Easy", mmss_to_min(easy_base)
        if "400" in d or "800" in d: return "Speed", mmss_to_min(speed_base)
        return "", None
    rows = []
    for w in range(12):
        for i, dname in enumerate(days):
            desc = plan_runs[w][i]
            kind, base = base_pace_for_desc(desc)
            if base is None:
                rows.append([w+1, dname, desc, "", "", "", "", "", "Rest day"])
                continue
            cons, targ, aggr = pace_bands(base, kind)
            cons_w = adjust_with_weather(cons, temp, humidity)
            targ_w = adjust_with_weather(targ, temp, humidity)
            aggr_w = adjust_with_weather(aggr, temp, humidity)
            rows.append([
                w+1, dname, desc, kind,
                f"{min_to_mmss(cons)} · {min_to_mmss(targ)} · {min_to_mmss(aggr)}",
                f"{min_to_mmss(cons_w)} · {min_to_mmss(targ_w)} · {min_to_mmss(aggr_w)}",
                min_to_mmss(targ), min_to_mmss(targ_w),
                fueling_for_run(desc)
            ])
    run_df = pd.DataFrame(rows, columns=["Week","Day","Run","Type","Bands (Cool)","Bands (Heat-Adj)","Target (Cool)","Target (Heat-Adj)","Fueling"])
    st.dataframe(run_df, use_container_width=True, height=520)
    st.download_button("⬇️ Download Running Plan (CSV)", run_df.to_csv(index=False).encode("utf-8"), "running_plan.csv", "text/csv")
    st.markdown('</div>', unsafe_allow_html=True)

# ---------- Lifting Plan Tab (same as v3 for brevity) ----------
with tab_lift:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("Lifting Plan (3×8, RPE-based Auto-Progression)")
    inc_upper = int(get_setting("inc_upper","5")); inc_lower = int(get_setting("inc_lower","10")); inc_assist = int(get_setting("inc_assist","5"))
    push_ex = [("Incline Chest Press (Machine)", 35, "upper", False),
               ("Shoulder Press (Machine)", 35, "upper", False),
               ("Assisted Chest Dips", 60, "upper", True)]
    pull_ex = [("Seated Rows (Machine)", 90, "upper", False),
               ("Assisted Pull-ups/Chin-ups", 60, "upper", True),
               ("Lat Pulldowns (Machine)", 75, "upper", False)]
    leg_ex  = [("Leg Press (Machine)", 160, "lower", False),
               ("Hamstring Curl (Machine)", 60, "lower", False),
               ("Calf Raises (Machine)", 45, "lower", False),
               ("Ab Work (Minor)", 0, "lower", False)]

    def next_weight(current, rpe, region, is_assist):
        if rpe <= 7:
            if is_assist: return max(0, current - inc_assist)
            return current + (inc_lower if region=="lower" else inc_upper)
        return current

    def build_cycle(ex_list):
        weeks = list(range(1,13))
        data = {"Exercise":[e for e,_,_,_ in ex_list]}
        weights = [w for _,w,_,_ in ex_list]
        for wk in weeks:
            data[f"Week {wk} (Weight)"] = weights.copy()
            data[f"Week {wk} (RPE)"] = [7]*len(ex_list)
            weights = [next_weight(w, 7, region, is_assist) for (name,w0,region,is_assist), w in zip(ex_list, weights)]
        return pd.DataFrame(data)

    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("**Push**"); df_push = build_cycle(push_ex); st.dataframe(df_push, use_container_width=True, height=420)
    with c2:
        st.markdown("**Pull**"); df_pull = build_cycle(pull_ex); st.dataframe(df_pull, use_container_width=True, height=420)
    with c3:
        st.markdown("**Legs**"); df_leg = build_cycle(leg_ex); st.dataframe(df_leg, use_container_width=True, height=420)
    st.download_button("⬇️ Push (CSV)", df_push.to_csv(index=False).encode("utf-8"), "push_plan.csv", "text/csv")
    st.download_button("⬇️ Pull (CSV)", df_pull.to_csv(index=False).encode("utf-8"), "pull_plan.csv", "text/csv")
    st.download_button("⬇️ Legs (CSV)", df_leg.to_csv(index=False).encode("utf-8"), "leg_plan.csv", "text/csv")
    st.markdown('</div>', unsafe_allow_html=True)

# ---------- Charts Tab ----------
with tab_charts:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("Charts")

    # 1) Planned weekly mileage (roughly parsed from plan)
    def miles_from_desc(desc):
        nums = re.findall(r"\d+", desc.replace("–","-"))
        if not nums: return 0.0
        # handle ranges like 8–10 -> average
        if "–" in desc or "-" in desc:
            try:
                parts = re.split(r"[–-]", desc)
                vals = [float(re.search(r"\d+", p).group()) for p in parts if re.search(r"\d+", p)]
                if len(vals)>=2: return sum(vals[:2])/2.0
            except: pass
        return float(nums[0])

    weekly = []
    for w in range(12):
        total = 0.0
        for d in plan_runs[w]:
            if "Rest" in d: continue
            total += miles_from_desc(d)
        weekly.append(total)
    week_idx = list(range(1,13))
    df_week = pd.DataFrame({"Week": week_idx, "Planned Mileage": weekly})
    st.line_chart(df_week.set_index("Week"))

    # 2) Optional: Pace vs Temp scatter (from logs if DB connected) — placeholder using settings temp
    st.caption("Note: Add more charts (RPE trend, pace vs. temp) once logs accumulate in the database.")
    st.markdown('</div>', unsafe_allow_html=True)

# ---------- Logs Tab ----------
with tab_logs:
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.subheader("Logs")
    st.caption("Save to Postgres (if connected).")

    colA, colB = st.columns(2)
    with colA:
        st.markdown("**Run Log**")
        log_date = st.date_input("Date", value=date.today(), key="run_date")
        run_type = st.selectbox("Run Type", ["Easy","Recovery","MP","Tempo","Speed"])
        planned_desc = st.text_input("Planned Description", value="")
        target_pace_cool = st.text_input("Target Pace (Cool, mm:ss)", value="")
        target_pace_heat = st.text_input("Target Pace (Heat-Adj, mm:ss)", value="")
        actual_distance = st.number_input("Actual Distance (mi)", min_value=0.0, step=0.1)
        actual_pace = st.text_input("Actual Pace (mm:ss)", value="")
        rpe_run = st.slider("RPE", 1, 10, 7)
        notes_run = st.text_area("Run Notes", height=100)
        if st.button("Save Run to DB"):
            add_run_log(log_date, run_type, planned_desc, target_pace_cool, target_pace_heat,
                        actual_distance, actual_pace, int(rpe_run), notes_run)
            st.success("Saved run to DB.")

    with colB:
        st.markdown("**Lift Log**")
        log_date2 = st.date_input("Date", value=date.today(), key="lift_date")
        day_type = st.selectbox("Day Type", ["Push","Pull","Legs"])
        exercise = st.text_input("Exercise", value="")
        weight = st.number_input("Weight (lb)", min_value=0.0, step=5.0)
        sets = st.number_input("Sets", min_value=1, max_value=10, value=3)
        reps = st.number_input("Reps", min_value=1, max_value=20, value=8)
        rpe_lift = st.slider("RPE ", 1, 10, 7, key="rpe_lift")
        notes_lift = st.text_area("Lift Notes", height=100, key="lift_notes")
        if st.button("Save Lift to DB"):
            add_lift_log(log_date2, day_type, exercise, weight, sets, reps, int(rpe_lift), notes_lift)
            st.success("Saved lift to DB.")

    st.markdown('</div>', unsafe_allow_html=True)
