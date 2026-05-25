"""Configuration thresholds for the API Failure Detection & Debugging Agent."""

# Adaptive Window Tiers
WINDOW_TIER_XS = 10         # logs < 20 (total_logs // 2 is used dynamically)
WINDOW_TIER_S = 20          # logs < 100
WINDOW_TIER_M = 50          # logs < 500
WINDOW_TIER_L = 100         # logs < 2000
WINDOW_TIER_XL = 200        # logs >= 2000 (production cap)

# Latency Anomaly Thresholds
LATENCY_MIN_SAMPLES = 5     # skip detection if fewer logs
LATENCY_STD_MULTIPLIER = 2.0 # spike = mean + 2×std_dev
LATENCY_ABSOLUTE_MULT = 5.0  # fallback: spike = 5× mean (zero-variance case)

# Error Rate Anomaly Thresholds
ERROR_MIN_SAMPLES = 10      # skip detection if fewer logs
ERROR_RATE_THRESHOLD = 0.05 # 5% errors = anomaly
ERROR_RATE_DELTA = 0.10     # OR baseline + 10pp = anomaly
