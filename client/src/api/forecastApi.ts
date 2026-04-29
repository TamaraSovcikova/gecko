import axios from "axios";
import { ForecastPayload } from "../types/forecast";

export const getForecast = async (token?: string): Promise<ForecastPayload> => {
  console.log("[forecastApi] GET /api/v1/forecast called");

  const response = await axios.get("/api/v1/forecast", {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  console.log("[forecastApi] Forecast response =", response.data);

  return response.data.forecast;
};

export const dismissForecastWarning = async (warningId: string, token?: string | null) => {
  console.log("[forecastApi] POST /api/v1/forecast/dismiss called with warningId =", warningId);

  const response = await axios.post(
    "/api/v1/forecast/dismiss",
    { warningId },
    {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  console.log("[forecastApi] Dismiss response =", response.data);

  return response.data;
};