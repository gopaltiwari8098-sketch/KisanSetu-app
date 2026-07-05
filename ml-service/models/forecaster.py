import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional

# Seasonal multipliers per crop type per month (Jan=0 to Dec=11)
SEASONAL_MULTIPLIERS = {
    "rabi": [1.05, 1.08, 0.95, 0.92, 0.97, 1.02, 1.08, 1.10, 1.06, 1.01, 0.98, 1.03],
    "kharif": [1.02, 1.06, 1.10, 1.12, 1.08, 1.03, 0.97, 0.95, 0.98, 0.93, 0.91, 0.97],
    "perennial": [1.01, 1.02, 1.03, 1.02, 1.00, 0.99, 0.98, 0.99, 1.00, 1.01, 1.02, 1.01],
    "spice": [1.00, 1.00, 1.02, 1.05, 1.08, 1.05, 1.00, 0.97, 0.95, 0.97, 0.99, 1.00],
}

CROP_CATEGORIES = {
    "rabi": ["Wheat", "Barley", "Gram", "Mustard", "Masoor Dal", "Peas"],
    "kharif": ["Rice", "Maize", "Bajra", "Jowar", "Soybean", "Cotton", "Sugarcane", "Groundnut", "Sesame", "Sunflower"],
    "perennial": ["Banana", "Papaya", "Guava", "Mango", "Orange", "Grapes", "Lemon", "Pomegranate", "Watermelon"],
    "vegetable": ["Onion", "Potato", "Tomato", "Brinjal", "Cauliflower", "Cabbage", "Lady Finger", "Green Chilli", "Garlic", "Ginger", "Carrot", "Cucumber", "Pumpkin", "Bitter Gourd", "Bottle Gourd", "Spinach", "Green Coriander", "Fenugreek"],
    "pulse": ["Arhar Dal", "Moong Dal", "Urad Dal"],
    "spice": ["Turmeric", "Black Pepper", "Cumin", "Coriander Seeds"],
}

def get_crop_category(crop_name: str) -> str:
    for category, crops in CROP_CATEGORIES.items():
        if crop_name in crops:
            return category
    return "rabi"  # default

def get_seasonal_multiplier(crop_name: str, month_index: int) -> float:
    category = get_crop_category(crop_name)
    if category in ["vegetable", "pulse"]:
        return SEASONAL_MULTIPLIERS["kharif"][month_index]
    multipliers = SEASONAL_MULTIPLIERS.get(category, SEASONAL_MULTIPLIERS["rabi"])
    return multipliers[month_index]

def exponential_weighted_forecast(
    base_price: float,
    crop_name: str,
    days: int,
    historical_prices: Optional[List] = None
) -> List[dict]:
    alpha = 0.35
    today = datetime.now()
    day_names_hi = ["Ravi", "Som", "Mangl", "Budh", "Brihsp", "Shukr", "Shani"]

    # If historical data available, use it to adjust base
    if historical_prices and len(historical_prices) > 1:
        prices = [p["price"] for p in historical_prices]
        weights = np.exp(np.linspace(0, 1, len(prices)))
        weights /= weights.sum()
        base_price = float(np.average(prices, weights=weights))

    forecast = []
    ew_price = base_price

    for i in range(days):
        future_date = today + timedelta(days=i)
        future_month = future_date.month - 1  # 0-indexed
        day_name = day_names_hi[future_date.weekday() % 7]
        date_str = f"{future_date.day}/{future_date.month}"

        seasonal_factor = get_seasonal_multiplier(crop_name, future_month)
        # Slight random noise ±1.5%
        noise = 1 + (np.random.uniform(-0.015, 0.015))
        predicted = base_price * seasonal_factor * noise

        # EWA smoothing
        ew_price = alpha * predicted + (1 - alpha) * ew_price

        # Confidence bounds ±3%
        lower = int(ew_price * 0.97)
        upper = int(ew_price * 1.03)

        label = "Aaj" if i == 0 else f"{day_name} {date_str}"
        forecast.append({
            "label": label,
            "value": int(ew_price),
            "lower_bound": lower,
            "upper_bound": upper,
        })

    return forecast

def generate_advisory(base_price: float, forecast: List[dict], crop_name: str) -> dict:
    last_price = forecast[-1]["value"]
    percent_change = round(((last_price - base_price) / base_price) * 100, 2)

    # Calculate confidence based on variance
    values = [f["value"] for f in forecast]
    variance = np.var(values)
    max_variance = (base_price * 0.1) ** 2
    confidence = round(max(0.60, 1 - (variance / max_variance)), 2)
    confidence = min(confidence, 0.92)  # cap at 92%

    if percent_change > 4:
        signal = "HOLD / BAAD MEIN BECHO"
        signal_color = "up"
        advice = (
            f"{crop_name} ka price agle {len(forecast)} dinon mein "
            f"+{percent_change}% badhne ka trend hai. "
            f"Abhi mat becho — thoda intezaar karo toh ₹{int(base_price * percent_change / 100):,} "
            f"zyada milenge per quintal."
        )
    elif percent_change < -4:
        signal = "ABHI BECHO"
        signal_color = "down"
        advice = (
            f"{crop_name} ka price {abs(percent_change)}% girne wala hai. "
            f"Jitna jaldi ho sake bech do — wait karne se "
            f"₹{int(base_price * abs(percent_change) / 100):,} per quintal ka nuksaan ho sakta hai."
        )
    else:
        signal = "STABLE — APNI ZAROORAT DEKHO"
        signal_color = "neutral"
        advice = (
            f"{crop_name} ka price stable rahega "
            f"({'+' if percent_change >= 0 else ''}{percent_change}%). "
            f"Apni storage capacity aur immediate zaroorat ke hisaab se decide karo."
        )

    return {
        "signal": signal,
        "signal_color": signal_color,
        "advice": advice,
        "confidence": confidence,
    }