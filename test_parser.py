"""Test runner to verify Stage 1 Log Parser (parser.py) functionality."""

import os
from parser import parse_logs

def run_tests():
    print("=========================================")
    print("RUNNING PARSER TESTS")
    print("=========================================\n")

    logs_dir = "sample_logs"

    # Test 1: Normal healthy logs
    normal_path = os.path.join(logs_dir, "normal.json")
    print(f"--- Test 1: Normal Logs ({normal_path}) ---")
    logs, summary = parse_logs(normal_path)
    print(f"Summary: {summary}")
    assert len(logs) == 12, f"Expected 12 valid entries, got {len(logs)}"
    assert summary["total"] == 12
    assert summary["valid"] == 12
    assert summary["skipped"] == 0
    # Type checking
    assert isinstance(logs[0]["status"], int)
    assert isinstance(logs[0]["latency_ms"], float)
    print("[PASS] Test 1 Passed.\n")

    # Test 2: Latency spike logs
    spike_path = os.path.join(logs_dir, "latency_spike.json")
    print(f"--- Test 2: Latency Spike Logs ({spike_path}) ---")
    logs, summary = parse_logs(spike_path)
    print(f"Summary: {summary}")
    assert len(logs) == 11, f"Expected 11 valid entries, got {len(logs)}"
    assert summary["valid"] == 11
    assert summary["skipped"] == 0
    print("[PASS] Test 2 Passed.\n")

    # Test 3: Malformed logs with invalid records
    malformed_path = os.path.join(logs_dir, "malformed.json")
    print(f"--- Test 3: Malformed Logs ({malformed_path}) ---")
    logs, summary = parse_logs(malformed_path)
    print(f"Summary: {summary}")
    # normal entries = index 0, 1, 11 (3 total)
    # entry 2 is missing timestamp -> skipped
    # entry 3 is missing endpoint -> skipped
    # entry 4 is missing status -> skipped
    # entry 5 is missing latency -> skipped
    # entry 6 has status 99 -> skipped
    # entry 7 has status 600 -> skipped
    # entry 8 has negative latency -> skipped
    # entry 9 has status "OK" -> skipped
    # entry 10 has latency "slow" -> skipped
    assert len(logs) == 3, f"Expected 3 valid entries, got {len(logs)}"
    assert summary["total"] == 12
    assert summary["valid"] == 3
    assert summary["skipped"] == 9
    print("[PASS] Test 3 Passed.\n")

    # Test 4: Missing File Error
    missing_path = os.path.join(logs_dir, "does_not_exist.json")
    print(f"--- Test 4: Non-existent File ({missing_path}) ---")
    logs, summary = parse_logs(missing_path)
    print(f"Summary: {summary}")
    assert len(logs) == 0
    assert "error" in summary
    assert "File not found" in summary["error"]
    print("[PASS] Test 4 Passed.\n")

    # Test 5: Broken JSON syntax
    broken_path = os.path.join(logs_dir, "broken_syntax.json")
    # Write a temporary broken file
    with open(broken_path, "w") as f:
        f.write("[ {this is not valid json} ]")

    try:
        print(f"--- Test 5: Broken Syntax ({broken_path}) ---")
        logs, summary = parse_logs(broken_path)
        print(f"Summary: {summary}")
        assert len(logs) == 0
        assert "error" in summary
        assert "JSON syntax error" in summary["error"]
        print("[PASS] Test 5 Passed.\n")
    finally:
        if os.path.exists(broken_path):
            os.remove(broken_path)

    print("=========================================")
    print("ALL PARSER TESTS PASSED SUCCESSFULLY! (OK)")
    print("=========================================")

if __name__ == "__main__":
    run_tests()
