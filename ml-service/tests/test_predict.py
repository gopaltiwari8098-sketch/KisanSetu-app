import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.forecaster import exponential_weighted_forecast, generate_advisory

def test_wheat_forecast():
    forecast = exponential_weighted_forecast(2150, "Wheat", 7)
    assert len(forecast) == 7
    assert forecast[0]["label"] == "Aaj"
    assert all(f["value"] > 0 for f in forecast)
    assert all(f["lower_bound"] < f["value"] < f["upper_bound"] for f in forecast)
    print("✅ Wheat 7-day forecast test passed")
    for f in forecast:
        print(f"  {f['label']}: ₹{f['value']} (₹{f['lower_bound']} - ₹{f['upper_bound']})")

def test_onion_forecast():
    forecast = exponential_weighted_forecast(1800, "Onion", 14)
    assert len(forecast) == 14
    advisory = generate_advisory(1800, forecast, "Onion")
    assert advisory["signal"] in ["HOLD / BAAD MEIN BECHO", "ABHI BECHO", "STABLE — APNI ZAROORAT DEKHO"]
    assert 0.60 <= advisory["confidence"] <= 0.92
    print(f"✅ Onion forecast test passed — Signal: {advisory['signal']}")

def test_advisory():
    forecast_up = [{"value": 2500}] * 7
    advisory = generate_advisory(2000, forecast_up, "Wheat")
    assert advisory["signal_color"] == "up"
    print("✅ Advisory bullish test passed")

    forecast_down = [{"value": 1500}] * 7
    advisory = generate_advisory(2000, forecast_down, "Wheat")
    assert advisory["signal_color"] == "down"
    print("✅ Advisory bearish test passed")

if __name__ == "__main__":
    test_wheat_forecast()
    test_onion_forecast()
    test_advisory()
    print("\n🎉 Saare tests pass ho gaye!")