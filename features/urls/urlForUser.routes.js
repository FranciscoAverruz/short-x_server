const express = require('express');
const router = express.Router();
const { shortenUrlForUser } = require('../urls/urlForUser.controller.js');
const { deleteMultipleUrls } = require('../urls/urlDelete.controller.js');

router.post('/shorten', shortenUrlForUser); // Rooute to create a new short URL
router.delete('/delete', deleteMultipleUrls); // Deletes saved URLs

module.exports = router;