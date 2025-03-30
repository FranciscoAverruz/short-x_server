const express = require("express");
const router = express.Router();

const { retUsersAll } = require("../users/user.controller.js");
const { signupUser } = require("../auth/auth.controller.js");

router.get("/all-users", retUsersAll);
router.post("/", signupUser);

module.exports = router;
