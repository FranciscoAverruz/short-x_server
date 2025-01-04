const express = require('express');
const router = express.Router()

const { loginUser, signupUser, logoutUser } = require('./auth.controller.js')
const verifyAuth = require('../../middlewares/verifyAuth.js');
const { requestPasswordReset } = require('../users/userPassword.controller.js')

router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/logout', verifyAuth, logoutUser);
router.post('/request-newpassword', requestPasswordReset);

module.exports = router