const express = require('express');
const router = express.Router()

const {retUsersAll, createUser} = require('../users/user.controller.js')

router.get('/all-users', retUsersAll);
router.post('/', createUser)

module.exports = router

