import type { City, AirQuality } from "./types";

interface GeocodingResponse {
  results?: City[];
}

interface AirQualityResponse {
  current?: {
    us_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    ozone?: number | null;
    nitrogen_dioxide?: number | null;
    time?: string;
  };
}

export async function searchCity(
  name: string
): Promise<City[]> {
  const query = new URLSearchParams({
    name,
    count: "5",
    language: "en",
    format: "json",
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${query}`
  );

  if (!response.ok) {
    throw new Error("Could not search for the city.");
  }

  const data: GeocodingResponse = await response.json();

  return data.results ?? [];
}

export async function getAirQuality(
  city: City
): Promise<AirQuality> {
  const query = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
    timezone: "auto",
  });

  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${query}`
  );

  if (!response.ok) {
    throw new Error("Could not load air quality data.");
  }

  const data: AirQualityResponse = await response.json();
  const current = data.current;

  if (!current) {
    throw new Error("Air quality data is unavailable.");
  }

  return {
    us_aqi: current.us_aqi ?? null,
    pm2_5: current.pm2_5 ?? null,
    pm10: current.pm10 ?? null,
    ozone: current.ozone ?? null,
    nitrogen_dioxide: current.nitrogen_dioxide ?? null,
    time: current.time ?? null,

  };
}