"""Stage 1: API Log Parser.

Loads, validates, and cleans JSON API log files. Enforces strict ISO-8601 timestamp validation.
"""

import json
import os
import sys
from datetime import datetime

def is_valid_iso8601(val: str) -> bool:
    """Strictly validates if a string is in ISO-8601 format."""
    try:
        # Cast to string first
        val_str = str(val)
        # Normalize Z to +00:00 for cross-version Python support
        cleaned = val_str.replace('Z', '+00:00')
        datetime.fromisoformat(cleaned)
        return True
    except Exception:
        return False

def parse_logs(file_path: str) -> tuple[list[dict], dict]:
    """Reads a JSON API log file, validates entries, and returns clean logs.

    Args:
        file_path: Absolute or relative path to the JSON log file.

    Returns:
        A tuple of (valid_logs_list, parse_summary_dict).
    """
    summary = {"total": 0, "valid": 0, "skipped": 0}

    # Clean check for file existence
    if not os.path.exists(file_path):
        print(f"Error: File not found at '{file_path}'.", file=sys.stderr)
        return [], {**summary, "error": f"File not found: {file_path}"}

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON in '{file_path}'. Details: {e}", file=sys.stderr)
        return [], {**summary, "error": f"JSON syntax error: {str(e)}"}
    except Exception as e:
        print(f"Error: Unexpected error reading '{file_path}'. Details: {e}", file=sys.stderr)
        return [], {**summary, "error": f"Failed to read file: {str(e)}"}

    if not isinstance(data, list):
        print(f"Error: Log file '{file_path}' must contain a JSON array/list.", file=sys.stderr)
        return [], {**summary, "error": "Log file content is not a list"}

    valid_logs = []
    summary["total"] = len(data)

    for idx, entry in enumerate(data):
        log_label = f"Entry #{idx}"
        
        # Check if entry is a dictionary
        if not isinstance(entry, dict):
            print(f"Warning: Skipping {log_label} because it is not a JSON object.")
            summary["skipped"] += 1
            continue

        # Extract required fields
        timestamp = entry.get("timestamp")
        endpoint = entry.get("endpoint")
        status_raw = entry.get("status")
        latency_raw = entry.get("latency_ms")

        # Check for missing fields
        missing_fields = []
        if timestamp is None: missing_fields.append("timestamp")
        if endpoint is None: missing_fields.append("endpoint")
        if status_raw is None: missing_fields.append("status")
        if latency_raw is None: missing_fields.append("latency_ms")

        if missing_fields:
            print(f"Warning: Skipping {log_label} due to missing fields: {', '.join(missing_fields)}")
            summary["skipped"] += 1
            continue

        # Strict ISO-8601 timestamp check
        if not is_valid_iso8601(timestamp):
            print(f"Warning: Skipping {log_label} (endpoint: {endpoint}) due to non-ISO-8601 timestamp: {timestamp}")
            summary["skipped"] += 1
            continue

        # Validate & cast status
        try:
            status = int(status_raw)
            if status_raw != status:  # e.g., float status 200.5
                raise ValueError("Status must be a whole integer.")
        except (ValueError, TypeError):
            print(f"Warning: Skipping {log_label} (endpoint: {endpoint}) due to invalid status format: {status_raw}")
            summary["skipped"] += 1
            continue

        if not (100 <= status <= 599):
            print(f"Warning: Skipping {log_label} (endpoint: {endpoint}) due to status code out of range [100-599]: {status}")
            summary["skipped"] += 1
            continue

        # Validate & cast latency
        try:
            latency_ms = float(latency_raw)
        except (ValueError, TypeError):
            print(f"Warning: Skipping {log_label} (endpoint: {endpoint}) due to invalid latency format: {latency_raw}")
            summary["skipped"] += 1
            continue

        if latency_ms < 0:
            print(f"Warning: Skipping {log_label} (endpoint: {endpoint}) due to negative latency: {latency_ms}")
            summary["skipped"] += 1
            continue

        # Build clean valid entry
        clean_entry = {
            "timestamp": str(timestamp),
            "endpoint": str(endpoint),
            "status": status,
            "latency_ms": latency_ms,
            "service": str(entry.get("service", "unknown-service"))
        }
        valid_logs.append(clean_entry)
        summary["valid"] += 1

    return valid_logs, summary
