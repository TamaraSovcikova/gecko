//services/quizAPI.js - QuizAPI integration

const axios = require("axios");

const QUIZ_API_KEY = process.env.QUIZ_API_KEY
const BASE_URL = "https://quizapi.io/api/v1/questions"

// Search for specific quiz using QuizID
const getQuiz = async (quizID) => {
    try {
        if (!QUIZ_API_KEY) {
            console.log("QuizAPI keys not configured");
            return [];
        }

        // Search for specific quiz
        const response = await axios.get(BASE_URL, {
            params: {
                quiz_id: quizID,
                include_answers: 'true',
            },
            headers: {
                Authorization: `Bearer ${QUIZ_API_KEY}`,
            },
            timeout: 5000,
        });

        if (response.data) {
            const questions = response.data.data.map((question) => ({
                //Made two minor changes to correctly map answers, other quizAPI response items not necessarily needed?
                id: question.id,
                //quizId: question.quizId,
                question: question.text,
                type: question.type,
                //difficulty: question,
                //explanation: question.count,
                //category: question.category,
                answers: question.answers.map((a) => ({text: a.text, correct: a.isCorrect})),
            }));
            console.log(`Question search returned ${response.data.data.length} results for quiz: ${quizID}`);
            let quizQs = new Object();
            quizQs["questions"] = questions;
            return quizQs;
        }

        return [];
    } catch (error) {
        console.error("Error searching questions from QuizAPI:", error.message);
        return [];
    }
};

module.exports = { getQuiz }