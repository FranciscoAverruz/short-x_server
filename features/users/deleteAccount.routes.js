// deleteAccount.routes.js
const express = require('express');
const router = express.Router();
const { deleteAccount } = require('./deleteUserAccount.controller.js');
const verifyDeleteAuth = require('../../middlewares/verifyDeleteAuth.js');

router.delete('/:id/delete', verifyDeleteAuth, deleteAccount);

module.exports = router;
