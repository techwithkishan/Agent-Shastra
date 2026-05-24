"""Test runner to verify Stage 2 Anomaly Detector (detector.py) functionality and the 4 condition gates."""

import os
from parser import parse_logs
from detector import detect_anomalies, _mean, _stdev

def run_tests():
    print("=========================================")
    print("RUNNING DETECTOR & ROBUSTNESS TESTS")
    print("=========================================\n")

    logs_dir = "sample_logs"

    # -------------------------------------------------------------
    # TEST 1: Normal healthy logs (should have 0 anomalies)
    # -------------------------------------------------------------
    normal_path = os.path.join(logs_dir, "normal.json")
    print(f"--- Test 1: Normal Logs ({normal_path}) ---")
    logs, _ = parse_logs(normal_path)
    anomalies = detect_anomalies(logs)
    print(f"Detected anomalies count: {len(anomalies)}")
    assert len(anomalies) == 0, f"Expected 0 anomalies, got {len(anomalies)}"
    print("[PASS] Test 1 Passed.\n")

    # -------------------------------------------------------------
    # TEST 2: Latency spike logs (should detect 1 latency spike)
    # -------------------------------------------------------------
    spike_path = os.path.join(logs_dir, "latency_spike.json")
    print(f"--- Test 2: Latency Spike Logs ({spike_path}) ---")
    logs, _ = parse_logs(spike_path)
    anomalies = detect_anomalies(logs)
    print(f"Detected anomalies: {anomalies}")
    assert len(anomalies) == 1, f"Expected 1 anomaly, got {len(anomalies)}"
    anomaly = anomalies[0]
    assert anomaly["type"] == "latency_spike"
    assert anomaly["endpoint"] == "/payment/process"
    assert anomaly["current"] == 2500.0
    assert anomaly["severity"] == "CRITICAL"  # 2500ms is >10x baseline mean (~100ms)
    assert anomaly["affected_count"] == 1
    print("[PASS] Test 2 Passed.\n")

    # -------------------------------------------------------------
    # TEST 3: Error rate spike logs (should detect 1 error rate spike)
    # -------------------------------------------------------------
    error_path = os.path.join(logs_dir, "error_rate.json")
    print(f"--- Test 3: Error Rate Spike Logs ({error_path}) ---")
    logs, _ = parse_logs(error_path)
    anomalies = detect_anomalies(logs)
    print(f"Detected anomalies: {anomalies}")
    assert len(anomalies) == 1, f"Expected 1 anomaly, got {len(anomalies)}"
    anomaly = anomalies[0]
    assert anomaly["type"] == "error_rate_spike"
    assert anomaly["endpoint"] == "/auth/login"
    assert anomaly["current"] == 50.0  # 5 errors in 10 logs = 50%
    assert anomaly["baseline"] == 0.0
    assert anomaly["severity"] == "CRITICAL"
    assert anomaly["affected_count"] == 5
    print("[PASS] Test 3 Passed.\n")

    # -------------------------------------------------------------
    # TEST 4: Multi-endpoint logs (payment normal, auth broken, order noisy)
    # -------------------------------------------------------------
    multi_path = os.path.join(logs_dir, "multi_endpoint.json")
    print(f"--- Test 4: Multi Endpoint Logs ({multi_path}) ---")
    logs, _ = parse_logs(multi_path)
    anomalies = detect_anomalies(logs)
    print(f"Detected anomalies: {anomalies}")
    # ONLY /auth/login should trigger since payment is healthy and order is noisy but normal
    assert len(anomalies) == 1, f"Expected exactly 1 anomaly, got {len(anomalies)}"
    assert anomalies[0]["endpoint"] == "/auth/login"
    assert anomalies[0]["type"] == "error_rate_spike"
    print("[PASS] Test 4 Passed.\n")

    # -------------------------------------------------------------
    # TEST 5: Under-sampled logs (should skip gracefully)
    # -------------------------------------------------------------
    print("--- Test 5: Under-sampled Logs ---")
    short_logs = [
        {"timestamp": "2024-06-15T10:00:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:01:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 2500.0, "service": "payment-api"}
    ]
    anomalies = detect_anomalies(short_logs)
    print(f"Detected anomalies under-sampled: {anomalies}")
    assert len(anomalies) == 0, f"Expected 0 anomalies, got {len(anomalies)}"
    print("[PASS] Test 5 Passed.\n")

    # -------------------------------------------------------------
    # TEST 6: Current included in baseline? (Expected: NO)
    # -------------------------------------------------------------
    print("--- Test 6: Baseline Isolation Verification (No Leakage) ---")
    base_logs = [
        {"timestamp": "2024-06-15T10:00:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:01:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:02:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:03:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:04:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
    ]
    # Calculate baseline values on base logs
    latencies = [l["latency_ms"] for l in base_logs]
    expected_mean = _mean(latencies)
    expected_std = _stdev(latencies, expected_mean)

    # Now append a massive spike at the end
    test_logs = base_logs + [
        {"timestamp": "2024-06-15T10:05:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 5000.0, "service": "payment-api"}
    ]
    anomalies = detect_anomalies(test_logs)
    assert len(anomalies) == 1
    anomaly = anomalies[0]
    # Assert that the baseline returned by detector matches historical expected mean before the spike was appended
    assert anomaly["baseline"] == expected_mean, f"Baseline leaked! Expected {expected_mean}, got {anomaly['baseline']}"
    print("Verified: Baseline calculations are 100% isolated. Current spike excluded from baseline.")
    print("[PASS] Test 6 Passed.\n")

    # -------------------------------------------------------------
    # TEST 7: Single outlier (Expected: WARNING)
    # -------------------------------------------------------------
    print("--- Test 7: Single Outlier Severity Assessment (Expected: WARNING) ---")
    # Introduce small variance so standard deviation is not 0 (which would trigger the zero-variance 5x absolute mean fallback)
    outlier_logs = [
        {"timestamp": "2024-06-15T10:00:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 98.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:01:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 102.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:02:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 99.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:03:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 101.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:04:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        # 300ms is a spike (3x mean) but below 10x mean threshold, so must trigger WARNING
        {"timestamp": "2024-06-15T10:05:00Z", "endpoint": "/payment/process", "status": 200, "latency_ms": 300.0, "service": "payment-api"}
    ]
    anomalies = detect_anomalies(outlier_logs)
    assert len(anomalies) == 1
    assert anomalies[0]["severity"] == "WARNING", f"Expected WARNING for 3x spike, got {anomalies[0]['severity']}"
    print("Verified: Single 3x outlier triggers WARNING severity (not CRITICAL).")
    print("[PASS] Test 7 Passed.\n")

    # -------------------------------------------------------------
    # TEST 8: 50% malformed logs (Expected: No crash)
    # -------------------------------------------------------------
    malformed_path = os.path.join(logs_dir, "malformed.json")
    print(f"--- Test 8: 50% Malformed Logs ({malformed_path}) ---")
    # This file has 3 valid logs and 9 malformed logs. 
    # The parser must parse the valid logs cleanly without throwing any exceptions.
    logs, summary = parse_logs(malformed_path)
    print(f"Summary: {summary}")
    assert summary["valid"] == 3
    assert summary["skipped"] == 9
    anomalies = detect_anomalies(logs)
    print(f"Anomalies from malformed logs run: {anomalies}")
    # Short logs will bypass latency / error rate check due to under-sampling -> no anomalies
    assert len(anomalies) == 0
    print("Verified: 50%+ malformed entries parsed and evaluated cleanly without crashing.")
    print("[PASS] Test 8 Passed.\n")

    # -------------------------------------------------------------
    # TEST 9: One endpoint noisy (Expected: No false positive)
    # -------------------------------------------------------------
    print("--- Test 9: Noisy Endpoint Variance Handling (Expected: No False Positive) ---")
    # Highly oscillating/noisy endpoint: latencies 100 and 200 alternating
    noisy_logs = [
        {"timestamp": "2024-06-15T10:00:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:01:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 200.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:02:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:03:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 200.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:04:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:05:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 200.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:06:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:07:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 200.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:08:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 100.0, "service": "payment-api"},
        {"timestamp": "2024-06-15T10:09:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 200.0, "service": "payment-api"},
        # 220ms is noisy, but standard deviation is high (~52.7ms), so mean + 2*std = 150 + 105.4 = 255.4ms threshold.
        # Thus, 220ms should NOT trigger an anomaly.
        {"timestamp": "2024-06-15T10:10:00Z", "endpoint": "/noisy", "status": 200, "latency_ms": 220.0, "service": "payment-api"}
    ]
    anomalies = detect_anomalies(noisy_logs)
    print(f"Detected anomalies on noisy endpoint: {anomalies}")
    assert len(anomalies) == 0, "Noisy variation triggered false positive spike!"
    print("Verified: Noisy baseline variance accurately calculated. Zero false positives on noisy endpoints.")
    print("[PASS] Test 9 Passed.\n")

    # -------------------------------------------------------------
    # Scenario A: 40 healthy, 10 failures
    # -------------------------------------------------------------
    print("--- Test 10: Scenario A (40 healthy, 10 failures) ---")
    scenario_a_logs = []
    # 40 healthy logs
    for i in range(40):
        scenario_a_logs.append({
            "timestamp": f"2024-06-15T10:{i:02d}:00Z",
            "endpoint": "/scenario-a",
            "status": 200,
            "latency_ms": 50.0,
            "service": "test-service"
        })
    # 10 failures
    for i in range(10):
        scenario_a_logs.append({
            "timestamp": f"2024-06-15T11:{i:02d}:00Z",
            "endpoint": "/scenario-a",
            "status": 500,
            "latency_ms": 50.0,
            "service": "test-service"
        })
    anomalies = detect_anomalies(scenario_a_logs)
    print(f"Detected anomalies: {anomalies}")
    assert len(anomalies) == 1
    anomaly = anomalies[0]
    assert anomaly["type"] == "error_rate_spike"
    assert anomaly["baseline"] == 0.0
    assert anomaly["current"] == 100.0
    assert anomaly["severity"] == "CRITICAL"
    print("[PASS] Scenario A Passed.\n")

    # -------------------------------------------------------------
    # Scenario B: old failures, recent healthy
    # -------------------------------------------------------------
    print("--- Test 11: Scenario B (old failures, recent healthy) ---")
    scenario_b_logs = []
    # 40 failures
    for i in range(40):
        scenario_b_logs.append({
            "timestamp": f"2024-06-15T10:{i:02d}:00Z",
            "endpoint": "/scenario-b",
            "status": 500,
            "latency_ms": 50.0,
            "service": "test-service"
        })
    # 10 healthy
    for i in range(10):
        scenario_b_logs.append({
            "timestamp": f"2024-06-15T11:{i:02d}:00Z",
            "endpoint": "/scenario-b",
            "status": 200,
            "latency_ms": 50.0,
            "service": "test-service"
        })
    anomalies = detect_anomalies(scenario_b_logs)
    print(f"Detected anomalies: {anomalies}")
    assert len(anomalies) == 0, f"Expected 0 anomalies, got {len(anomalies)}"
    print("[PASS] Scenario B Passed.\n")

    # -------------------------------------------------------------
    # Scenario C: alternating 200/500
    # -------------------------------------------------------------
    print("--- Test 12: Scenario C (alternating 200/500 latency, followed by 1000ms spike) ---")
    scenario_c_logs = []
    for i in range(10):
        scenario_c_logs.append({
            "timestamp": f"2024-06-15T10:{i:02d}:00Z",
            "endpoint": "/scenario-c",
            "status": 200,
            "latency_ms": 200.0 if i % 2 == 0 else 500.0,
            "service": "test-service"
        })
    # Now add the current spike log
    scenario_c_logs.append({
        "timestamp": "2024-06-15T10:10:00Z",
        "endpoint": "/scenario-c",
        "status": 200,
        "latency_ms": 1000.0,
        "service": "test-service"
    })
    anomalies = detect_anomalies(scenario_c_logs)
    print(f"Detected anomalies: {anomalies}")
    assert len(anomalies) == 1
    anomaly = anomalies[0]
    assert anomaly["type"] == "latency_spike"
    assert anomaly["severity"] == "WARNING"
    print("[PASS] Scenario C Passed.\n")

    # -------------------------------------------------------------
    # Scenario D: latency unaffected
    # -------------------------------------------------------------
    print("--- Test 13: Scenario D (latency unaffected) ---")
    scenario_d_logs = []
    for i in range(10):
        scenario_d_logs.append({
            "timestamp": f"2024-06-15T10:{i:02d}:00Z",
            "endpoint": "/scenario-d",
            "status": 200,
            "latency_ms": 100.0,
            "service": "test-service"
        })
    # Add a recent log with latency 100.0 (unaffected)
    scenario_d_logs.append({
        "timestamp": "2024-06-15T10:10:00Z",
        "endpoint": "/scenario-d",
        "status": 200,
        "latency_ms": 100.0,
        "service": "test-service"
    })
    anomalies = detect_anomalies(scenario_d_logs)
    print(f"Detected anomalies: {anomalies}")
    assert len(anomalies) == 0, f"Expected 0 anomalies, got {len(anomalies)}"
    print("[PASS] Scenario D Passed.\n")

    print("=========================================")
    print("ALL 13 DETECTOR TESTS PASSED SUCCESSFULLY! (OK)")
    print("=========================================")

if __name__ == "__main__":
    run_tests()
