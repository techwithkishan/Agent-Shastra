"""Configuration thresholds for the API Failure Detection & Debugging Agent."""

# Latency Anomaly Thresholds
LATENCY_WINDOW = 10         # last N logs per endpoint for baseline
LATENCY_MIN_SAMPLES = 5     # skip detection if fewer logs
LATENCY_STD_MULTIPLIER = 2.0 # spike = mean + 2×std_dev
LATENCY_ABSOLUTE_MULT = 5.0  # fallback: spike = 5× mean (zero-variance case)

# Error Rate Anomaly Thresholds
ERROR_WINDOW = 50           # last N requests per endpoint
ERROR_MIN_SAMPLES = 10      # skip detection if fewer logs
ERROR_RATE_THRESHOLD = 0.05 # 5% errors = anomaly
ERROR_RATE_DELTA = 0.10     # OR baseline + 10pp = anomaly
