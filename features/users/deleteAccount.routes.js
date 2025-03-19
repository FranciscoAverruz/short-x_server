const express = require('express');
const router = express.Router();
const { deleteAccounts } = require('./deleteUserAccount.controller.js');
const verifyDeleteAuth = require('../../middlewares/verifyDeleteAuth.js');

router.delete('/delete-accounts', verifyDeleteAuth, deleteAccounts);

module.exports = router;
