export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface AirQuality {
  us_aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  nitrogen_dioxide: number | null;
  time: string | null;
}