"""Stage 4: Root Cause Analyzer.

Leverages LLMs (Google Gemini free-tier or Anthropic Claude) to analyze incidents.
Gracefully falls back to a robust, offline, symptom-based heuristic diagnostics engine.
"""

import os
import sys
import hashlib
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Predefined high-quality offline rule-based diagnostics
FALLBACK_TEMPLATES = {
    "latency_spike": {
        "likely_causes": [
            "Likely: database connection pool exhaustion — check active connections",
            "Likely: slow query or lock contention — review recent slow query logs",
            "Likely: downstream service degradation — verify dependencies are healthy"
        ],
        "recommended_actions": [
            "Scale database connection pool limits or kill long-running transactions",
            "Verify Slow Query Logs in PostgreSQL/MySQL and check database CPU usage",
            "Perform network ping/health checks on third-party payment gateways and downstream APIs"
        ]
    },
    "error_rate_spike": {
        "likely_causes": [
            "Likely: recent deployment introduced a bug — check last deploy timestamp",
            "Likely: upstream dependency returning errors — check dependency status",
            "Likely: resource exhaustion (memory, disk) — check infra metrics"
        ],
        "recommended_actions": [
            "Check recent deployment/CI-CD logs for the service and roll back if necessary",
            "Review gateway error responses and upstream reverse proxy configurations",
            "Check system metrics (Docker, Kubernetes, or Host RAM and Disk usage) for resource leaks"
        ]
    }
}

def explain_causes(group: dict) -> dict:
    """Enriches an incident group with likely root causes and recommended actions.

    Queries Gemini/Claude if keys are present; otherwise triggers the offline heuristic engine.

    Args:
        group: The incident group dictionary from Stage 3.

    Returns:
        The enriched incident group dictionary (adds likely_causes and recommended_actions).
    """
    endpoint = group.get("endpoint", "unknown")
    failure_type = group.get("failure_type", "unknown")
    baseline = group.get("baseline", 0)
    peak = group.get("peak", 0)
    occurrences = group.get("occurrences", 0)
    first_seen = group.get("first_seen", "")
    last_seen = group.get("last_seen", "")
    co_occurring = group.get("co_occurring", False)

    # Initialize lists
    likely_causes = []
    recommended_actions = []

    # Get keys from environment
    gemini_key = os.getenv("GEMINI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    # Prompt layout for observed symptoms
    prompt = (
        f"You are analyzing an API failure.\n\n"
        f"Observed facts only:\n"
        f"- Endpoint: {endpoint}\n"
        f"- Failure type: {failure_type}\n"
        f"- Baseline: {baseline}\n"
        f"- Peak value: {peak}\n"
        f"- Occurrences: {occurrences}\n"
        f"- Time window: {first_seen} to {last_seen}\n"
        f"- Co-occurring with other failures: {co_occurring}\n\n"
        f"Provide exactly 3 likely causes and 3 recommended investigation steps based on these symptoms.\n"
        f"Use 'likely' language, not certainty. Keep each cause under 2 sentences.\n"
        f"Format your response EXACTLY as follows for strict machine parsing:\n"
        f"Causes:\n"
        f"1. [First Cause]\n"
        f"2. [Second Cause]\n"
        f"3. [Third Cause]\n"
        f"Actions:\n"
        f"1. [First Action]\n"
        f"2. [Second Action]\n"
        f"3. [Third Action]"
    )

    llm_success = False

    # 1. Try Google Gemini Free-Tier (First Choice - 100% Free)
    if gemini_key and not llm_success:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            response = model.generate_content(prompt)
            text = response.text
            
            # Parse response
            parsed_causes, parsed_actions = _parse_llm_response(text)
            if len(parsed_causes) == 3 and len(parsed_actions) == 3:
                likely_causes = parsed_causes
                recommended_actions = parsed_actions
                llm_success = True
                print(f"[Stage 4] LLM Analysis successful using Google Gemini for '{endpoint}'.")
        except Exception as e:
            print(f"Warning: Gemini API call failed: {e}. Falling back.", file=sys.stderr)

    # 2. Try Anthropic Claude (Second Choice)
    if anthropic_key and not llm_success:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=500,
                temperature=0.0,
                system="You are an expert systems engineering diagnostic assistant.",
                messages=[{"role": "user", "content": prompt}]
            )
            text = message.content[0].text
            
            parsed_causes, parsed_actions = _parse_llm_response(text)
            if len(parsed_causes) == 3 and len(parsed_actions) == 3:
                likely_causes = parsed_causes
                recommended_actions = parsed_actions
                llm_success = True
                print(f"[Stage 4] LLM Analysis successful using Anthropic Claude for '{endpoint}'.")
        except Exception as e:
            print(f"Warning: Anthropic API call failed: {e}. Falling back.", file=sys.stderr)

    # 3. Offline Heuristic Engine Fallback (100% Safe, 0 Costs)
    if not llm_success:
        # Fetch base templates
        t_type = "latency_spike" if "latency" in failure_type else "error_rate_spike"
        templates = FALLBACK_TEMPLATES.get(t_type, FALLBACK_TEMPLATES["latency_spike"])
        
        likely_causes = list(templates["likely_causes"])
        recommended_actions = list(templates["recommended_actions"])
        
        # Inject co-occurrence shared infrastructure warnings if co-occurring
        if co_occurring:
            # Overwrite first cause to point directly to co-occurring dependency/contention issue (Issue safe-phrasing)
            likely_causes[0] = "Likely: shared dependency degradation or backend contention — check concurrent metrics"
            recommended_actions[0] = "Correlate server logs across all co-occurring services for shared dependency failures or network bottlenecks"

        print(f"[Stage 4] Offline Diagnostics triggered for '{endpoint}' (zero API charges).")

    # Save details back to group
    group["likely_causes"] = likely_causes
    group["recommended_actions"] = recommended_actions
    return group

def _parse_llm_response(text: str) -> tuple[list[str], list[str]]:
    """Helper to parse structured LLM responses into strict string lists."""
    causes = []
    actions = []
    
    current_section = None
    lines = text.split("\n")
    
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        
        # Section detection
        if cleaned.lower().startswith("causes"):
            current_section = "causes"
            continue
        elif cleaned.lower().startswith("actions"):
            current_section = "actions"
            continue
            
        # Extract lists
        # Handles "1. Text" or "- Text" or "* Text"
        if cleaned[0].isdigit() or cleaned.startswith("-") or cleaned.startswith("*"):
            # Strip number/bullet prefix
            content = cleaned.split(".", 1)[-1].strip() if "." in cleaned else cleaned.lstrip("-* ").strip()
            if current_section == "causes":
                causes.append(content)
            elif current_section == "actions":
                actions.append(content)
                
    return causes, actions
