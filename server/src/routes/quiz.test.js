jest.mock("../middleware/auth", () => (req, res, next) => next());
jest.mock("../services/quizService", () => ({
  getQuiz: jest.fn(),
}));

const request = require("supertest");
const express = require("express");
const { getQuiz } = require("../services/quizService");
const quizRouter = require("./quiz");

describe("GET /v1/quiz", () => {
  it("routes a topic query to getQuiz with the original topic", async () => {
    const app = express();
    app.use("/v1/quiz", quizRouter);

    getQuiz.mockResolvedValue({
      topic: "payslip-gross-net",
      source: "custom",
      questions: [{ id: "1", question: "Placeholder", type: "multiple", answers: [] }],
    });

    const res = await request(app).get("/v1/quiz?topic=payslip-gross-net");

    expect(res.status).toBe(200);
    expect(res.body.topic).toBe("payslip-gross-net");
    expect(getQuiz).toHaveBeenCalledWith("payslip-gross-net");
  });
});
