from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas.price_schema import ForecastRequest, ForecastResponse, ForecastPoint, Advisory
from models.forecaster import exponential_weighted_forecast, generate_advisory
import uvicorn

app = FastAPI(
    title="KisanSetu ML Service",
    description="AI-powered price forecasting for Indian farmers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "KisanSetu ML Service chal raha hai", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "model": "EWA + Seasonal Decomposition"}

@app.post("/predict", response_model=ForecastResponse)
def predict(request: ForecastRequest):
    try:
        if request.days < 1 or request.days > 30:
            raise HTTPException(status_code=400, detail="Days 1-30 ke beech hona chahiye")
        if request.current_price <= 0:
            raise HTTPException(status_code=400, detail="Price positive hona chahiye")

        historical = []
        if request.historical_prices:
            historical = [{"date": p.date, "price": p.price} for p in request.historical_prices]

        forecast_raw = exponential_weighted_forecast(
            base_price=request.current_price,
            crop_name=request.crop_name,
            days=request.days,
            historical_prices=historical
        )

        advisory_raw = generate_advisory(request.current_price, forecast_raw, request.crop_name)

        last_price = forecast_raw[-1]["value"]
        percent_change = round(((last_price - request.current_price) / request.current_price) * 100, 2)

        return ForecastResponse(
            crop=request.crop_name,
            base_price=request.current_price,
            forecast=[ForecastPoint(**f) for f in forecast_raw],
            percent_change=percent_change,
            advisory=Advisory(**advisory_raw),
            model_used="Exponential Weighted Average + Seasonal Decomposition"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)