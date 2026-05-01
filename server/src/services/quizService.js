const axios = require("axios");
const { CUSTOM_QUIZ_MAP, CUSTOM_TOPICS_LIST } = require("../data/customQuizzes");
const shuffle = require("../utils/shuffle");

const BASE_URL = "https://quizapi.io/v1/questions";

const DYNAMIC_TOPICS = ["JavaScript", "HTML", "CSS", "SQL", "Linux", "Docker"];

/**
 * Normalize topic string (IMPORTANT for matching frontend IDs)
 */
const normalizeTopic = (topic) => {
  if (!topic) return "";
  return topic.toString().trim().toLowerCase();
};

/**
 * Convert QuizAPI format → app format
 */
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
          answers.map((a) => ({
            text: a.text,
            correct: a.correct,
          }))
        ),
      };
    })
    .filter(Boolean);
};

/**
 * Match dynamic topics (case-insensitive)
 */
const getDynamicTopicTag = (topic) => {
  const normalized = normalizeTopic(topic);

  return (
    DYNAMIC_TOPICS.find(
      (t) => t.toLowerCase() === normalized
    ) || null
  );
};

/**
 * Get random custom topic
 */
const getRandomCustomTopic = () => {
  return CUSTOM_TOPICS_LIST[
    Math.floor(Math.random() * CUSTOM_TOPICS_LIST.length)
  ];
};

/**
 * Build custom quiz response
 */
const getCustomQuiz = (topic, reason = "") => {
  const normalized = normalizeTopic(topic);

  const questions = CUSTOM_QUIZ_MAP[normalized] || [];

  const selectedQuestions = shuffle(questions)
    .slice(0, 5)
    .map((q) => ({
      ...q,
      answers: shuffle((q.answers || []).map((a) => ({ ...a }))),
    }));

  return {
    topic: normalized,
    source: "custom",
    questions: selectedQuestions,
  };
};

/**
 * Fetch dynamic quiz from QuizAPI
 */
const fetchDynamicQuiz = async (topic) => {
  const tag = getDynamicTopicTag(topic);

  if (!tag) return null;

  const QUIZ_API_KEY = process.env.QUIZ_API_KEY;

  if (!QUIZ_API_KEY) {
    console.warn("QuizAPI key missing → skipping dynamic fetch");
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

    const payload =
      response.data?.data || response.data;

    const questions = normalizeQuizApiQuestions(payload);

    if (!questions.length) {
      console.warn(`No dynamic questions for '${topic}'`);
      return null;
    }

    return {
      topic: normalizeTopic(topic),
      source: "dynamic",
      questions: shuffle(questions).slice(0, 5),
    };
  } catch (err) {
    console.warn(`Dynamic quiz failed for '${topic}': ${err.message}`);
    return null;
  }
};

/**
 * MAIN ENTRY
 */
const getQuiz = async (topic) => {
  const requestedTopic = normalizeTopic(topic);

  console.log("Requested topic:", requestedTopic);

  if (!requestedTopic) {
    const randomTopic = getRandomCustomTopic();

    console.log("→ No topic provided, using RANDOM:", randomTopic);

    return getCustomQuiz(randomTopic, "no topic provided");
  }

  const dynamicTag = getDynamicTopicTag(requestedTopic);

  if (dynamicTag) {
    const dynamicQuiz = await fetchDynamicQuiz(requestedTopic);

    if (dynamicQuiz && dynamicQuiz.questions.length > 0) {
      console.log("→ Using dynamic quiz:", requestedTopic);
      return dynamicQuiz;
    }

    console.warn("→ Dynamic failed, falling back to custom");
  }

  if (!CUSTOM_QUIZ_MAP[requestedTopic]) {
    console.warn(`Topic mismatch: '${requestedTopic}' not found`);
    console.warn("Available topics:", Object.keys(CUSTOM_QUIZ_MAP));

    const randomTopic = getRandomCustomTopic();

    console.warn("→ Falling back to RANDOM:", randomTopic);

    return getCustomQuiz(randomTopic, "fallback (invalid topic)");
  }

  console.log("→ Using EXACT custom topic:", requestedTopic);

  return getCustomQuiz(requestedTopic, "exact match");
};

module.exports = {
  getQuiz,
};