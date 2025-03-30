const express = require("express");
const { getUserStats } = require("./getUserStats.controller.js");
const { getUrlStats } = require("./getUrlStats.controller.js");
const router = express.Router();

router.get("/", getUserStats);
router.get("/:shortId", getUrlStats);

module.exports = router;
