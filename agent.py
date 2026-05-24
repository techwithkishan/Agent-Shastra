"""Main orchestrator entry point for the API Failure Detection & Debugging Agent.

Chains parser, detector, grouper, analyzer, and reporter components in sequence.
"""

import sys
from parser import parse_logs
from detector import detect_anomalies
from grouper import group_failures
from analyzer import explain_causes
from reporter import generate_report

def run(log_file: str) -> None:
    """Orchestrates all 5 stages of the API failure pipeline.

    Args:
        log_file: Path to the log file to parse and analyze.
    """
    print(f"[1/5] Parsing logs: '{log_file}'")
    logs, parse_summary = parse_logs(log_file)
    
    if not logs:
        # Handle empty/corrupt log parsing results gracefully without crashing
        print("No valid logs found. Exiting.")
        return

    print(f"[2/5] Detecting anomalies in {len(logs)} entries...")
    anomalies = detect_anomalies(logs)
    if not anomalies:
        print("No anomalies detected. System appears healthy.")
        return

    print(f"[3/5] Grouping {len(anomalies)} anomalies...")
    groups = group_failures(anomalies)

    print(f"[4/5] Analyzing {len(groups)} incident groups...")
    for group in groups:
        explain_causes(group)

    print(f"[5/5] Generating alert report...")
    generate_report(groups, parse_summary)

if __name__ == "__main__":
    # Command line argument parser with safe default fallback
    log_file = sys.argv[1] if len(sys.argv) > 1 else "sample_logs/latency_spike.json"
    run(log_file)
