import { useEffect, useState } from "react";
import { BsArrowLeft} from "react-icons/bs";

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

console.log("API_URL:", API_URL);

export default function QuizPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);
    const [completedCount, setCompletedCount] = useState(Number(localStorage.getItem("quizCount")) || 0);
// currently not using counter because have to check ZOe's implemtnation first

    useEffect(() => {
        fetch(`${API_URL}/api/v1/quiz`)
            .then(res => res.json())
            .then(data => {
                console.log("API RESPONSE:", data);
                setQuestions(data.questions);});
    }, []);

    if (questions.length === 0) return <p>Loading...</p>;

    const current = questions[currentIndex];

    function getButtonStyle(i: number, a: Answer) {
        if (!showResult) {
            if (selected === i) return { background: "grey" };
            return { background: "white" };
        }
        if (a.correct) return { background: "lightgreen" };

        if (selected === i && !a.correct) {
            return { background: "red" };
        }
        return { background: "white" };
    }

    if (finished) {
        return (
            <div style={{display: "flex", flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "80vh",
                textAlign: "center"}}>
                <h1>Quiz Complete!!</h1>
                <h2>Your Score: {score} / {questions.length}</h2>

                {/*this will need to be changed to /dashboard before merging!!*/}
                <button onClick={() => {window.location.href = "/";}}
                        style={{marginTop: "20px", padding: "12px 20px",
                            borderRadius: "8px",
                            border: "none",
                            background: "blue",
                            color: "white",
                            fontSize: "16px",
                            cursor: "pointer"}}>
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <>
            {/*this will need to be changed to /dashboard before merging!!*/}
            <button onClick={() => {window.location.href = "/";}}
                    style={{marginTop: "20px",
                        position: "fixed",
                        borderColor: "white",
                        padding: "5px",
                        left: 20,
                        borderRadius: "8px",
                        background: "transparent",
                        display: "flex",
                        justifyContent: "center",
                        color: "white",
                        cursor: "pointer"}}>
                <BsArrowLeft size={30}/>
            </button>
            <div style={{background: "blue", color: "white",
                padding: "20px",
                textAlign: "center",
                fontSize: "24px",
                fontWeight: "bold"}}>
                Quiz
            </div>

            <div style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "40px"}}>

                <div style={{width: "400px", padding: "30px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    background: "white",
                    textAlign: "center"}}>

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
                                    if (a.correct) {
                                        setScore(prev => prev + 1);
                                    }
                                }}
                                style={{width: "100%", padding: "12px",
                                    margin: "8px 0",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    transition: "0.2s",
                                    ...getButtonStyle(i, a)}}>
                            {a.text}
                        </button>))}

                    {showResult && (
                        <button onClick={() => {
                            if (currentIndex + 1 >= questions.length) {
                                setFinished(true);
                                setCompletedCount(prev => {const next = prev + 1;
                                    localStorage.setItem("quizCount", String(next));
                                    return next;});
                                return;
                            }
                            setSelected(null);
                            setShowResult(false);
                            setCurrentIndex(prev => prev + 1);
                        }}
                                style={{marginTop: "20px", width: "100%",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "lightblue",
                                    color: "black",
                                    fontSize: "16px",
                                    cursor: "pointer"}}>
                            Next
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}