//this file used for thae actual backend data implementation.
//for time being, it will contain mock data so I can get to grips with how frontend works...
function getTestQuiz() {
    return { //these tst questions should be in the format which Quizgecko backend will return: https://quizgecko.com/api-docs
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

module.exports = { getTestQuiz };