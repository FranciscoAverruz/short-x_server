const express = require('express');
const router = express.Router()

const { loginUser, signupUser, logoutUser } = require('./auth.controller.js')
const verifyAuth = require('../../middlewares/verifyAuth.js');

router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/logout', verifyAuth, logoutUser);

module.exports = router