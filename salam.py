"""
6-Day Weather Forecast for Baku, Azerbaijan
============================================

Sources:
    1. ECMWF IFS forecast model via Open-Meteo
    2. NOAA GFS forecast model via Open-Meteo

Weather quantities are averaged between ECMWF and GFS.

Astronomical quantities:
    - Sunrise
    - Sunset
    - Moonrise
    - Moonset
    - Moon phase

Location:
    Baku, Azerbaijan
    Latitude: 40.4093
    Longitude: 49.8671
    Time zone: Asia/Baku

Output units:
    Temperature: °F
    Wind: mph
    Cloud cover: %
    Precipitation probability: %
"""

import requests
import statistics
import math
from datetime import datetime
from zoneinfo import ZoneInfo


# ============================================================
# CONFIGURATION
# ============================================================

LATITUDE = 40.4093
LONGITUDE = 49.8671
TIMEZONE = "Asia/Baku"

FORECAST_DAYS = 6

# Open-Meteo model endpoints
ECMWF_URL = "https://api.open-meteo.com/v1/ecmwf"
GFS_URL = "https://api.open-meteo.com/v1/gfs"

LOCAL_TZ = ZoneInfo(TIMEZONE)


# ============================================================
# UNIT CONVERSION
# ============================================================

def c_to_f(celsius):
    """Convert Celsius to Fahrenheit."""
    return (celsius * 9 / 5) + 32


def kmh_to_mph(kmh):
    """Convert km/h to mph."""
    return kmh * 0.621371


# ============================================================
# MOON PHASE
# ============================================================

def moon_phase_name(phase):
    """
    Convert Open-Meteo's 0..1 lunar phase value into
    a conventional lunar phase name.

    Approximate phase positions:
        0.00 = New Moon
        0.25 = First Quarter
        0.50 = Full Moon
        0.75 = Last Quarter
    """

    phases = [
        (0.000, "New Moon"),
        (0.125, "Waxing Crescent"),
        (0.250, "First Quarter"),
        (0.375, "Waxing Gibbous"),
        (0.500, "Full Moon"),
        (0.625, "Waning Gibbous"),
        (0.750, "Last Quarter"),
        (0.875, "Waning Crescent"),
    ]

    # Circular distance because 0 and 1 represent the same point.
    def circular_distance(a, b):
        return min(abs(a - b), 1 - abs(a - b))

    closest = min(
        phases,
        key=lambda item: circular_distance(phase, item[0])
    )

    return closest[1]


# ============================================================
# API REQUEST
# ============================================================

def fetch_forecast(url):
    """
    Fetch one weather-model forecast.

    We request:
        Daily:
            max/min/mean temperature
            precipitation probability
            cloud cover
            sunrise/sunset
            moonrise/moonset
            moon phase
            maximum wind speed
            dominant wind direction

        Hourly:
            temperature
            cloud cover
            precipitation probability
            wind speed
            wind direction
    """

    daily_variables = [
        "temperature_2m_max",
        "temperature_2m_min",
        "temperature_2m_mean",
        "precipitation_probability_max",
        "precipitation_probability_mean",
        "cloud_cover_mean",
        "sunrise",
        "sunset",
        "moonrise",
        "moonset",
        "moon_phase",
        "wind_speed_10m_max",
        "wind_direction_10m_dominant",
    ]

    hourly_variables = [
        "temperature_2m",
        "cloud_cover",
        "precipitation_probability",
        "wind_speed_10m",
        "wind_direction_10m",
    ]

    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "timezone": TIMEZONE,
        "forecast_days": FORECAST_DAYS,
        "daily": ",".join(daily_variables),
        "hourly": ",".join(hourly_variables),
        "temperature_unit": "celsius",
        "wind_speed_unit": "kmh",
        "precipitation_unit": "mm",
    }

    response = requests.get(
        url,
        params=params,
        timeout=30
    )

    response.raise_for_status()

    return response.json()


# ============================================================
# HOURLY TEMPERATURE PERIODS
# ============================================================

def calculate_period_temperature(hourly_data, date, start_hour, end_hour):
    """
    Calculate average temperature for a particular period.

    Periods are defined using local Baku time:

        Morning:    06:00 - 11:59
        Afternoon:  12:00 - 17:59
        Evening:    18:00 - 23:59
        Night:      00:00 - 05:59
    """

    values = []

    times = hourly_data["time"]
    temperatures = hourly_data["temperature_2m"]

    for timestamp, temp in zip(times, temperatures):

        dt = datetime.fromisoformat(timestamp)

        if dt.date() != date:
            continue

        if start_hour <= dt.hour <= end_hour:
            values.append(temp)

    if not values:
        return None

    return statistics.mean(values)


def get_period_temperatures(hourly_data, date):
    """
    Return average temperatures for the four requested
    periods of the day.
    """

    return {
        "morning": calculate_period_temperature(
            hourly_data, date, 6, 11
        ),

        "afternoon": calculate_period_temperature(
            hourly_data, date, 12, 17
        ),

        "evening": calculate_period_temperature(
            hourly_data, date, 18, 23
        ),

        "night": calculate_period_temperature(
            hourly_data, date, 0, 5
        ),
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def average(values):
    """Return arithmetic mean, ignoring None values."""
    values = [
        value for value in values
        if value is not None
    ]

    if not values:
        return None

    return statistics.mean(values)


def average_angles(degrees):
    """
    Average compass directions correctly.

    For example:
        350° and 10° should average to approximately 0°,
        not 180°.
    """

    degrees = [
        value for value in degrees
        if value is not None
    ]

    if not degrees:
        return None

    sin_sum = sum(math.sin(math.radians(x)) for x in degrees)
    cos_sum = sum(math.cos(math.radians(x)) for x in degrees)

    angle = math.degrees(
        math.atan2(sin_sum, cos_sum)
    )

    return (angle + 360) % 360


def degrees_to_compass(degrees):
    """Convert degrees to an approximate compass direction."""

    if degrees is None:
        return "N/A"

    directions = [
        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW",
    ]

    index = round(degrees / 22.5) % 16

    return directions[index]


def format_time(value):
    """
    Convert an ISO timestamp such as
    2026-09-26T06:31 into 12-hour local time.
    """

    if not value:
        return "N/A"

    try:
        dt = datetime.fromisoformat(value)
        return dt.strftime("%-I:%M %p")
    except ValueError:
        return value


def format_temperature(celsius):
    """Format Celsius as Fahrenheit."""
    if celsius is None:
        return "N/A"

    return f"{c_to_f(celsius):.1f} °F"


def format_percent(value):
    """Format a percentage."""
    if value is None:
        return "N/A"

    return f"{value:.0f}%"


def format_wind(speed_kmh, direction_degrees):
    """Format wind speed and direction."""

    if speed_kmh is None:
        return "N/A"

    mph = kmh_to_mph(speed_kmh)

    direction = degrees_to_compass(direction_degrees)

    return f"{direction} at {mph:.1f} mph"


# ============================================================
# COMBINE THE TWO MODELS
# ============================================================

def combine_forecasts(ecmwf, gfs):
    """
    Average ECMWF and GFS forecast values.

    Astronomical times are averaged as timestamps when both
    models return them. Since they are astronomical calculations,
    differences should normally be very small.
    """

    e_daily = ecmwf["daily"]
    g_daily = gfs["daily"]

    e_hourly = ecmwf["hourly"]
    g_hourly = gfs["hourly"]

    dates = e_daily["time"]

    results = []

    for i, date_string in enumerate(dates):

        date = datetime.strptime(
            date_string,
            "%Y-%m-%d"
        ).date()

        # ----------------------------------------------------
        # DAILY WEATHER
        # ----------------------------------------------------

        high_c = average([
            e_daily["temperature_2m_max"][i],
            g_daily["temperature_2m_max"][i],
        ])

        low_c = average([
            e_daily["temperature_2m_min"][i],
            g_daily["temperature_2m_min"][i],
        ])

        mean_c = average([
            e_daily["temperature_2m_mean"][i],
            g_daily["temperature_2m_mean"][i],
        ])

        cloud = average([
            e_daily["cloud_cover_mean"][i],
            g_daily["cloud_cover_mean"][i],
        ])

        precip = average([
            e_daily["precipitation_probability_mean"][i],
            g_daily["precipitation_probability_mean"][i],
        ])

        max_wind_kmh = average([
            e_daily["wind_speed_10m_max"][i],
            g_daily["wind_speed_10m_max"][i],
        ])

        wind_direction = average_angles([
            e_daily["wind_direction_10m_dominant"][i],
            g_daily["wind_direction_10m_dominant"][i],
        ])

        # ----------------------------------------------------
        # ASTRONOMY
        # ----------------------------------------------------

        # ECMWF and GFS should normally provide essentially
        # identical astronomical calculations.
        sunrise = e_daily["sunrise"][i]
        sunset = e_daily["sunset"][i]

        moonrise = e_daily["moonrise"][i]
        moonset = e_daily["moonset"][i]

        moon_phase = average([
            e_daily["moon_phase"][i],
            g_daily["moon_phase"][i],
        ])

        # ----------------------------------------------------
        # PERIOD TEMPERATURES
        # ----------------------------------------------------

        e_periods = get_period_temperatures(
            e_hourly,
            date
        )

        g_periods = get_period_temperatures(
            g_hourly,
            date
        )

        periods = {}

        for period in [
            "morning",
            "afternoon",
            "evening",
            "night",
        ]:
            periods[period] = average([
                e_periods[period],
                g_periods[period],
            ])

        # ----------------------------------------------------
        # STORE RESULT
        # ----------------------------------------------------

        results.append({
            "date": date,
            "sunrise": sunrise,
            "sunset": sunset,
            "moonrise": moonrise,
            "moonset": moonset,
            "moon_phase": moon_phase_name(moon_phase),

            "high_c": high_c,
            "low_c": low_c,
            "mean_c": mean_c,

            "cloud_cover": cloud,
            "precipitation_probability": precip,

            "wind_speed_kmh": max_wind_kmh,
            "wind_direction": wind_direction,

            "periods": periods,
        })

    return results


# ============================================================
# PRINT FORECAST
# ============================================================

def print_forecast(forecast):

    print("\n" + "=" * 80)
    print("6-DAY WEATHER FORECAST — BAKU, AZERBAIJAN")
    print("=" * 80)

    print(
        "Location: Baku, Azerbaijan\n"
        "Time zone: Asia/Baku\n"
        "Weather models: ECMWF IFS + NOAA GFS\n"
        "Weather values: Average of the two models\n"
        "Temperature: °F | Wind: mph | Probability/Cloud: %"
    )

    print("=" * 80)

    for day in forecast:

        date = day["date"]

        print("\n")
        print(date.strftime("%A, %B %-d, %Y"))
        print("-" * 80)

        print(
            f"Sunrise:             {format_time(day['sunrise'])}"
        )

        print(
            f"Sunset:              {format_time(day['sunset'])}"
        )

        print(
            f"Moonrise:            {format_time(day['moonrise'])}"
        )

        print(
            f"Moonset:             {format_time(day['moonset'])}"
        )

        print(
            f"Moon Phase:          {day['moon_phase']}"
        )

        print(
            f"High Temperature:    {format_temperature(day['high_c'])}"
        )

        print(
            f"Low Temperature:     {format_temperature(day['low_c'])}"
        )

        print(
            f"Mean Temperature:    {format_temperature(day['mean_c'])}"
        )

        print(
            f"Cloud Cover:         {format_percent(day['cloud_cover'])}"
        )

        print(
            f"Precipitation Chance:{format_percent(day['precipitation_probability'])}"
        )

        print(
            f"Wind:                "
            f"{format_wind(day['wind_speed_kmh'], day['wind_direction'])}"
        )

        print("\nTemperature by period:")

        print(
            f"  Morning:           "
            f"{format_temperature(day['periods']['morning'])}"
        )

        print(
            f"  Afternoon:         "
            f"{format_temperature(day['periods']['afternoon'])}"
        )

        print(
            f"  Evening:           "
            f"{format_temperature(day['periods']['evening'])}"
        )

        print(
            f"  Night:             "
            f"{format_temperature(day['periods']['night'])}"
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("Fetching ECMWF forecast...")

    ecmwf = fetch_forecast(ECMWF_URL)

    print("Fetching NOAA GFS forecast...")

    gfs = fetch_forecast(GFS_URL)

    print("Averaging forecasts...")

    forecast = combine_forecasts(
        ecmwf,
        gfs
    )

    print_forecast(forecast)


if __name__ == "__main__":
    main()

import requests
