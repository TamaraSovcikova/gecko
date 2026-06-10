// middleware/validate.js - Zod-backed validation middleware.
//
// Usage:
//   router.post("/", validate({ body: expenseCreateSchema }), createExpense);
//
// On success: req.body / req.query / req.params are replaced with the parsed (and
// coerced) values, so handlers can trust them.
// On failure: 400 with a flat list of issues.

const { ZodError } = require("zod");

const formatIssues = (err) =>
  err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Invalid request",
        issues: formatIssues(err),
      });
    }
    next(err);
  }
};

module.exports = { validate };
