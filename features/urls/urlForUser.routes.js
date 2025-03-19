const express = require('express');
const router = express.Router();
const { shortenUrlForUser } = require('./urlForUser.controller.js');
const { deleteMultipleUrls } = require('./urlDelete.controller.js');
const { updateUrl } = require('./editUrlController.js')

router.post('/shorten', shortenUrlForUser);
router.delete('/delete', deleteMultipleUrls);
router.put("/:id", updateUrl);

module.exports = router;