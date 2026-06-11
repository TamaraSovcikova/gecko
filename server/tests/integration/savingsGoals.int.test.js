// tests/integration/savingsGoals.int.test.js
// Integration tests for the savings goals API.
// Journey: create goal -> contribute -> update -> delete

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const mockVerifyIdToken = jest.fn();

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn() },
  auth: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_CLIENT_EMAIL = "test@test-project.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----\\n";

jest.mock("../../src/services/forecastService", () => ({
  computeForecastForUser: jest.fn().mockResolvedValue({ warnings: [], forecast: [] }),
}));
jest.mock("../../src/services/adzunaCalculator", () => ({
  getAverageSalary: jest.fn().mockResolvedValue(35000),
}));

let mongoServer;
let app;
const TEST_UID = "savings-test-uid-001";
const AUTH_HEADER = "Bearer test-savings-token";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  mockVerifyIdToken.mockResolvedValue({ uid: TEST_UID });
  app = require("../../src/app");
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
});

describe("Savings Goals API", () => {
  it("GET /api/v1/savings returns empty array initially", async () => {
    const res = await request(app).get("/api/v1/savings").set("Authorization", AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it("POST /api/v1/savings creates a goal", async () => {
    const res = await request(app)
      .post("/api/v1/savings")
      .set("Authorization", AUTH_HEADER)
      .send({ name: "Holiday fund", targetAmount: 1000, category: "travel", emoji: "✈️", color: "#5c3fa3" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Holiday fund");
    expect(res.body.targetAmount).toBe(1000);
    expect(res.body.currentAmount).toBe(0);
  });

  it("POST /api/v1/savings/:id/contribute adds contribution", async () => {
    const create = await request(app)
      .post("/api/v1/savings")
      .set("Authorization", AUTH_HEADER)
      .send({ name: "Emergency fund", targetAmount: 500, category: "emergency" });
    expect(create.status).toBe(201);
    const id = create.body._id;

    const contrib = await request(app)
      .post(`/api/v1/savings/${id}/contribute`)
      .set("Authorization", AUTH_HEADER)
      .send({ amount: 100, note: "First deposit" });
    expect(contrib.status).toBe(200);
    expect(contrib.body.currentAmount).toBe(100);
    expect(contrib.body.contributions.length).toBe(1);
  });

  it("marks goal complete when fully funded", async () => {
    const create = await request(app)
      .post("/api/v1/savings")
      .set("Authorization", AUTH_HEADER)
      .send({ name: "Small goal", targetAmount: 50, category: "other" });
    const id = create.body._id;

    const contrib = await request(app)
      .post(`/api/v1/savings/${id}/contribute`)
      .set("Authorization", AUTH_HEADER)
      .send({ amount: 50 });
    expect(contrib.body.isCompleted).toBe(true);
    expect(contrib.body.completedAt).toBeTruthy();
  });

  it("PATCH /api/v1/savings/:id updates allowed fields", async () => {
    const create = await request(app)
      .post("/api/v1/savings")
      .set("Authorization", AUTH_HEADER)
      .send({ name: "Old name", targetAmount: 200, category: "other" });
    const id = create.body._id;

    const patch = await request(app)
      .patch(`/api/v1/savings/${id}`)
      .set("Authorization", AUTH_HEADER)
      .send({ name: "New name", targetAmount: 300 });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe("New name");
    expect(patch.body.targetAmount).toBe(300);
  });

  it("DELETE /api/v1/savings/:id removes a goal", async () => {
    const create = await request(app)
      .post("/api/v1/savings")
      .set("Authorization", AUTH_HEADER)
      .send({ name: "To delete", targetAmount: 100, category: "other" });
    const id = create.body._id;

    const del = await request(app).delete(`/api/v1/savings/${id}`).set("Authorization", AUTH_HEADER);
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app).get("/api/v1/savings").set("Authorization", AUTH_HEADER);
    expect(list.body.length).toBe(0);
  });

  it("returns 404 for unknown goal", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/v1/savings/${fakeId}`).set("Authorization", AUTH_HEADER);
    expect(res.status).toBe(404);
  });
});
