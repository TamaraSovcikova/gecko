//
// TEST PAGE FOR CRON JOB
//

import { useEffect, useState } from "react";

type DailyMessage = {
  dateKey: string;
  message: string;
  createdAt: string;
};

export default function DailyHello() {
  const [data, setData] = useState<DailyMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTodayMessage() {
      try {
        const res = await fetch("/api/messages/today");

        if (!res.ok) {
          throw new Error("No daily message yet.");
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Fetch failed");
      } finally {
        setLoading(false);
      }
    }

    fetchTodayMessage();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Daily Hello</h1>
      <p>{data?.message}</p>
      <small>
        Stored:{" "}
        {data?.createdAt ? new Date(data.createdAt).toLocaleString() : ""}
      </small>
    </div>
  );
}

//
// TEST PAGE FOR CRON JOB
//