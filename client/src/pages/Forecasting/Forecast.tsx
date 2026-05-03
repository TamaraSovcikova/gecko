import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getForecast } from "../../api/forecastApi";
import { ForecastPayload } from "../../types/forecast";
import TopNav from "../../components/TopNav";

const Forecast = () => {
  const { token, loading } = useAuth();
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !token) return;

    const fetchForecast = async () => {
      try {
        const data = await getForecast(token);
        setForecast(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch forecast:", err);
        setError("Failed to load forecast");
        setForecast(null);
      }
    };

    fetchForecast();
  }, [token, loading]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <TopNav />
      <div
        style={{
          maxWidth: "800px",
          margin: "30px auto",
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        }}
      >
        <h2>📈 Spending Forecast</h2>

        {error && <p>{error}</p>}

        {!forecast || Object.keys(forecast.projections || {}).length === 0 ? (
          <p>No forecast data yet. Start logging expenses.</p>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {Object.entries(forecast.projections).map(([category, value]) => (
              <div
                key={category}
                style={{
                  padding: "12px",
                  marginBottom: "10px",
                  border: "1px solid #c9bde8",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong>{category}</strong>
                <span>£{Number(value.finalForecast).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Forecast;