/* =====================================================
   SETTINGS
===================================================== */

let useFahrenheit = false;

let weatherData = null;

let selectedLocation = {
    name: "Bakı",
    latitude: 40.4093,
    longitude: 49.8671
};


/* =====================================================
   API URLS
===================================================== */

const GEOCODING_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_URL =
    "https://api.open-meteo.com/v1/forecast";


/* =====================================================
   HTML ELEMENTS
===================================================== */

const input =
    document.getElementById("locationInput");

const searchButton =
    document.getElementById("searchButton");

const results =
    document.getElementById("locationResults");

const unitButton =
    document.getElementById("unitButton");

const currentWeather =
    document.getElementById("currentWeather");

const forecast =
    document.getElementById("forecast");

const updated =
    document.getElementById("updated");


/* =====================================================
   TEMPERATURE
===================================================== */

function temperature(value) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(value)
    ) {
        return "—";
    }

    if (useFahrenheit) {

        const fahrenheit =
            (value * 9 / 5) + 32;

        return (
            Math.round(fahrenheit) +
            "°F"
        );
    }

    return (
        Math.round(value) +
        "°C"
    );
}


/* =====================================================
   WIND
===================================================== */

function wind(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    if (useFahrenheit) {

        return (
            Math.round(
                value * 0.621371
            ) +
            " mph"
        );
    }

    return (
        Math.round(value) +
        " km/h"
    );
}


/* =====================================================
   WEATHER ICON
===================================================== */

function weatherIcon(code) {

    if (code === 0) {
        return "☀️";
    }

    if ([1, 2].includes(code)) {
        return "🌤️";
    }

    if (code === 3) {
        return "☁️";
    }

    if ([45, 48].includes(code)) {
        return "🌫️";
    }

    if ([51, 53, 55, 56, 57].includes(code)) {
        return "🌦️";
    }

    if ([61, 63, 65, 66, 67].includes(code)) {
        return "🌧️";
    }

    if ([71, 73, 75, 77].includes(code)) {
        return "🌨️";
    }

    if ([80, 81, 82].includes(code)) {
        return "🌦️";
    }

    if ([95, 96, 99].includes(code)) {
        return "⛈️";
    }

    return "🌤️";
}


/* =====================================================
   WEATHER DESCRIPTION
===================================================== */

function weatherDescription(code) {

    const descriptions = {

        0: "Açıq hava",

        1: "Əsasən açıq",

        2: "Qismən buludlu",

        3: "Buludlu",

        45: "Duman",

        48: "Duman",

        51: "Zəif çiskin",

        53: "Çiskin",

        55: "Güclü çiskin",

        61: "Zəif yağış",

        63: "Orta yağış",

        65: "Güclü yağış",

        66: "Dondurucu yağış",

        67: "Güclü dondurucu yağış",

        71: "Zəif qar",

        73: "Qar",

        75: "Güclü qar",

        77: "Qar dənəcikləri",

        80: "Yağışlı",

        81: "Güclü yağış",

        82: "Şiddətli yağış",

        95: "Göy gurultulu",

        96: "Dolu ilə göy gurultusu",

        99: "Güclü dolu"
    };

    return (
        descriptions[code] ||
        "Hava"
    );
}


/* =====================================================
   MOON PHASE
===================================================== */

function moonPhase(phase) {

    if (
        phase === null ||
        phase === undefined
    ) {
        return "—";
    }

    if (
        phase < 0.0625 ||
        phase >= 0.9375
    ) {
        return "🌑 Yeni Ay";
    }

    if (phase < 0.1875) {
        return "🌒 Hilal";
    }

    if (phase < 0.3125) {
        return "🌓 Birinci rüb";
    }

    if (phase < 0.4375) {
        return "🌔 Böyüyən Ay";
    }

    if (phase < 0.5625) {
        return "🌕 Bədirlənmiş Ay";
    }

    if (phase < 0.6875) {
        return "🌖 Kiçilən Ay";
    }

    if (phase < 0.8125) {
        return "🌗 Son rüb";
    }

    return "🌘 Hilal";
}


/* =====================================================
   TIME
===================================================== */

function formatTime(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    return date.toLocaleTimeString(
        "az-AZ",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =====================================================
   DATE
===================================================== */

function formatDate(value) {

    const date =
        new Date(
            value + "T12:00:00"
        );

    return date.toLocaleDateString(
        "az-AZ",
        {
            day: "numeric",
            month: "long"
        }
    );
}


/* =====================================================
   DAY NAME
===================================================== */

function dayName(value) {

    const date =
        new Date(
            value + "T12:00:00"
        );

    return date.toLocaleDateString(
        "az-AZ",
        {
            weekday: "long"
        }
    );
}


/* =====================================================
   SEARCH LOCATIONS
===================================================== */

async function searchLocations() {

    const query =
        input.value.trim();


    if (query.length < 2) {

        results.innerHTML = `
            <div class="location-result">
                Ən azı 2 hərf yazın.
            </div>
        `;

        return;
    }


    results.innerHTML = `
        <div class="loading">
            🔎 Axtarılır...
        </div>
    `;


    try {

        const url =
            GEOCODING_URL +
            "?name=" +
            encodeURIComponent(query) +
            "&count=10" +
            "&language=az" +
            "&format=json";


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Geocoding API error"
            );
        }


        const data =
            await response.json();


        if (
            !data.results ||
            data.results.length === 0
        ) {

            results.innerHTML = `
                <div class="location-result">
                    ❌ Yer tapılmadı.
                </div>
            `;

            return;
        }


        const azPlaces =
            data.results.filter(
                place =>
                    place.country_code === "AZ"
            );


        if (azPlaces.length === 0) {

            results.innerHTML = `
                <div class="location-result">
                    ❌ Azərbaycanda bu adla yer tapılmadı.
                </div>
            `;

            return;
        }


        results.innerHTML = "";


        azPlaces.forEach(
            place => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "location-result";


                item.innerHTML = `

                    <div class="result-name">
                        📍 ${place.name}
                    </div>

                    <div class="result-country">

                        ${
                            place.admin1 ||
                            "Azərbaycan"
                        }

                        ${
                            place.admin2
                            ? " • " + place.admin2
                            : ""
                        }

                        • Azərbaycan

                    </div>
                `;


                item.addEventListener(
                    "click",
                    function () {

                        selectLocation(
                            place
                        );

                    }
                );


                results.appendChild(
                    item
                );

            }
        );

    } catch (error) {

        console.error(error);

        results.innerHTML = `
            <div class="location-result">
                ❌ Axtarış zamanı xəta baş verdi.
            </div>
        `;
    }
}


/* =====================================================
   SELECT LOCATION
===================================================== */

function selectLocation(place) {

    selectedLocation = {

        name:
            place.name,

        latitude:
            place.latitude,

        longitude:
            place.longitude
    };


    input.value =
        place.name;


    results.innerHTML = "";


    loadWeather();
}


/* =====================================================
   GET WEATHER
===================================================== */

async function fetchWeather() {

    const dailyVariables = [

        "weather_code",

        "temperature_2m_max",

        "temperature_2m_min",

        "precipitation_probability_max",

        "sunrise",

        "sunset",

        "moonrise",

        "moonset",

        "moon_phase",

        "cloud_cover_mean",

        "wind_speed_10m_max"

    ].join(",");


    const hourlyVariables = [

        "temperature_2m",

        "cloud_cover",

        "precipitation_probability",

        "wind_speed_10m"

    ].join(",");


    const url =
        WEATHER_URL +

        "?latitude=" +
        selectedLocation.latitude +

        "&longitude=" +
        selectedLocation.longitude +

        "&daily=" +
        dailyVariables +

        "&hourly=" +
        hourlyVariables +

        "&timezone=auto" +

        "&forecast_days=6";


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Weather API error"
        );
    }


    return await response.json();
}


/* =====================================================
   PERIOD TEMPERATURE
===================================================== */

function calculatePeriods(
    data,
    dayIndex
) {

    const periods = {

        morning: [],

        afternoon: [],

        evening: [],

        night: []
    };


    const targetDate =
        data.daily.time[dayIndex];


    for (
        let i = 0;
        i < data.hourly.time.length;
        i++
    ) {

        const time =
            data.hourly.time[i];


        if (
            !time.startsWith(
                targetDate
            )
        ) {
            continue;
        }


        const hour =
            Number(
                time.substring(11, 13)
            );


        const temp =
            data.hourly.temperature_2m[i];


        if (
            hour >= 6 &&
            hour <= 11
        ) {

            periods.morning.push(temp);

        } else if (
            hour >= 12 &&
            hour <= 17
        ) {

            periods.afternoon.push(temp);

        } else if (
            hour >= 18 &&
            hour <= 23
        ) {

            periods.evening.push(temp);

        } else {

            periods.night.push(temp);
        }
    }


    function average(values) {

        if (!values.length) {
            return null;
        }


        return (
            values.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / values.length
        );
    }


    return {

        morning:
            average(
                periods.morning
            ),

        afternoon:
            average(
                periods.afternoon
            ),

        evening:
            average(
                periods.evening
            ),

        night:
            average(
                periods.night
            )
    };
}


/* =====================================================
   RENDER CURRENT WEATHER
===================================================== */

function renderCurrent(data) {

    const temperatureNow =
        data.hourly
        .temperature_2m[0];


    const cloud =
        data.hourly
        .cloud_cover[0];


    const rain =
        data.hourly
        .precipitation_probability[0];


    const windSpeed =
        data.hourly
        .wind_speed_10m[0];


    const todayCode =
        data.daily
        .weather_code[0];


    currentWeather.innerHTML = `

        <div class="current-content">

            <div>

                <div class="current-location">
                    📍 ${selectedLocation.name},
                    Azərbaycan
                </div>

                <div class="weather-icon">
                    ${weatherIcon(todayCode)}
                </div>

                <div class="current-temperature">
                    ${temperature(temperatureNow)}
                </div>

                <div class="weather-description">
                    ${weatherDescription(todayCode)}
                </div>

            </div>


            <div class="stats">

                <div class="stat">

                    <div class="stat-label">
                        ☁️ Buludluluq
                    </div>

                    <div class="stat-value">
                        ${Math.round(cloud)}%
                    </div>

                </div>


                <div class="stat">

                    <div class="stat-label">
                        🌧️ Yağış ehtimalı
                    </div>

                    <div class="stat-value">
                        ${Math.round(rain)}%
                    </div>

                </div>


                <div class="stat">

                    <div class="stat-label">
                        💨 Külək
                    </div>

                    <div class="stat-value">
                        ${wind(windSpeed)}
                    </div>

                </div>


                <div class="stat">

                    <div class="stat-label">
                        🌡️ Bugünkü maksimum
                    </div>

                    <div class="stat-value">
                        ${temperature(
                            data.daily
                            .temperature_2m_max[0]
                        )}
                    </div>

                </div>

            </div>

        </div>
    `;
}


/* =====================================================
   RENDER 6 DAY FORECAST
===================================================== */

function renderForecast(data) {

    forecast.innerHTML = "";


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const date =
            data.daily.time[i];


        const code =
            data.daily.weather_code[i];


        const high =
            data.daily
            .temperature_2m_max[i];


        const low =
            data.daily
            .temperature_2m_min[i];


        const rain =
            data.daily
            .precipitation_probability_max[i];


        const cloud =
            data.daily
            .cloud_cover_mean[i];


        const maxWind =
            data.daily
            .wind_speed_10m_max[i];


        const sunrise =
            data.daily.sunrise[i];


        const sunset =
            data.daily.sunset[i];


        const moonrise =
            data.daily.moonrise[i];


        const moonset =
            data.daily.moonset[i];


        const phase =
            data.daily.moon_phase[i];


        const periods =
            calculatePeriods(
                data,
                i
            );


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "day-card";


        card.innerHTML = `

            <div class="day-name">
                ${dayName(date)}
            </div>

            <div class="date">
                ${formatDate(date)}
            </div>


            <div class="big-weather">

                <div class="icon">
                    ${weatherIcon(code)}
                </div>

                <div class="temperatures">

                    <div class="high">
                        ${temperature(high)}
                    </div>

                    <div class="low">
                        Min ${temperature(low)}
                    </div>

                </div>

            </div>


            <div class="details">

                <div class="detail">
                    <strong>
                        🌅 Günəş çıxır
                    </strong>

                    ${formatTime(sunrise)}
                </div>


                <div class="detail">
                    <strong>
                        🌇 Günəş batır
                    </strong>

                    ${formatTime(sunset)}
                </div>


                <div class="detail">
                    <strong>
                        🌙 Ay çıxır
                    </strong>

                    ${formatTime(moonrise)}
                </div>


                <div class="detail">
                    <strong>
                        🌙 Ay batır
                    </strong>

                    ${formatTime(moonset)}
                </div>


                <div class="detail">
                    <strong>
                        🌙 Ay fazası
                    </strong>

                    ${moonPhase(phase)}
                </div>


                <div class="detail">
                    <strong>
                        ☁️ Buludluluq
                    </strong>

                    ${Math.round(cloud)}%
                </div>


                <div class="detail">
                    <strong>
                        🌧️ Yağış ehtimalı
                    </strong>

                    ${Math.round(rain)}%
                </div>


                <div class="detail">
                    <strong>
                        💨 Maks. külək
                    </strong>

                    ${wind(maxWind)}
                </div>

            </div>


            <div class="periods">

                <div class="period">
                    <span>🌄 Səhər</span>

                    <span>
                        ${temperature(
                            periods.morning
                        )}
                    </span>
                </div>


                <div class="period">
                    <span>☀️ Günorta</span>

                    <span>
                        ${temperature(
                            periods.afternoon
                        )}
                    </span>
                </div>


                <div class="period">
                    <span>🌆 Axşam</span>

                    <span>
                        ${temperature(
                            periods.evening
                        )}
                    </span>
                </div>


                <div class="period">
                    <span>🌙 Gecə</span>

                    <span>
                        ${temperature(
                            periods.night
                        )}
                    </span>
                </div>

            </div>

        `;


        forecast.appendChild(card);
    }
}


/* =====================================================
   LOAD WEATHER
===================================================== */

async function loadWeather() {

    currentWeather.innerHTML = `

        <div class="loading">
            🌤️ ${selectedLocation.name}
            üçün hava məlumatları yüklənir...
        </div>

    `;


    forecast.innerHTML = "";


    try {

        weatherData =
            await fetchWeather();


        renderCurrent(
            weatherData
        );


        renderForecast(
            weatherData
        );


        updated.textContent =
            `${selectedLocation.name}, Azərbaycan • 6 günlük proqnoz`;

    } catch (error) {

        console.error(error);


        currentWeather.innerHTML = `

            <div class="loading">

                ❌ Hava məlumatını yükləmək mümkün olmadı.

                <br><br>

                İnternet bağlantınızı yoxlayın
                və səhifəni yeniləyin.

            </div>

        `;
    }
}


/* =====================================================
   SEARCH BUTTON
===================================================== */

searchButton.addEventListener(
    "click",
    searchLocations
);


/* =====================================================
   ENTER KEY
===================================================== */

input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            searchLocations();
        }
    }
);


/* =====================================================
   °C / °F
===================================================== */

unitButton.addEventListener(
    "click",
    function() {

        useFahrenheit =
            !useFahrenheit;


        if (weatherData) {

            renderCurrent(
                weatherData
            );

            renderForecast(
                weatherData
            );
        }
    }
);


/* =====================================================
   START WITH BAKU
===================================================== */

loadWeather();
