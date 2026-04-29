// pages/Quiz/index.tsx

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowLeft } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import TopNav from "../../components/TopNav";
// update XP bar
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

// Match homepage styling
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  border: "1px solid #d6d2c9",
  borderRadius: "0",
  padding: "68px clamp(20px, 5vw, 72px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  width: "100%",
  scrollMarginTop: "86px",
  backgroundColor: "#fafaf8",
};

const quizCardStyle: React.CSSProperties = {
  maxWidth: "640px",
  width: "100%",
  margin: "0 auto",
  padding: "40px",
  borderRadius: "0",
  border: "1px solid #d6d2c9",
  background: "#fff",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
};

const questionTextStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "24px",
  color: "#1a1a1a",
  lineHeight: 1.4,
};

const answerButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 20px",
  margin: "10px 0",
  borderRadius: "0",
  border: "1px solid #d6d2c9",
  cursor: "pointer",
  fontSize: "16px",
  transition: "all 0.2s ease",
  background: "#fff",
  color: "#1a1a1a",
  textAlign: "left",
};

const nextButtonStyle: React.CSSProperties = {
  marginTop: "24px",
  padding: "14px 28px",
  borderRadius: "0",
  border: "none",
  background: "#2d3748",
  color: "white",
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s ease",
};

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const { refreshGamification } = useGamification();
  const [earnedXp, setEarnedXp] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState(
    Number(localStorage.getItem("quizCount")) || 0,
  );
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const didFetch = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (didFetch.current) return;

    didFetch.current = true;

    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");

    const url = topic
      ? `${API_URL}/api/v1/quiz?topic=${encodeURIComponent(topic)}`
      : `${API_URL}/api/v1/quiz`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions))
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <p>Failed to load quiz: {error}</p>;
  if (questions.length === 0) return <p>Loading...</p>;

  const current = questions[currentIndex];

  function getButtonStyle(i: number, a: Answer): React.CSSProperties {
    const baseStyle = { ...answerButtonStyle };
    if (!showResult) {
      if (selected === i) return { ...baseStyle, background: "#e2e8f0", borderColor: "#2d3748" };
      return baseStyle;
    }
    if (a.correct) return { ...baseStyle, background: "#c6f6d5", borderColor: "#48bb78", color: "#22543d" };
    if (selected === i && !a.correct) return { ...baseStyle, background: "#fed7d7", borderColor: "#f56565", color: "#742a2a" };
    return { ...baseStyle, opacity: 0.6 };
  }

  if (finished) {
    return (
      <div style={pageStyle}>
        <TopNav />
        <div style={quizCardStyle}>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px", color: "#1a1a1a" }}>
            Quiz Complete! 🎉
          </h1>
          <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#4a5568" }}>
            Your Score: {score} / {questions.length}
          </h2>
          <h3 style={{ fontSize: "20px", marginBottom: "32px", color: "#48bb78", fontWeight: 600 }}>
            You earned {earnedXp} XP
          </h3>
          <button
            onClick={() => navigate("/dashboard")}
            style={nextButtonStyle}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <TopNav />
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          position: "fixed",
          top: "90px",
          left: "24px",
          padding: "8px 12px",
          borderRadius: "0",
          border: "1px solid #d6d2c9",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#4a5568",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 500,
          zIndex: 100,
        }}
      >
        <BsArrowLeft size={18} />
        Back
      </button>
      <div style={quizCardStyle}>
        <p style={{ marginBottom: "12px", color: "#718096", fontSize: "14px", fontWeight: 500 }}>
          Question {currentIndex + 1} of {questions.length}
        </p>
        <h3 style={questionTextStyle}>{current.question}</h3>
        {current.answers.map((a, i) => (
          <button
            key={i}
            onClick={() => {
              if (showResult) return;
              setSelected(i);
              setShowResult(true);
              if (a.correct) setScore((prev) => prev + 1);
            }}
            style={getButtonStyle(i, a)}
          >
            {a.text}
          </button>
        ))}
        {showResult && (
          <button
            onClick={() => {
            border: "none",
            background: "blue",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: "20px", backgroundColor: "#fafaf8" }}>
        <TopNav />
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          marginTop: "20px",
          position: "fixed",
          borderColor: "white",
          padding: "5px",
          left: 20,
          borderRadius: "8px",
          background: "transparent",
          display: "flex",
          justifyContent: "center",
          color: "white",
          cursor: "pointer",
        }}
      >
        <BsArrowLeft size={30} />
      </button>
      <div
        style={{
          background: "blue",
          color: "white",
          padding: "20px",
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        Quiz
      </div>
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}
      >
        <div
          style={{
            width: "400px",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            background: "white",
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: "10px", color: "darkgray" }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h3 style={{ marginBottom: "20px" }}>{current.question}</h3>
          {current.answers.map((a, i) => (
            <button
              key={i}
              onClick={() => {
                if (showResult) return;
                setSelected(i);
                setShowResult(true);
                if (a.correct) setScore((prev) => prev + 1);
              }}
              style={{
                width: "100%",
                padding: "12px",
                margin: "8px 0",
                borderRadius: "8px",
                border: "1px solid",
                cursor: "pointer",
                fontSize: "16px",
                transition: "0.2s",
                ...getButtonStyle(i, a),
              }}
            >
              {a.text}
            </button>
          ))}
          {showResult && (
            <button
              onClick={() => {
                console.log("CLICKED NEXT BUTTON"); //DEBUGGING

                if (currentIndex + 1 >= questions.length) {
                  // sync backend gamification state
                  const submitResults = async () => {
                    try {
                      console.log("Submitting quiz results..."); //DEBUGGING

                      const response = await fetch(
                        `${API_URL}/api/v1/quiz/complete`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            score,
                          }),
                        },
                      );

                      console.log(
                        "Quiz complete response status:",
                        response.status,
                      ); //DEBUGGING

                      if (!response.ok) {
                        console.error(
                          "Quiz complete failed:",
                          response.status,
                          response.statusText,
                        );
                        return;
                      }

                      const data = await response.json();
                      // show earned XP
                      setEarnedXp(data?.earnedXp ?? 0);

                      console.log("Quiz complete response body:", data); //DEBUGGING

                      console.log("Refreshing gamification state..."); //DEBUGGING
                      await refreshGamification();
                      console.log("Gamification refreshed"); //DEBUGGING

                      console.log("Quiz marked as finished"); //DEBUGGING

                      setCompletedCount((prev) => {
                        const next = prev + 1;
                        localStorage.setItem("quizCount", String(next));
                        return next;
                      });

                      setFinished(true);
                    } catch (err) {
                      console.error("Failed to sync gamification:", err);
                    }
                  };

                  submitResults();
                  return;
                }

                setSelected(null);
                setShowResult(false);
                setCurrentIndex((prev) => prev + 1);
              }}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "lightblue",
                color: "black",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}
