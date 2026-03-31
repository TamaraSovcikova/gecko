//
// TEST ROUTES FOR CRON JOB
//

const express = require("express");
const { getTodayMessage } = require("./controllers/dailyMessage.controller.js");

const router = express.Router();

router.get("/today", getTodayMessage);

module.exports = router;
//
// TEST ROUTES FOR CRON JOB
//