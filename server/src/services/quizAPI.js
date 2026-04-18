//services/quizAPI.js - QuizAPI integration

const axios = require("axios");

const QUIZ_API_KEY = process.env.QUIZ_API_KEY
const BASE_URL = "https://quizapi.io/api/v1/questions"


function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Search for specific quiz using QuizID
const getQuiz = async (quizID) => {
    try {
        if (!QUIZ_API_KEY || !quizID) {
            console.log("QuizAPI keys not configured");
            return {questions: []};
        }

        // Search for specific quiz
        const response = await axios.get(BASE_URL, {
            params: {
                quiz_id: quizID,
                include_answers: 'true',
            },
            headers: {
                Authorization: `Bearer ${QUIZ_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 5000,
        });

        const questions = response.data.data.map((question) => ({
                //Made two minor changes to correctly map answers, other quizAPI response items not necessarily needed?
            id: question.id,
            question: question.text,
            type: question.type,
            answers: shuffle(question.answers.map((a) => ({text: a.text, correct: a.isCorrect})))
        }));

        const selected_five = shuffle(questions).slice(0, 5);
        return {questions: selected_five};

    } catch (error) {
        console.error("Error searching questions from QuizAPI:", error.message);
        return {questions: []};
    }
};

module.exports = { getQuiz }