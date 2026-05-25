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

def _compute_window_size(total_logs: int) -> int:
    """Calculates an adaptive window size proportional to the log volume."""
    if total_logs < 20:
        return total_logs // 2
    if total_logs < 100:
        return config.WINDOW_TIER_S
    if total_logs < 500:
        return config.WINDOW_TIER_M
    if total_logs < 2000:
        return config.WINDOW_TIER_L
    return config.WINDOW_TIER_XL

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
            # SRE Fixed-Recent, Adaptive-Baseline Windowing
            if len(ep_logs) < 20:
                eval_size = len(ep_logs) // 2
                current_window = ep_logs[-eval_size:]
                baseline_window = ep_logs[:-eval_size]
            else:
                window_size = _compute_window_size(len(ep_logs))
                eval_size = 10
                current_window = ep_logs[-eval_size:]
                baseline_window = ep_logs[-window_size:-eval_size]

            current_latencies = [l["latency_ms"] for l in current_window]
            current_peak = max(current_latencies)
            current_log = ep_logs[-1]

            if len(baseline_window) >= 2:
                baseline_latencies = [l["latency_ms"] for l in baseline_window]
                b_mean = _mean(baseline_latencies)
                b_std = _stdev(baseline_latencies, b_mean)

                # Threshold: either std-dev based or absolute multiplier
                if b_std == 0.0:
                    threshold = b_mean * config.LATENCY_ABSOLUTE_MULT
                else:
                    threshold = b_mean + (config.LATENCY_STD_MULTIPLIER * b_std)
            else:
                # Fallback: Not enough baseline history — use absolute multiplier on current mean
                b_mean = _mean(current_latencies)
                b_std = 0.0
                threshold = b_mean * config.LATENCY_ABSOLUTE_MULT

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

                    affected_count = sum(1 for l in current_window if l["latency_ms"] > threshold)

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
            # SRE Fixed-Recent, Adaptive-Baseline Windowing
            if len(ep_logs) < 20:
                eval_size = len(ep_logs) // 2
                current_window = ep_logs[-eval_size:]
                baseline_window = ep_logs[:-eval_size]
            else:
                window_size = _compute_window_size(len(ep_logs))
                eval_size = 10
                current_window = ep_logs[-eval_size:]
                baseline_window = ep_logs[-window_size:-eval_size]
                
            current_log = ep_logs[-1]

            current_errors = sum(1 for l in current_window if int(l["status"]) >= 500)
            current_rate = current_errors / len(current_window)

            if len(baseline_window) >= config.ERROR_MIN_SAMPLES:
                baseline_errors = sum(1 for l in baseline_window if int(l["status"]) >= 500)
                baseline_rate = baseline_errors / len(baseline_window)
                is_spike = (
                    current_rate > config.ERROR_RATE_THRESHOLD or
                    current_rate > (baseline_rate + config.ERROR_RATE_DELTA)
                )
            else:
                # Not enough history for baseline comparison - fall back to absolute threshold strictly
                baseline_rate = 0.0
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

