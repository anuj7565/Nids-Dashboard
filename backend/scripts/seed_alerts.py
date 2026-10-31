import json
import random
from pathlib import Path

random.seed(42)

OUT = Path(__file__).resolve().parents[2] / "docs" / "simulated_alerts.json"
END = 1793284092
START = END - 7 * 86400
TARGET = "192.168.201.129"

ATTACK_SERVICES = ["ssh", "telnet", "ftp", "smtp", "http", "http_443",
                   "pop_3", "imap4", "private", "other", "other", "other"]
NORMAL_SERVICES = ["domain_u", "ntp_u", "http", "http_443", "other"]


def make(ts, src, dst, proto, service, flag, label, duration=None):
    if duration is None:
        duration = round(random.random() * 0.01, 6)
    return {
        "timestamp": ts, "src_ip": src, "dst_ip": dst, "duration": duration,
        "protocol_type": proto, "service": service, "flag": flag,
        "predicted_label": label,
    }


events = []

# Normal background traffic
for _ in range(500):
    service = random.choice(NORMAL_SERVICES)
    udp = service in ("domain_u", "ntp_u")
    events.append(make(
        random.randint(START, END),
        f"192.168.201.{random.randint(2, 20)}",
        f"192.168.201.{random.randint(21, 60)}",
        "udp" if udp else "tcp", service,
        "OTH" if udp else "SF", "NORMAL",
        round(random.random() * 5, 4),
    ))

# Scattered attacks from a small pool of external IPs
pool = [f"203.0.113.{n}" for n in range(10, 25)]
for _ in range(250):
    events.append(make(
        random.randint(START, END), random.choice(pool), TARGET, "tcp",
        random.choice(ATTACK_SERVICES),
        random.choice(["S0", "REJ", "RSTO"]), "ATTACK",
    ))

# Bursts: one IP, many alerts inside 40 seconds
bursts = [
    ("198.51.100.5", 1, 220, ["other"] * 8 + ["ftp", "http"]),
    ("198.51.100.6", 3, 150, ["ssh"]),
    ("198.51.100.7", 5, 180, ["other"] * 5 + ["smtp", "pop_3", "private"]),
    ("198.51.100.8", 6, 120, ["telnet"]),
]
for src, day, count, services in bursts:
    base = START + day * 86400 + random.randint(0, 80000)
    for _ in range(count):
        events.append(make(
            base + random.randint(0, 40), src, TARGET, "tcp",
            random.choice(services), random.choice(["S0", "REJ"]), "ATTACK",
        ))

# Oldest first gets the lowest id, like a real NIDS database
events.sort(key=lambda e: e["timestamp"])
for i, event in enumerate(events, start=1):
    event["id"] = i
events.reverse()  # the NIDS returns newest first

data = {
    "simulated": True,
    "note": "Simulated alerts for demo use. Not real network traffic.",
    "count": len(events),
    "alerts": events,
}
OUT.write_text(json.dumps(data), encoding="utf-8")
print(f"Wrote {len(events)} simulated alerts to {OUT}")