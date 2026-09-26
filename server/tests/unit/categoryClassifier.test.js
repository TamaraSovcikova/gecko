// Unit tests for the keyword layer of the category classifier.
// The history layer hits MongoDB so it is not tested here (covered by integration tests).

jest.mock("../../src/models/Expense", () => ({
  find: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
}));

const { classify } = require("../../src/services/categoryClassifier");

describe("categoryClassifier - keyword layer", () => {
  it("classifies Tesco as Food & Drink", async () => {
    const result = await classify("user1", "Tesco Metro Oxford Street");
    expect(result).not.toBeNull();
    expect(result.category).toBe("Food & Drink");
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("classifies TfL as Transport", async () => {
    const result = await classify("user1", "TfL Oyster card top-up");
    expect(result).not.toBeNull();
    expect(result.category).toBe("Transport");
  });

  it("classifies Netflix as Entertainment", async () => {
    const result = await classify("user1", "Netflix monthly subscription");
    expect(result).not.toBeNull();
    expect(result.category).toBe("Entertainment");
  });

  it("classifies Pure Gym as Health", async () => {
    const result = await classify("user1", "Pure Gym monthly membership");
    expect(result).not.toBeNull();
    expect(result.category).toBe("Health");
  });

  it("returns null or low-confidence for unrecognised description", async () => {
    const result = await classify("user1", "xyzzzz123abc");
    if (result !== null) {
      expect(result.confidence).toBeLessThan(0.7);
    }
  });

  it("returns method=keyword for rule-matched results", async () => {
    const result = await classify("user1", "Sainsbury's weekly shop");
    if (result) {
      expect(result.method).toBe("keyword");
    }
  });
});
