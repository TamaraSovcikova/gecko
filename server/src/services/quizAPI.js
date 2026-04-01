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
            //Removed some elements from json response to match Tom's frontend
            id: question.id,
            //quizId: question.quizId,
            question: question.text,
            type: question.type,
            //difficulty: question,
            //explanation: question.count,
            //category: question.category,
            answers: question.answers,
        }));
      console.log(`Question search returned ${response.data.data.length} results for quiz: ${quizID}`);
      //questions.forEach((question) => {
      //  console.log(`${question.question}`)
      //})
      let quizQs = new Object();
      quizQs["questions"] = questions;
      //console.log(`${JSON.stringify(quizQs)}`)
      return quizQs;
    }

    return [];
  } catch (error) {
    console.error("Error searching questions from QuizAPI:", error.message);
    return [];
  }
};

module.exports = {
    getQuiz
}

function getTestQuiz() {
    return { //these tst questions should be in the format which QuizAPI backend will return: https://quizgecko.com/api-docs
        "questions":[
            {
                "id": "1",
                "question": "What questions is this?",
                "type": "multiple_choice",
                "answers": [
                    {"text": "1", "correct": true},
                    {"text": "2", "correct": false},
                    {"text": "3", "correct": false},
                    {"text": "4", "correct": false}
                ]
            },
            {
                "id": "2",
                "question": "What is (198/(99/3))-3?",
                "type": "multiple_choice",
                "answers": [
                    {"text": "1", "correct": false},
                    {"text": "2", "correct": false},
                    {"text": "3", "correct": true},
                    {"text": "4", "correct": false}
                ]
            }
        ]
    }
}

//module.exports = { getTestQuiz };
