"""Test runner to verify Stage 4 Root Cause Analyzer (analyzer.py) functionality."""

import os
from analyzer import explain_causes

def run_tests():
    print("=========================================")
    print("RUNNING ANALYZER TESTS")
    print("=========================================\n")

    # Clear environment variables to ensure local offline diagnostics run predictably
    original_gemini = os.environ.get("GEMINI_API_KEY")
    original_anthropic = os.environ.get("ANTHROPIC_API_KEY")
    
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]
    if "ANTHROPIC_API_KEY" in os.environ:
        del os.environ["ANTHROPIC_API_KEY"]

    try:
        # Test 1: Latency Spike Offline Diagnostics
        print("--- Test 1: Latency Spike Offline Engine Run ---")
        latency_group = {
            "group_id": "sha1hash",
            "endpoint": "/payment/process",
            "failure_type": "latency_spike",
            "occurrences": 3,
            "severity": "CRITICAL",
            "first_seen": "2024-06-15T10:00:00Z",
            "last_seen": "2024-06-15T10:02:00Z",
            "baseline": 100.0,
            "peak": 2500.0,
            "co_occurring": False
        }
        enriched = explain_causes(latency_group)
        print(f"Enriched: {enriched}")
        assert len(enriched["likely_causes"]) == 3
        assert len(enriched["recommended_actions"]) == 3
        assert "database connection pool" in enriched["likely_causes"][0]
        print("[PASS] Test 1 Passed.\n")

        # Test 2: Error Rate Spike Offline Diagnostics
        print("--- Test 2: Error Rate Spike Offline Engine Run ---")
        error_group = {
            "group_id": "sha1hash2",
            "endpoint": "/auth/login",
            "failure_type": "error_rate_spike",
            "occurrences": 5,
            "severity": "WARNING",
            "first_seen": "2024-06-15T10:10:00Z",
            "last_seen": "2024-06-15T10:12:00Z",
            "baseline": 0.0,
            "peak": 25.0,
            "co_occurring": False
        }
        enriched = explain_causes(error_group)
        print(f"Enriched: {enriched}")
        assert len(enriched["likely_causes"]) == 3
        assert len(enriched["recommended_actions"]) == 3
        assert "deployment" in enriched["likely_causes"][0]
        print("[PASS] Test 2 Passed.\n")

        # Test 3: Shared Infrastructure Warning Injection (co_occurring=True)
        print("--- Test 3: Co-occurring Shared Infrastructure Diagnostics ---")
        co_group = {
            "group_id": "sha1hash3",
            "endpoint": "/payment/process",
            "failure_type": "latency_spike",
            "occurrences": 1,
            "severity": "CRITICAL",
            "first_seen": "2024-06-15T10:00:00Z",
            "last_seen": "2024-06-15T10:00:00Z",
            "baseline": 100.0,
            "peak": 2500.0,
            "co_occurring": True
        }
        enriched = explain_causes(co_group)
        print(f"Enriched Co-occurring: {enriched}")
        assert len(enriched["likely_causes"]) == 3
        assert len(enriched["recommended_actions"]) == 3
        assert "shared dependency degradation" in enriched["likely_causes"][0]
        assert "Correlate server logs" in enriched["recommended_actions"][0]
        print("[PASS] Test 3 Passed.\n")

        # Test 4: Faulty API Key Resiliency (Should Fallback Silently)
        print("--- Test 4: Invalid API Key Failure Resilience ---")
        os.environ["GEMINI_API_KEY"] = "invalid_dummy_key"
        # We try explaining, it should throw an API exception during genai call,
        # but our code must catch it cleanly, print warning, and fallback to offline engine!
        enriched = explain_causes(latency_group)
        assert len(enriched["likely_causes"]) == 3
        assert len(enriched["recommended_actions"]) == 3
        assert "database connection pool" in enriched["likely_causes"][0]
        print("[PASS] Test 4 Passed.\n")

    finally:
        # Restore original environment
        if original_gemini:
            os.environ["GEMINI_API_KEY"] = original_gemini
        else:
            if "GEMINI_API_KEY" in os.environ:
                del os.environ["GEMINI_API_KEY"]

        if original_anthropic:
            os.environ["ANTHROPIC_API_KEY"] = original_anthropic
        else:
            if "ANTHROPIC_API_KEY" in os.environ:
                del os.environ["ANTHROPIC_API_KEY"]

    print("=========================================")
    print("ALL ANALYZER TESTS PASSED SUCCESSFULLY! (OK)")
    print("=========================================")

if __name__ == "__main__":
    run_tests()
