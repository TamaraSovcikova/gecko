import axios from "axios";
import { ForecastPayload } from "../types/forecast";

export const getForecast = async (): Promise<ForecastPayload> => {
  console.log("[forecastApi] GET /api/v1/forecast called");

  const response = await axios.get("/api/v1/forecast", {
    withCredentials: true,
  });

  console.log("[forecastApi] Forecast response =", response.data);

  return response.data.forecast;
};

export const dismissForecastWarning = async (warningId: string) => {
  console.log("[forecastApi] POST /api/v1/forecast/dismiss called with warningId =", warningId);

  const response = await axios.post(
    "/api/v1/forecast/dismiss",
    { warningId },
    { withCredentials: true }
  );

  console.log("[forecastApi] Dismiss response =", response.data);

  return response.data;
};