import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import TopNav from "../../components/TopNav";
import { useGamification } from "../../context/GamificationContext";

type Answer = {
  text: string;
  correct: boolean;
};

type Question = {
  id: string;
  question: string;
  answers: Answer[];
};

const API_URL = import.meta.env.VITE_API_URL;

/* ------------------ LAYOUT ------------------ */

const layoutStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  padding: 0,
};

const contentWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "transparent",
  padding: "16px",
};

/* ------------------ CARD ------------------ */

const cardStyle: React.CSSProperties = {
  maxWidth: "780px",
  width: "100%",
  padding: "clamp(20px, 4vw, 40px)",
  border: "1px solid #c9bde8",
  borderRadius: "16px",
  background: "#f4f1fb",
  boxShadow: "0 8px 24px rgba(92, 63, 163, 0.12)",
};

/* ------------------ TEXT ------------------ */

const questionTextStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "24px",
  color: "#1a1040",
};

const subTextStyle: React.CSSProperties = {
  marginBottom: "12px",
  color: "#7a6e99",
  fontSize: "14px",
  fontWeight: 500,
};

/* ------------------ BUTTONS ------------------ */

const baseButton: React.CSSProperties = {
  width: "100%",
  padding: "16px 20px",
  margin: "10px 0",
  border: "1px solid #c9bde8",
  cursor: "pointer",
  fontSize: "16px",
  background: "#faf9fd",
  color: "#1a1040",
  borderRadius: "10px",
  textAlign: "left",
};

const primaryButton: React.CSSProperties = {
  marginTop: "24px",
  padding: "14px 28px",
  border: "1px solid #4e358f",
  borderRadius: "12px",
  background: "#5c3fa3",
  color: "white",
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
};

/* ------------------ COMPONENT ------------------ */

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);

  const { token } = useAuth();
  const { refreshGamification } = useGamification();
  const navigate = useNavigate();

  const didFetch = useRef(false);
  const location = useLocation();

  const topic = new URLSearchParams(location.search).get("topic");

  useEffect(() => {
    if (!token || didFetch.current) return;
    didFetch.current = true;

    const url = topic
      ? `${API_URL}/api/v1/quiz?topic=${encodeURIComponent(topic)}`
      : `${API_URL}/api/v1/quiz`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions))
      .catch(console.error);
  }, [token, topic]);

  if (questions.length === 0) return <div className="app-page">Loading...</div>;

  const current = questions[currentIndex];

  function getAnswerStyle(i: number, a: Answer): React.CSSProperties {
    if (!showResult) {
      return selected === i
        ? { ...baseButton, background: "#ede8f8", borderColor: "#8b6fd4" }
        : baseButton;
    }

    if (a.correct)
      return { ...baseButton, background: "#e8e0fa", borderColor: "#8b6fd4" };

    if (selected === i)
      return { ...baseButton, background: "#fed7d7", borderColor: "#f56565" };

    return { ...baseButton, opacity: 0.6 };
  }

  const handleNext = async () => {
    if (currentIndex + 1 >= questions.length) {
      const res = await fetch(`${API_URL}/api/v1/quiz/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score }),
      });

      const data = await res.json();
      setEarnedXp(data?.earnedXp ?? 0);
      await refreshGamification();
      setFinished(true);
    } else {
      setSelected(null);
      setShowResult(false);
      setCurrentIndex((i) => i + 1);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <div className="app-page" style={layoutStyle}>
      <TopNav />

      <div style={contentWrapperStyle}>
        <div style={cardStyle}>
          {finished ? (
            <>
              <h1>Quiz Complete 🎉</h1>
              <h2>
                Score: {score} / {questions.length}
              </h2>
              <h3>You earned {earnedXp} XP</h3>

              <button
                onClick={() => navigate("/dashboard")}
                style={primaryButton}
              >
                Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <p style={subTextStyle}>
                Question {currentIndex + 1} / {questions.length}
              </p>

              <h3 style={questionTextStyle}>{current.question}</h3>

              {current.answers.map((a, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (showResult) return;
                    setSelected(i);
                    setShowResult(true);
                    if (a.correct) setScore((s) => s + 1);
                  }}
                  style={getAnswerStyle(i, a)}
                >
                  {a.text}
                </button>
              ))}

              {showResult && (
                <button onClick={handleNext} style={primaryButton}>
                  {currentIndex + 1 >= questions.length
                    ? "Finish Quiz"
                    : "Next Question"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
