"""Stage 5: Incident Reporter.

Writes standard JSON alerts (alert.json) and prints a high-impact CLI console summary.
"""

import json
from datetime import datetime

def generate_report(groups: list[dict], parse_summary: dict) -> None:
    """Writes alert.json to disk and prints a premium console summary.

    Args:
        groups: List of enriched incident groups from Stage 4.
        parse_summary: Log parsing metadata from Stage 1.
    """
    now = datetime.now()
    generated_at_iso = now.isoformat() + "Z"
    generated_at_pretty = now.strftime("%Y-%m-%d %H:%M:%S")

    # Generate a unique alert ID based on today's date
    alert_id = f"{now.strftime('%Y-%m-%d')}-001"

    # Compute overall alert severity (CRITICAL if any incident group is CRITICAL)
    has_critical = any(g["severity"] == "CRITICAL" for g in groups)
    overall_severity = "CRITICAL" if has_critical else "WARNING"

    incidents = []
    for g in groups:
        incident = {
            "group_id": g["group_id"],
            "endpoint": g["endpoint"],
            "failure_type": g["failure_type"],
            "severity": g["severity"],
            "occurrences": g["occurrences"],
            "first_seen": g["first_seen"],
            "last_seen": g["last_seen"],
            "likely_causes": g["likely_causes"],
            "recommended_actions": g["recommended_actions"]
        }
        
        if "latency" in g["failure_type"]:
            incident["baseline_ms"] = g["baseline"]
            incident["peak_ms"] = g["peak"]
        else:
            incident["baseline_error_rate_pct"] = g["baseline"]
            incident["peak_error_rate_pct"] = g["peak"]
            
        incidents.append(incident)

    alert_json = {
        "alert_id": alert_id,
        "generated_at": generated_at_iso,
        "total_incidents": len(groups),
        "severity": overall_severity,
        "incidents": incidents
    }

    # Write alert.json to disk
    alert_path = "alert.json"
    with open(alert_path, 'w', encoding='utf-8') as f:
        json.dump(alert_json, f, indent=2)

    # Calculate statistics for console output
    valid_count = parse_summary.get("valid", 0)
    skipped_count = parse_summary.get("skipped", 0)
    total_anomalies = sum(g["occurrences"] for g in groups)

    # Print Elegant CLI Console Summary
    print("\n=== API FAILURE AGENT REPORT ===")
    print(f"Generated: {generated_at_pretty}")
    print(f"Parsed: {valid_count} valid logs ({skipped_count} skipped)")
    print(f"Anomalies found: {total_anomalies}\n")

    # Print each incident group
    for g in groups:
        sev_badge = f"{g['severity']:<9}"
        endpoint = f"{g['endpoint']:<20}"
        fail_type = f"{g['failure_type']:<18}"
        
        if "latency" in g["failure_type"]:
            metrics = f"({g['occurrences']}x, {g['baseline']}ms -> {g['peak']}ms)"
        else:
            metrics = f"({g['occurrences']}x, {g['baseline']}% -> {g['peak']}% errors)"
            
        print(f"{sev_badge} {endpoint} {fail_type} {metrics}")

    # Gather top recommended actions
    print("\nTop recommended checks:")
    rec_count = 1
    for g in groups:
        actions = g.get("recommended_actions", [])
        if actions:
            # Print the primary/first recommended action for this endpoint failure
            print(f"{rec_count}. {actions[0]} — {g['endpoint']}")
            rec_count += 1
            
    print("================================")
    print(f"Report written to '{alert_path}'.\n")
