const express = require("express");
const verifyAuth = require("../../middlewares/verifyAuth");
const { addCustomDomain, getCustomDomains, verifyCustomDomain, deleteCustomDomain } = require("../customDomains/customDomain.controller.js");

const router = express.Router();

router.get("/", verifyAuth, getCustomDomains);
router.post("/", verifyAuth, addCustomDomain);
router.get("/verify", verifyAuth, verifyCustomDomain);
router.post("/verify", verifyAuth, verifyCustomDomain);

router.delete("/:domainId", verifyAuth, deleteCustomDomain);

module.exports = router;