import os
import subprocess
import time
import urllib.request

BASE_DIR = r"C:\Users\upasa\.gemini\antigravity\scratch\mars-guard"
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "docs", "screenshots")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

print("1. Starting backend server (FastAPI)...")
backend_proc = subprocess.Popen(
    ["python", "-m", "uvicorn", "app.main:app", "--port", "8000"],
    cwd=BACKEND_DIR,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

print("2. Starting frontend server (Next.js)...")
frontend_proc = subprocess.Popen(
    ["npm.cmd", "run", "start"],
    cwd=FRONTEND_DIR,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

def wait_for_url(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.getcode() == 200:
                    return True
        except Exception:
            time.sleep(1)
    return False

print("Waiting for servers to be healthy...")
b_ok = wait_for_url("http://localhost:8000/api/health", 20)
print(f"Backend healthy: {b_ok}")

f_ok = wait_for_url("http://localhost:3000", 30)
print(f"Frontend healthy: {f_ok}")

PAGES = [
    ("01_home_globe", "http://localhost:3000/"),
    ("02_map_explorer", "http://localhost:3000/explorer"),
    ("03_mission_simulator", "http://localhost:3000/simulation"),
    ("04_route_lab", "http://localhost:3000/planner"),
    ("05_experiment_lab", "http://localhost:3000/experiments"),
    ("06_risk_radar", "http://localhost:3000/risk"),
    ("07_digital_twin", "http://localhost:3000/digital-twin"),
    ("08_data_studio", "http://localhost:3000/datasets"),
    ("09_safety_archive", "http://localhost:3000/history"),
    ("10_live_telemetry", "http://localhost:3000/overview"),
    ("11_mission_report", "http://localhost:3000/reports")
]

print("3. Capturing Desktop & Mobile Screenshots with Headless Chrome...")
perf_results = {}

for name, url in PAGES:
    t0 = time.time()
    # Desktop screenshot (1280x800)
    desktop_out = os.path.join(SCREENSHOTS_DIR, f"{name}_desktop.png")
    cmd_desktop = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size=1280,820",
        f"--screenshot={desktop_out}",
        url
    ]
    subprocess.run(cmd_desktop, timeout=25)
    load_time = round((time.time() - t0) * 1000, 1)
    perf_results[name] = load_time

    # Mobile screenshot (390x844 iPhone 13/14 size)
    mobile_out = os.path.join(SCREENSHOTS_DIR, f"{name}_mobile.png")
    cmd_mobile = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size=390,844",
        f"--screenshot={mobile_out}",
        url
    ]
    subprocess.run(cmd_mobile, timeout=25)
    print(f"Captured {name} (Desktop & Mobile) - Load time: {load_time}ms")

print("\nTerminating server processes...")
try:
    frontend_proc.terminate()
    backend_proc.terminate()
except Exception:
    pass

print("Screenshots captured successfully in docs/screenshots:")
for f in os.listdir(SCREENSHOTS_DIR):
    fpath = os.path.join(SCREENSHOTS_DIR, f)
    print(f" - {f} ({os.path.getsize(fpath):,} bytes)")

print("\nPerformance Summary:")
for k, v in perf_results.items():
    print(f" - {k}: {v}ms")

