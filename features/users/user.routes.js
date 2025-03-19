const express = require('express')
const router = express.Router()

const { retUserById, updateUser } = require('./user.controller.js')
const { cancelAccountDeletion } = require('./deleteUserAccount.controller.js');
const { requestAccountDeletion } = require('./deletionRequest.controller.js');
const { setupPassword, changePassword } = require('../users/userPassword.controller.js')
const verifyOwnership = require('../../middlewares/verifyOwnership.js');
const urlUser = require('../urls/urlForUser.routes.js');
const statsRoutes = require('../stats/stats.routes.js');
const customDomainRoutes = require("../customDomains/customDomain.routes.js");

router.get('/:id', verifyOwnership, retUserById );

router.put('/:id', verifyOwnership, updateUser );
router.put('/:id/change-password', verifyOwnership, changePassword);

router.post('/:id/setup-password', verifyOwnership, setupPassword);
router.post('/:id/request-deletion', verifyOwnership, requestAccountDeletion);
router.post('/:id/cancel-deletion', verifyOwnership, cancelAccountDeletion);

router.use("/:id/urls", verifyOwnership, urlUser);
router.use("/:id/stats", verifyOwnership, statsRoutes);

router.use("/:id/custom-domains", customDomainRoutes);

module.exports = router
