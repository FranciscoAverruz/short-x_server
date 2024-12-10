const express = require('express');
const router = express.Router();
const { shortenUrl } = require('../urls/urlInvited.controller.js');

router.post('/shorten', shortenUrl);

module.exports = router;