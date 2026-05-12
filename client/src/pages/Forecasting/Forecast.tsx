import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getForecast } from "../../api/forecastApi";
import { ForecastPayload } from "../../types/forecast";
import TopNav from "../../components/TopNav";

const Forecast = () => {
  const { token, loading } = useAuth();
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // FEATURE FLAG (test-safe bypass)
  const isForecastDisabled =
    import.meta.env.VITE_DISABLE_FORECAST === "true";

  useEffect(() => {
    if (loading || !token) return;

    // skip API entirely in tests
    if (isForecastDisabled) {
      setForecast({
        projections: {},
      } as ForecastPayload);
      return;
    }

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
    <div className="app-page">
      <TopNav />
      <div className="app-content" style={{ maxWidth: "980px", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>
        <div className="app-surface">
          <p className="app-section-eyebrow">Forecasting</p>
          <h1 className="app-page-title" style={{ marginBottom: "12px" }}>Spending Forecast</h1>

          {error && <p className="app-status-error">{error}</p>}

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
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#faf9fd",
                  }}
                >
                  <strong>{category}</strong>
                  <span>£{Number(value.finalForecast).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forecast;