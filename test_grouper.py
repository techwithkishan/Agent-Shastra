"""Test runner to verify Stage 3 Failure Grouper (grouper.py) functionality."""

import os
import re
from parser import parse_logs
from detector import detect_anomalies
from grouper import group_failures

def is_sha1(val: str) -> bool:
    """Helper to check if a string is a valid SHA-1 hex digest."""
    return bool(re.match(r"^[a-f0-9]{40}$", str(val)))

def run_tests():
    print("=========================================")
    print("RUNNING GROUPER TESTS")
    print("=========================================\n")

    logs_dir = "sample_logs"

    # Test 1: Normal healthy logs (should have 0 groups)
    print("--- Test 1: Normal Logs ---")
    logs, _ = parse_logs(os.path.join(logs_dir, "normal.json"))
    anomalies = detect_anomalies(logs)
    groups = group_failures(anomalies)
    print(f"Group count: {len(groups)}")
    assert len(groups) == 0
    print("[PASS] Test 1 Passed.\n")

    # Test 2: Latency spike logs (1 group, co_occurring=False)
    print("--- Test 2: Latency Spike Logs ---")
    logs, _ = parse_logs(os.path.join(logs_dir, "latency_spike.json"))
    anomalies = detect_anomalies(logs)
    groups = group_failures(anomalies)
    print(f"Groups: {groups}")
    assert len(groups) == 1
    g = groups[0]
    assert g["endpoint"] == "/payment/process"
    assert g["failure_type"] == "latency_spike"
    assert g["occurrences"] == 1
    assert g["co_occurring"] is False
    assert is_sha1(g["group_id"])
    print("[PASS] Test 2 Passed.\n")

    # Test 3: Hardened Multi-endpoint logs (payment normal, order noisy, auth broken -> 1 group, co_occurring=False)
    print("--- Test 3: Multi Endpoint Logs (Single Broken Endpoint) ---")
    logs, _ = parse_logs(os.path.join(logs_dir, "multi_endpoint.json"))
    anomalies = detect_anomalies(logs)
    groups = group_failures(anomalies)
    print(f"Groups: {groups}")
    assert len(groups) == 1
    assert groups[0]["endpoint"] == "/auth/login"
    assert groups[0]["co_occurring"] is False
    print("[PASS] Test 3 Passed.\n")

    # Test 4: Chronological Co-occurring failures (within 2-min window -> co_occurring=True)
    print("--- Test 4: Co-occurring Anomalies (<= 2 min gap) ---")
    mock_anomalies = [
        {
            "type": "latency_spike",
            "endpoint": "/payment/process",
            "baseline": 100.0,
            "current": 2500.0,
            "severity": "CRITICAL",
            "timestamp": "2024-06-15T10:00:00Z",
            "affected_count": 1
        },
        {
            "type": "error_rate_spike",
            "endpoint": "/auth/login",
            "baseline": 0.0,
            "current": 15.0,
            "severity": "WARNING",
            "timestamp": "2024-06-15T10:01:30Z",
            "affected_count": 3
        }
    ]
    groups = group_failures(mock_anomalies)
    print(f"Groups: {groups}")
    assert len(groups) == 2
    for g in groups:
        assert g["co_occurring"] is True
        assert g["co_occurring_note"] == "co-occurring incidents — check shared infrastructure"
        assert is_sha1(g["group_id"])
    print("[PASS] Test 4 Passed.\n")

    # Test 5: Spaced Failures (Ugly test case: > 2 minutes apart -> co_occurring=False)
    print("--- Test 5: Spaced Failures (> 2 min gap) ---")
    logs, _ = parse_logs(os.path.join(logs_dir, "spaced_failures.json"))
    anomalies = detect_anomalies(logs)
    print(f"Flagged anomalies: {anomalies}")
    # Should have 2 anomalies: 1 latency spike on /payment/process (10:10:00Z) and 1 error spike on /auth/login (10:25:40Z)
    assert len(anomalies) == 2
    groups = group_failures(anomalies)
    print(f"Groups: {groups}")
    assert len(groups) == 2
    for g in groups:
        # Since timestamps (10:10 and 10:25) are 15 minutes apart, co_occurring must be False!
        assert g["co_occurring"] is False, f"Leaked co-occurrence! Group {g['endpoint']} marked as co-occurring."
        assert g["co_occurring_note"] == ""
    print("[PASS] Test 5 Passed.\n")

    print("=========================================")
    print("ALL GROUPER TESTS PASSED SUCCESSFULLY! (OK)")
    print("=========================================")

if __name__ == "__main__":
    run_tests()
