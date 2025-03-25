const express = require('express');
const router = express.Router();
const { redirectUrl } = require('./redirect.controller.js');
const { registerClick } = require('../clicks/click.controller.js');

router.get('/:shortId', redirectUrl);
router.get('/:shortId/register-click', registerClick);

module.exports = router;
