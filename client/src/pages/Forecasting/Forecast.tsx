import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getForecast } from "../../api/forecastApi";
import TopNav from "../../components/TopNav";

type ForecastData = Record<string, number>;

const Forecast = () => {
  const { token, loading } = useAuth();
  const [forecast, setForecast] = useState<ForecastData>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !token) return;

    const fetchForecast = async () => {
      try {
        const data = await getForecast(token);
        setForecast(data.projections || {});
        setError(null);
      } catch (err) {
        console.error("Failed to fetch forecast:", err);
        setError("Failed to load forecast");
        setForecast({});
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
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>📈 Spending Forecast</h2>

        {error && <p>{error}</p>}

        {Object.keys(forecast).length === 0 ? (
          <p>No forecast data yet. Start logging expenses.</p>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {Object.entries(forecast).map(([category, value]) => (
              <div
                key={category}
                style={{
                  padding: "12px",
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong>{category}</strong>
                <span>£{Number(value).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Forecast;