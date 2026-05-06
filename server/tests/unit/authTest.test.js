/*
server/src/tests/authTest.test.js

BACKEND
Invalid / Expired Token:
Mock the Firebase Admin SDK to throw an error, and assert it’s caught and
returns a 401 Unauthorized when an invalid token is passed.

What it Prevents:
- An Invalid Auth Token
- Token Expiry / Replay Attacks
*/

// mock firebase without initialising it
// if firebase is initialised, test will FAIL
// comments are based on GIVEN, WHEN, THEN convention

const mockVerifyIdToken = jest.fn();

jest.mock("firebase-admin", () => ({
  auth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdateOne = jest.fn();

jest.mock("../../src/models/User", () => ({
  findById: (...args) => mockFindById(...args),
  create: (...args) => mockCreate(...args),
  updateOne: (...args) => mockUpdateOne(...args),
}));

const authMiddleware = require("../../src/middleware/auth");

describe("authMiddleware middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    mockVerifyIdToken.mockReset();
    mockFindById.mockReset();
    mockCreate.mockReset();
    mockUpdateOne.mockReset();
  });

  test("returns 401 when no token is provided", async () => {
    // GIVEN: an incoming HTTP request with no Authorization header at all
    req.headers.authorization = undefined;

    // WHEN: the authentication middleware is executed on the request
    await authMiddleware(req, res, next);

    // THEN: the request is rejected immediately as unauthorized
    // and no downstream route handler is called
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized - no token provided",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when token is invalid", async () => {
    // GIVEN: a request containing a Bearer token that Firebase cannot verify
    req.headers.authorization = "Bearer bad_token";

    // AND: Firebase Admin is mocked to reject the token verification step
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

    // WHEN: the authentication middleware attempts to verify the token
    await authMiddleware(req, res, next);

    // THEN: the middleware rejects the request as unauthorized
    // and does not pass control to the next middleware/route handler
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized - invalid or expired token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("creates a user if token is valid but user does not exist", async () => {
    // GIVEN: a valid Firebase-authenticated request with a Bearer token
    req.headers.authorization = "Bearer valid_token";

    // AND: Firebase successfully verifies the token and returns user identity data
    mockVerifyIdToken.mockResolvedValue({
      uid: "123",
      email: "test@test.com",
      name: "Test User",
    });

    // AND: MongoDB does NOT yet contain a user with this UID
    mockFindById.mockResolvedValue(null);

    // WHEN: the authentication middleware processes the request
    await authMiddleware(req, res, next);

    // THEN: the request is allowed to continue through the pipeline
    expect(next).toHaveBeenCalled();

    // AND: req.user is correctly populated from the decoded token
    expect(req.user).toBeDefined();
    expect(req.user.uid).toBe("123");
    expect(req.user.id).toBe("123");

    // AND: a new user document is created in MongoDB
    expect(mockCreate).toHaveBeenCalledWith({
      _id: "123",
      email: "test@test.com",
      displayName: "Test User",
    });

    // AND: no update operation is triggered because the user is new
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("updates email if user exists but email changed", async () => {
    // GIVEN: a valid authenticated request with updated email data
    req.headers.authorization = "Bearer valid_token";

    // AND: Firebase returns a verified token with a different email
    mockVerifyIdToken.mockResolvedValue({
      uid: "123",
      email: "new@test.com",
      name: "Test User",
    });

    // AND: a user already exists in MongoDB with an older email
    mockFindById.mockResolvedValue({
      _id: "123",
      email: "old@test.com",
    });

    // WHEN: the authentication middleware processes the request
    await authMiddleware(req, res, next);

    // THEN: the request continues normally to the next handler
    expect(next).toHaveBeenCalled();

    // AND: the user's email is updated in MongoDB
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: "123" },
      expect.objectContaining({
        $set: { email: "new@test.com" },
        $push: expect.any(Object),
      })
    );
  });
});