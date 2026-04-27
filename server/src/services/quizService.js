const axios = require("axios");
const { CUSTOM_QUIZ_MAP, CUSTOM_TOPICS_LIST } = require("../data/customQuizzes");

const BASE_URL = "https://quizapi.io/api/v1/questions";

const DYNAMIC_TOPICS = ["JavaScript", "HTML", "CSS", "SQL", "Linux", "Docker"];

// Quiz data is imported from ../data/customQuizzes.js
// - CUSTOM_QUIZ_MAP: object with all custom quiz questions
// - DEFAULT_CUSTOM_TOPIC: default topic for fallback
// - CUSTOM_TOPICS_LIST: precomputed list of custom topic keys for efficient random selection

const normalizeTopic = (topic) => {
  if (!topic) return "";
  return topic.toString().trim();
};

const shuffle = (array) => {
  const items = [...array];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const normalizeQuizApiQuestions = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .map((question) => {
      if (!question || !question.id || !question.text || !question.answers) {
        return null;
      }

      const answers = Array.isArray(question.answers)
        ? question.answers
        : Object.values(question.answers || {}).map((answer) => ({
            text: answer.text || answer,
            correct: answer.isCorrect || false,
          }));

      return {
        id: question.id,
        question: question.text,
        type: question.type || "multiple",
        answers: shuffle(
          answers.map((answer) => ({
            text: answer.text,
            correct: answer.correct,
          })),
        ),
      };
    })
    .filter(Boolean);
};

const getDynamicTopicTag = (topic) => {
  const normalized = normalizeTopic(topic).toLowerCase();
  return DYNAMIC_TOPICS.find((dynamicTopic) => dynamicTopic.toLowerCase() === normalized) || null;
};

const getRandomCustomTopic = () => {
  return CUSTOM_TOPICS_LIST[Math.floor(Math.random() * CUSTOM_TOPICS_LIST.length)];
};

const getCustomQuiz = (topic, reason = "") => {
  const normalized = normalizeTopic(topic).toLowerCase();
  const chosenKey = CUSTOM_QUIZ_MAP[normalized] ? normalized : getRandomCustomTopic();
  const customQuestions = CUSTOM_QUIZ_MAP[chosenKey] || [];

  console.log(`Using custom quiz for '${chosenKey}' (requested: '${topic}')${reason ? ` - ${reason}` : ""}`);

  const selectedQuestions = shuffle(customQuestions)
    .slice(0, 5)
    .map((question) => ({
      ...question,
      answers: shuffle((question.answers || []).map((answer) => ({ ...answer }))),
    }));

  return {
    topic: chosenKey,
    source: "custom",
    questions: selectedQuestions,
  };
};

const fetchDynamicQuiz = async (topic) => {
  const tag = getDynamicTopicTag(topic);
  if (!tag) {
    return null;
  }

  const QUIZ_API_KEY = process.env.QUIZ_API_KEY;
  if (!QUIZ_API_KEY) {
    console.warn("QuizAPI key is not configured, skipping dynamic fetch");
    return null;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        tags: tag,
        include_answers: "true",
        limit: 10,
      },
      headers: {
        Authorization: `Bearer ${QUIZ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    const payload = response.data && response.data.data ? response.data.data : response.data;
    const questions = normalizeQuizApiQuestions(payload);

    if (questions.length === 0) {
      console.warn(`QuizAPI returned no questions for dynamic topic '${topic}'`);
      return null;
    }

    const selectedQuestions = shuffle(questions).slice(0, 5);
    return {
      topic,
      source: "dynamic",
      questions: selectedQuestions,
    };
  } catch (error) {
    console.warn(`QuizAPI dynamic fetch failed for topic '${topic}': ${error.message}`);
    return null;
  }
};

const getQuiz = async (topic) => {
  console.log("getQuiz called at", new Date().toISOString());
  const requestedTopic = normalizeTopic(topic);

  if (!requestedTopic) {
    const randomTopic = getRandomCustomTopic();   
    return getCustomQuiz(randomTopic, "no topic provided, random selection");
  }

  const dynamicTag = getDynamicTopicTag(requestedTopic);
  if (dynamicTag) {
    const dynamicQuiz = await fetchDynamicQuiz(requestedTopic);
    if (dynamicQuiz && dynamicQuiz.questions.length > 0) {
      return dynamicQuiz;
    }

    console.warn(`QuizAPI fallback: dynamic topic '${requestedTopic}' returned no questions`);
    return getCustomQuiz(requestedTopic, "dynamic topic fallback");
  }

  return getCustomQuiz(requestedTopic, "custom topic match");
};

module.exports = {
  getQuiz,
};