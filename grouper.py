"""Stage 3: Failure Grouper and Correlation Engine.

Groups anomalies into incident groups and flags co-occurring multi-service issues.
"""

import hashlib
from datetime import datetime
from collections import defaultdict

def _parse_timestamp(ts: str) -> datetime:
    """Helper to parse normalized ISO-8601 strings safely."""
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))

def group_failures(anomalies: list[dict]) -> list[dict]:
    """Clusters anomalies by (endpoint, type) and detects chronological co-occurrences.

    Args:
        anomalies: List of flagged anomalies from Stage 2.

    Returns:
        A list of aggregated incident group dictionaries.
    """
    if not anomalies:
        return []

    # -------------------------------------------------------------
    # 1. Sliding Window Chronological Co-occurrence check
    # -------------------------------------------------------------
    # Sort anomalies chronologically
    sorted_anomalies = sorted(anomalies, key=lambda a: _parse_timestamp(a["timestamp"]))
    parsed_times = [_parse_timestamp(a["timestamp"]) for a in sorted_anomalies]
    
    co_occurring_keys = set()
    left = 0
    
    # Elegant O(N) sliding window to find any anomalies within a 120-second delta (Issue 4/5)
    for right in range(len(sorted_anomalies)):
        while (parsed_times[right] - parsed_times[left]).total_seconds() > 120.0:
            left += 1
            
        # Extract anomalies in current active window
        window_anomalies = sorted_anomalies[left : right + 1]
        unique_endpoints = {a["endpoint"] for a in window_anomalies}
        
        # If 2+ different endpoints fail in the same window, mark all of them as co-occurring
        if len(unique_endpoints) >= 2:
            for a in window_anomalies:
                co_occurring_keys.add((a["endpoint"], a["type"]))

    # -------------------------------------------------------------
    # 2. Aggregating anomalies by (endpoint, type)
    # -------------------------------------------------------------
    grouped = defaultdict(list)
    for a in anomalies:
        key = (a["endpoint"], a["type"])
        grouped[key].append(a)

    incident_groups = []

    for key, group_anomalies in grouped.items():
        endpoint, failure_type = key
        
        # Chronological details
        parsed_anomalies = sorted(group_anomalies, key=lambda a: _parse_timestamp(a["timestamp"]))
        first_seen = parsed_anomalies[0]["timestamp"]
        last_seen = parsed_anomalies[-1]["timestamp"]
        
        # Rollup Metrics
        occurrences = len(group_anomalies)
        peak_val = max(a["current"] for a in group_anomalies)
        baseline_val = parsed_anomalies[0]["baseline"]  # Baseline from the beginning of the incident
        
        # Severity Rollup (highest severity takes precedence)
        has_critical = any(a["severity"] == "CRITICAL" for a in group_anomalies)
        severity = "CRITICAL" if has_critical else "WARNING"

        # Unique Deterministic Group ID
        # sha1(endpoint + type + first_seen)
        hash_input = f"{endpoint}:{failure_type}:{first_seen}"
        group_id = hashlib.sha1(hash_input.encode("utf-8")).hexdigest()

        # Co-occurrence values
        is_co_occurring = key in co_occurring_keys
        co_note = "co-occurring incidents — check shared infrastructure" if is_co_occurring else ""

        incident_groups.append({
            "group_id": group_id,
            "endpoint": endpoint,
            "failure_type": failure_type,
            "occurrences": occurrences,
            "severity": severity,
            "first_seen": first_seen,
            "last_seen": last_seen,
            "baseline": baseline_val,
            "peak": peak_val,
            "co_occurring": is_co_occurring,
            "co_occurring_note": co_note
        })

    return incident_groups
