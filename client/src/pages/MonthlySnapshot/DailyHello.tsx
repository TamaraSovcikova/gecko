//
// TEST PAGE FOR CRON JOB
//

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

type DailyMessage = {
  _id: string;
  dateKey: string;
  message: string;
};

const DailyHello = () => {
  const { token, loading } = useAuth();

  const [message, setMessage] = useState<string>("");
  const [loadingMsg, setLoadingMsg] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (loading || !token) return;

    const fetchMessage = async () => {
      try {
        const res = await axios.get<DailyMessage>(
          `${import.meta.env.VITE_API_URL}/api/messages/today`,
          {
            headers: { Authorization: `Bearer ${token}` }, // optional if protected
          }
        );

        setMessage(res.data.message);
      } catch (err: any) {
        console.error(err);

        // Handle 404 (no message) separately
        if (err.response?.status === 404) {
          setError("No message for today yet.");
        } else {
          setError("Failed to fetch today's message.");
        }
      } finally {
        setLoadingMsg(false);
      }
    };

    fetchMessage();
  }, [token, loading]);

  if (loadingMsg) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Today's Message</h1>
      <p>{message}</p>
    </div>
  );
};

export default DailyHello;

//
// TEST PAGE FOR CRON JOB
//