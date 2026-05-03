jest.mock("axios");

const axios = require("axios");
const { CUSTOM_QUIZ_MAP } = require("../data/customQuizzes");
const { getQuiz } = require("./quizService");

describe("quizService", () => {
  beforeEach(() => {
    process.env.QUIZ_API_KEY = "test-key";
    axios.get.mockReset();
  });

  it("uses dynamic QuizAPI for whitelisted topics and returns a dynamic source", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          id: "1",
          text: "What is JavaScript?",
          type: "multiple",
          answers: [
            { text: "A programming language", isCorrect: true },
            { text: "A food", isCorrect: false },
          ],
        },
      ],
    });

    const result = await getQuiz("JavaScript");

    expect(result.topic).toBe("javascript");
    expect(result.source).toBe("dynamic");
    expect(result.questions.length).toBe(1);
    expect(axios.get).toHaveBeenCalledWith("https://quizapi.io/v1/questions", {
      params: {
        tags: "JavaScript",
        include_answers: "true",
        limit: 10,
      },
      headers: {
        Authorization: `Bearer ${process.env.QUIZ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });
  });

  it("falls back to the custom quiz when QuizAPI returns no results for a dynamic topic", async () => {
    axios.get.mockResolvedValue({
      data: [],
    });

    const result = await getQuiz("JavaScript");

    expect(result.source).toBe("custom");
    expect(result.questions.length).toBeGreaterThan(0);
  });

  it("returns a custom quiz for finance topics without calling QuizAPI", async () => {
    const result = await getQuiz("payslip-gross-net");

    expect(result.source).toBe("custom");
    expect(result.questions.length).toBeGreaterThan(0);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("shuffles custom quiz answers while preserving the correct answer", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockImplementation(() => 0);

    const result = await getQuiz("payslip-gross-net");
    const returnedQuestion = result.questions.find((q) => q.id === "payslip-1");

    expect(returnedQuestion).toBeDefined();
    expect(returnedQuestion.answers.length).toBe(4);
    expect(returnedQuestion.answers[0].text).not.toBe(
      CUSTOM_QUIZ_MAP["payslip-gross-net"][0].answers[0].text,
    );
    expect(
      returnedQuestion.answers.some(
        (answer) => answer.correct && answer.text === "Pay before deductions",
      ),
    ).toBe(true);

    randomSpy.mockRestore();
  });

  it("returns a random custom quiz when no topic is provided", async () => {
    const result = await getQuiz();

    expect(result.source).toBe("custom");
    expect(result.topic).toBeDefined();
    expect(result.questions.length).toBeGreaterThan(0);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
