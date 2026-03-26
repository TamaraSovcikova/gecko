// routes/payslip.js — Authentication routes.

const express = require("express");
// Creating an express router to group endpoints together
const router = express.Router();
// To restrict access to users with auth
const authMiddleware = require("../middleware/auth");

// Importing POST or GET functions from the controller
const {
  createPayslip,
  getPayslip,
  updatePayslip
} = require("../controllers/payslipController");

router.post("/", createPayslip);
router.get("/", getPayslip);
router.put("/", updatePayslip);

module.exports = router;