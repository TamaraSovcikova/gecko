// pages/Quiz/index.tsx

import { useEffect, useState } from "react";
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

export default function QuizPage() {
<<<<<<< HEAD
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [completedCount, setCompletedCount] = useState(Number(localStorage.getItem("quizCount")) || 0);
    const { token } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    // update XP bar
    const { refreshGamification } = useGamification();
=======
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const { refreshGamification } = useGamification();
  const [completedCount, setCompletedCount] = useState(
    Number(localStorage.getItem("quizCount")) || 0,
  );
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
>>>>>>> cd5e3bf (SCRUM189 - fixed xp live update)

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

  function getButtonStyle(i: number, a: Answer) {
    if (!showResult) {
      if (selected === i) return { background: "grey" };
      return { background: "white" };
    }
    if (a.correct) return { background: "lightgreen" };
    if (selected === i && !a.correct) return { background: "red" };
    return { background: "white" };
  }

  if (finished) {
    return (
        <>
            <div style={{ padding: "20px", backgroundColor: "#fafaf8" }}>
                <TopNav />
            </div>
            <button onClick={() => navigate("/dashboard")}
                style={{ marginTop: "20px", position: "fixed", borderColor: "white", padding: "5px", left: 20, borderRadius: "8px", background: "transparent", display: "flex", justifyContent: "center", color: "white", cursor: "pointer" }}>
                <BsArrowLeft size={30} />
            </button>
            <div style={{ background: "blue", color: "white", padding: "20px", textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
                Quiz
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                <div style={{ width: "400px", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "white", textAlign: "center" }}>
                    <p style={{ marginBottom: "10px", color: "darkgray" }}>
                        Question {currentIndex + 1} of {questions.length}
                    </p>
                    <h3 style={{ marginBottom: "20px" }}>{current.question}</h3>
                    {current.answers.map((a, i) => (
                        <button key={i}
                            onClick={() => {
                                if (showResult) return;
                                setSelected(i);
                                setShowResult(true);
                                if (a.correct) setScore(prev => prev + 1);
                            }}
                            style={{ width: "100%", padding: "12px", margin: "8px 0", borderRadius: "8px", border: "1px solid", cursor: "pointer", fontSize: "16px", transition: "0.2s", ...getButtonStyle(i, a) }}>
                            {a.text}
                        </button>
                    ))}
                    {showResult && (
                        <button onClick={() => {
                            console.log("CLICKED NEXT BUTTON"); //DEBUGGING
                            if (currentIndex + 1 >= questions.length) {
                                setFinished(true);
                                setCompletedCount(prev => {
                                    const next = prev + 1;
                                    localStorage.setItem("quizCount", String(next));
                                    return next;
                                });

                                // sync backend gamification state
                                const submitResults = async () => {
                                    try {
                                        /*
                                        await fetch(`${API_URL}/api/v1/quiz/complete`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                                score,
                                                difficulty: "medium", // or whatever you track
                                            }),
                                        });

                                        // refresh XP bar globally
                                        await refreshGamification();
                                        */
                                        console.log("Submitting quiz results..."); //DEBUGGING

                                        const response = await fetch(`${API_URL}/api/v1/quiz/complete`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                            score,
                                        }),
                                        });

                                        console.log("Quiz complete response status:", response.status); //DEBUGGING

                                        const data = await response.json().catch(() => null);
                                        console.log("Quiz complete response body:", data); //DEBUGGING

                                        console.log("Refreshing gamification state..."); //DEBUGGING
                                        await refreshGamification();
                                        console.log("Gamification refreshed"); //DEBUGGING

                                        // setFinished(true);
                                        console.log("Quiz marked as finished"); //DEBUGGING

                                    } catch (err) {
                                        console.error("Failed to sync gamification:", err);
                                    }
                                };

                                submitResults();
                                setFinished(true);
                                return;
                            }
                            setSelected(null);
                            setShowResult(false);
                            setCurrentIndex(prev => prev + 1);
                        }}
                            style={{ marginTop: "20px", width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "lightblue", color: "black", fontSize: "16px", cursor: "pointer" }}>
                            Next
                        </button>
                    )}
                </div>
            </div>
        </>
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

                    const response = await fetch(`${API_URL}/api/v1/quiz/complete`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        score,
                      }),
                    });

                    console.log("Quiz complete response status:", response.status); //DEBUGGING

                    const data = await response.json().catch(() => null);
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
