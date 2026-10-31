from collections import defaultdict

LEVELS = ["low", "medium", "high", "critical"]
HIGH_SERVICES = {"ssh", "telnet"}
MEDIUM_SERVICES = {"ftp", "smtp", "pop_3", "imap4", "http", "http_443"}
BURST_COUNT = 100
BURST_WINDOW_SECONDS = 60


def base_level(service: str) -> int:
    if service in HIGH_SERVICES:
        return 2
    if service in MEDIUM_SERVICES:
        return 1
    return 0


def assign_severities(rows: list[dict]) -> list[str]:
    # Group row positions by source IP, sorted by time
    by_src = defaultdict(list)
    for index, row in enumerate(rows):
        by_src[row["src_ip"]].append((row["timestamp"], index))

    # Find rows that sit inside a 60-second window holding 100+ alerts
    bursting = set()
    for entries in by_src.values():
        entries.sort()
        end = 0
        for start in range(len(entries)):
            while end < len(entries) and entries[end][0] - entries[start][0] < BURST_WINDOW_SECONDS:
                end += 1
            if end - start >= BURST_COUNT:
                for k in range(start, end):
                    bursting.add(entries[k][1])

    result = []
    for index, row in enumerate(rows):
        if row["predicted_label"] == "NORMAL":
            result.append("low")
            continue
        level = base_level(row["service"])
        if index in bursting:
            level = min(level + 1, len(LEVELS) - 1)
        result.append(LEVELS[level])
    return result