import { searchCity, getAirQuality } from "./api.js";

// Find HTML elements safely
function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`HTML element with id="${id}" was not found.`);
  }

  return element as T;
}

const searchForm = getElement<HTMLFormElement>("search-form");
const cityInput = getElement<HTMLInputElement>("city-input");
const cityName = getElement<HTMLHeadingElement>("city-name");
const updatedTime = getElement<HTMLParagraphElement>("updated-time");
const aqiNumber = getElement<HTMLSpanElement>("aqi-number");
const aqiStatus = getElement<HTMLSpanElement>("aqi-status");
const pm25Value = getElement<HTMLParagraphElement>("pm25-value");
const pm10Value = getElement<HTMLParagraphElement>("pm10-value");
const ozoneValue = getElement<HTMLParagraphElement>("o3-value");
const no2Value = getElement<HTMLParagraphElement>("no2-value");
const aqiHeading = getElement<HTMLHeadingElement>("aqi-heading");
const aqiDescription = getElement<HTMLParagraphElement>("aqi-description");
const aqiMarker = document.querySelector<HTMLDivElement>(".scale-marker");
const aqiBadge = document.querySelector<HTMLDivElement>(".aqi-badge");
const searchMessage = getElement<HTMLParagraphElement>("search-message");
const searchButton = searchForm.querySelector<HTMLButtonElement>(
  'button[type="submit"]'
);

if (!aqiMarker || !aqiBadge || !searchButton) {
  throw new Error("A required dashboard element is missing from index.html.");
}

function getAQIStatus(aqi: number | null) {
  if (aqi === null || !Number.isFinite(aqi)) {
    return {
      label: "Unavailable",
      description: "Air quality data is currently unavailable.",
    };
  }

  if (aqi <= 50) {
    return {
      label: "Good",
      description: "Air quality is satisfactory, with little or no risk.",
    };
  }

  if (aqi <= 100) {
    return {
      label: "Moderate",
      description:
        "Air quality is acceptable, but unusually sensitive people may be affected.",
    };
  }

  if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      description: "Sensitive people may experience health effects.",
    };
  }

  if (aqi <= 200) {
    return {
      label: "Unhealthy",
      description: "Some people may experience health effects.",
    };
  }

  if (aqi <= 300) {
    return {
      label: "Very Unhealthy",
      description: "Health effects may be more serious.",
    };
  }

  return {
    label: "Hazardous",
    description: "Health alert: everyone may be affected.",
  };
}

function getAQIClass(aqi: number | null): string {
  if (aqi === null || !Number.isFinite(aqi)) return "unavailable";
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very-unhealthy";
  return "hazardous";
}

function updatePollutant(
  element: HTMLParagraphElement,
  value: number | null
): void {
  const unit = document.createElement("span");
  unit.textContent = " µg/m³";

  element.replaceChildren(
    document.createTextNode(
      value !== null && Number.isFinite(value) ? String(value) : "N/A"
    ),
    unit
  );
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    searchMessage.textContent = "Please enter a city name.";
    cityInput.focus();
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Searching...";
  searchMessage.textContent = "Searching for air quality data...";

  try {
    const cities = await searchCity(city);

    if (cities.length === 0) {
      searchMessage.textContent =
        "City not found. Please try another name.";
      return;
    }

    const selectedCity = cities[0];
    const airQuality = await getAirQuality(selectedCity);
    console.log("Air quality data:", airQuality);``

    // Update city information
    cityName.textContent =
      `${selectedCity.name}, ${selectedCity.country}`;

    // Update AQI
    const aqi = airQuality.us_aqi;
    const status = getAQIStatus(aqi);

    aqiNumber.textContent =
      aqi !== null && Number.isFinite(aqi) ? String(aqi) : "N/A";

    aqiStatus.textContent = status.label;
    aqiBadge.className = "aqi-badge";
    aqiBadge.classList.add(getAQIClass(aqi));

    aqiHeading.textContent =
      status.label === "Unavailable"
        ? "Air quality data unavailable"
        : `Air quality is ${status.label.toLowerCase()}`;

    aqiDescription.textContent = status.description;


    // Update scale marker
    if (aqi !== null && Number.isFinite(aqi)) {
      const position = Math.min(Math.max(aqi, 0), 500);
      const percentage = (position / 500) * 100;

      aqiMarker.style.left = `${percentage}%`;
      aqiMarker.style.transform = "translate(-50%, -50%)";

      console.log("AQI:", aqi, "Marker position:", percentage + "%");
    } else {
      aqiMarker.style.left = "0%";
    }


    // Update pollutant cards
    updatePollutant(pm25Value, airQuality.pm2_5);
    updatePollutant(pm10Value, airQuality.pm10);
    updatePollutant(ozoneValue, airQuality.ozone);
    updatePollutant(no2Value, airQuality.nitrogen_dioxide);

    // Update data time
    updatedTime.textContent = airQuality.time
      ? `Data time: ${airQuality.time}`
      : "Data time unavailable";

    // Clear input only after a successful update
    cityInput.value = "";
    searchMessage.textContent =
      "Air quality data loaded successfully.";
  } catch (error) {
    console.error("AirScope error:", error);
    searchMessage.textContent =
      error instanceof Error
        ? `Error: ${error.message}`
        : "Unable to load air quality data. Please try again.";
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
});