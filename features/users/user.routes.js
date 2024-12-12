const express = require('express')
const router = express.Router()

const { retUserById, updateUser, changePassword } = require('./user.controller.js')
const { cancelAccountDeletion } = require('./deleteUserAccount.controller.js');
const { requestAccountDeletion } = require('./deletionRequest.controller.js');
const urlUser = require('../urls/urlForUser.routes.js');
const statsRoutes = require('../stats/stats.routes.js');

router.get('/:id', retUserById );

router.put('/:id', updateUser );
router.put('/:id/password', changePassword);

router.post('/:id/request-deletion', requestAccountDeletion);
router.post('/:id/cancel-deletion', cancelAccountDeletion);

router.use("/:id/urls", urlUser);  // Performs URL actions: shorten the URL and delete if necessary.
router.use("/:id/stats", statsRoutes); // statistics for registeres users

module.exports = router
