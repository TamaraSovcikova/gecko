import { useEffect, useState } from "react";

type Answer = {
    text: string;
    correct: boolean;
};

type Question = {
    id: string;
    question: string;
    answers: Answer[];
};

export default function QuizPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        fetch("http://localhost:3000/api/v1/quiz")//i know this is hardcoded endpoint but, it's just for test data monetrily
            .then(res => res.json())
            .then(data => setQuestions(data.questions));
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
            return { background: "lightblue" };
        }
        return { background: "white" };
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>Quiz</h2>
            <h3>{current.question}</h3>
            {current.answers.map((a, i) => (
                <button
                    key={i}
                    onClick={() => {
                        if (showResult) return;
                        setSelected(i);
                        setShowResult(true);
                    }}
                    style={{
                        display: "block",
                        margin: "10px 0",
                        ...getButtonStyle(i, a)
                    }}>
                    {a.text}
                </button>
            ))}

            <button
                onClick={() => {
                    setSelected(null);
                    setShowResult(false);
                    setCurrentIndex(prev => prev + 1);
                }}>
                Next
            </button>
        </div>
    );
}