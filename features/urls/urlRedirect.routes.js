const express = require('express');
const router = express.Router();
const { redirectUrl } = require('./redirect.controller.js');

router.get('/:shortId', redirectUrl);

module.exports = router;
