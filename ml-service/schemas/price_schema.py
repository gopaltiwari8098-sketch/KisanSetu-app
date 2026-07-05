from pydantic import BaseModel
from typing import List, Optional

class PricePoint(BaseModel):
    date: str
    price: float

class ForecastRequest(BaseModel):
    crop_name: str
    current_price: float
    days: int = 7
    historical_prices: Optional[List[PricePoint]] = []

class ForecastPoint(BaseModel):
    label: str
    value: int
    lower_bound: int
    upper_bound: int

class Advisory(BaseModel):
    signal: str
    signal_color: str
    advice: str
    confidence: float

class ForecastResponse(BaseModel):
    crop: str
    base_price: float
    forecast: List[ForecastPoint]
    percent_change: float
    advisory: Advisory
    model_used: str