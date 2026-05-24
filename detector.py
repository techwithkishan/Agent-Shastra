"""Stage 2: Anomaly Detector.

Analyzes clean logs per endpoint to flag latency spikes and error rate anomalies.
"""

import math
from collections import defaultdict
import config

def _mean(data: list[float]) -> float:
    """Calculates the arithmetic mean of a list of floats."""
    if not data:
        return 0.0
    return sum(data) / len(data)

def _stdev(data: list[float], mean_val: float) -> float:
    """Calculates the sample standard deviation of a list of floats."""
    n = len(data)
    if n <= 1:
        return 0.0
    variance = sum((x - mean_val) ** 2 for x in data) / (n - 1)
    return math.sqrt(variance)

def detect_anomalies(logs: list[dict]) -> list[dict]:
    """Scans log entries for latency spikes and error rate spikes per endpoint.

    Args:
        logs: List of clean parsed log entries from Stage 1.

    Returns:
        A list of anomaly dictionaries.
    """
    anomalies = []

    # SORT FIRST. Always. Logs from real systems arrive out of order.
    logs_sorted = sorted(logs, key=lambda x: x["timestamp"])

    # NOW group by endpoint — order is now chronological
    logs_by_endpoint = defaultdict(list)
    for log in logs_sorted:
        logs_by_endpoint[log["endpoint"]].append(log)

    for endpoint, ep_logs in logs_by_endpoint.items():
        # -------------------------------------------------------------
        # 1. Latency Spike Detection
        # -------------------------------------------------------------
        if len(ep_logs) < config.LATENCY_MIN_SAMPLES:
            print(f"Warning: Insufficient samples for latency check on '{endpoint}' "
                  f"(got {len(ep_logs)}, need {config.LATENCY_MIN_SAMPLES}). Skipping.")
        else:
            # Split into two halves — to prevent spike from contaminating baseline
            midpoint = len(ep_logs) // 2
            older_half = ep_logs[:midpoint]
            newer_half = ep_logs[midpoint:]

            older_latencies = [l["latency_ms"] for l in older_half]
            newer_latencies = [l["latency_ms"] for l in newer_half]

            b_mean = _mean(older_latencies)
            b_std = _stdev(older_latencies, b_mean)

            # Current = peak of the newer half (catches worst case)
            current_peak = max(newer_latencies)
            current_log = ep_logs[-1]  # Reference latest log for timestamp

            # Threshold: either std-dev based or absolute multiplier
            if b_std == 0.0:
                threshold = b_mean * config.LATENCY_ABSOLUTE_MULT
            else:
                threshold = b_mean + (config.LATENCY_STD_MULTIPLIER * b_std)

            if current_peak > threshold:
                relative_increase = current_peak / b_mean if b_mean > 0 else 0
                
                # SRE Safety Guard: Only report anomalies that represent a significant (>=2.0x) increase
                if relative_increase >= 2.0:
                    if relative_increase >= 10.0:
                        severity = "CRITICAL"
                    elif relative_increase >= 5.0:
                        severity = "HIGH"
                    else:
                        severity = "WARNING"

                    affected_count = sum(1 for l in newer_half if l["latency_ms"] > threshold)

                    anomalies.append({
                        "type": "latency_spike",
                        "endpoint": endpoint,
                        "baseline": round(b_mean, 2),
                        "current": round(current_peak, 2),
                        "severity": severity,
                        "timestamp": current_log["timestamp"],
                        "affected_count": affected_count
                    })

        # -------------------------------------------------------------
        # 2. Error Rate Spike Detection
        # -------------------------------------------------------------
        if len(ep_logs) < config.ERROR_MIN_SAMPLES:
            pass
        else:
            window = ep_logs[-config.ERROR_WINDOW:]
            current_log = ep_logs[-1]

            baseline_window = window[:-10]
            current_window = window[-10:]

            # If we don't have enough baseline history, we still evaluate absolute error rate
            baseline_errors = sum(1 for l in baseline_window if int(l["status"]) >= 500) if len(baseline_window) > 0 else 0
            current_errors = sum(1 for l in current_window if int(l["status"]) >= 500)

            baseline_rate = (baseline_errors / len(baseline_window)) if len(baseline_window) > 0 else 0.0
            current_rate = current_errors / len(current_window)

            is_spike = False
            if len(baseline_window) >= 5:
                is_spike = (
                    current_rate > config.ERROR_RATE_THRESHOLD or
                    current_rate > (baseline_rate + config.ERROR_RATE_DELTA)
                )
            else:
                # With under-sampled baseline, trigger strictly on the absolute error threshold
                is_spike = current_rate > config.ERROR_RATE_THRESHOLD

            if is_spike:
                if current_rate >= 0.20:
                    severity = "CRITICAL"
                elif current_rate >= 0.10:
                    severity = "HIGH"
                elif current_rate >= 0.05:
                    severity = "WARNING"
                else:
                    severity = "WARNING"

                anomalies.append({
                    "type": "error_rate_spike",
                    "endpoint": endpoint,
                    "baseline": round(baseline_rate * 100, 2),  # Represent as percentage
                    "current": round(current_rate * 100, 2),
                    "severity": severity,
                    "timestamp": current_log["timestamp"],
                    "affected_count": current_errors
                })

    return anomalies
