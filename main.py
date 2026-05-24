"""FastAPI Bridge to interface with the API Failure Agent.

Receives log uploads, invokes agent.py, and returns alert reports cleanly.
"""

import os
import sys
import json
import subprocess
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="API Failure Agent Bridge")

# Allow both local dev and Vercel-deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Covers localhost:3000, Vercel preview, and production URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_logs(file: UploadFile = File(...)):
    """Receives JSON log file upload, runs the Python Agent loop, and returns results."""
    # 1. Validation: Verify file is uploaded
    if not file:
        return {"success": False, "message": "No file was uploaded."}

    # 2. Validation: Verify file is a .json file
    if not file.filename.endswith(".json"):
        return {"success": False, "message": "Invalid file format. Only .json files are accepted."}

    # Prepare temp file
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"temp_upload_{os.getpid()}.json")

    try:
        # Save temp file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Validation: Verify the file has valid JSON syntax
        with open(temp_file_path, "r", encoding="utf-8") as f:
            try:
                json.load(f)
            except json.JSONDecodeError as e:
                return {"success": False, "message": f"Malformed JSON content: {str(e)}"}

        # Delete alert.json in CWD if it already exists to prevent stale outputs
        alert_path = "alert.json"
        if os.path.exists(alert_path):
            try:
                os.remove(alert_path)
            except Exception:
                pass

        # Execute agent.py as a subprocess
        # Use sys.executable to run agent.py with the same Python environment
        cmd = [sys.executable, "agent.py", temp_file_path]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,  # 60s strict timeout
                check=False
            )
        except subprocess.TimeoutExpired:
            return {"success": False, "message": "Execution timeout: Python agent took longer than 60 seconds to process."}

        # Check if agent crashed
        if result.returncode != 0:
            return {
                "success": False, 
                "message": f"Agent crashed with exit code {result.returncode}. Details: {result.stderr or result.stdout}"
            }

        # Read output alert.json
        if not os.path.exists(alert_path):
            # If the run succeeded but alert.json is missing, it means no anomalies were flagged!
            # Let's return a healthy empty report so the frontend handles it elegantly.
            return {
                "success": True,
                "total_incidents": 0,
                "severity": "WARNING",
                "incidents": [],
                "message": "System appears completely healthy. No anomalies detected."
            }

        with open(alert_path, "r", encoding="utf-8") as f:
            try:
                alert_data = json.load(f)
                alert_data["success"] = True
                return alert_data
            except json.JSONDecodeError:
                return {"success": False, "message": "Failed to parse agent alert.json output: Invalid JSON format."}

    except Exception as e:
        return {"success": False, "message": f"Internal server error: {str(e)}"}

    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

# Mount the Next.js static build directory to serve the frontend directly
if os.path.exists("frontend/out"):
    app.mount("/", StaticFiles(directory="frontend/out", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 so Render (and other cloud hosts) can bind to the assigned PORT.
    # Falls back to 8000 for local development.
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
