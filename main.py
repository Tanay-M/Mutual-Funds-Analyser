from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from fund_manager import FundManager

# Initialize FastAPI app
app = FastAPI(title="Mutual Fund Analysis API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize FundManager
# We instantiate it once so the DB connection/checks happen on startup
fm = FundManager()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Mutual Fund Analysis API. Use /search or /compare endpoints."}

@app.get("/search")
def search_funds(
    q: str = Query(..., description="Search keyword for the fund"),
    filter: Optional[str] = Query(None, description="Filter type e.g., 'Direct Growth', 'Regular'")
):
    """
    Search for mutual funds by name.
    """
    try:
        results = fm.search_funds(q, filter_type=filter)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/compare")
def compare_funds(
    codes: List[str] = Query(..., description="List of scheme codes to analyze"),
    years: float = Query(3.0, description="Rolling return period in years"),
    benchmark: float = Query(0.06, description="Benchmark return rate (e.g., 0.06 for 6%)")
):
    """
    Analyze and compare funds with rolling return statistics.
    """
    if years <= 0.5:
        raise HTTPException(status_code=400, detail="Years must be greater than 0.5")
    
    try:
        stats = fm.get_rolling_return_stats(codes, years=years, benchmark_rate=benchmark)
        if not stats:
            raise HTTPException(status_code=404, detail="No data found for the provided scheme codes")
        return stats
    except Exception as e:
        # In a real app, we might want to log this error
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn main:app --reload
