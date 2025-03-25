const CustomDomain = require("../customDomains/CustomDomain.model.js"); 
const User = require("../users/User.model.js"); 
const crypto = require("crypto");
const { sendEmail } = require("../../utils/email.js");
const { FRONTEND_URL } = require("../../config/env.js")
const path = require("path");

// Adds a new custom domain  ****************************************************
const addCustomDomain = async (req, res) => {
  try {
    const { domain } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).populate("subscription", "plan");
    if (!user || !user.subscription || !user.subscription.plan.includes("premium")) {
      return res.status(403).json({ message: "Premium plan required for custom domains" });
    }

    const existingDomain = await CustomDomain.findOne({ domain });
    if (existingDomain) {
      return res.status(400).json({ message: "Domain already registered" });
    }

    const verificationToken = crypto.randomBytes(16).toString("hex");

    const newDomain = await CustomDomain.create({
      user: userId,
      domain,
      verificationToken,
    });

    user.customDomains.push(newDomain._id);
    await user.save();

    const verificationLink = `${FRONTEND_URL}/dashboard/domains/verify-domain?token=${verificationToken}&domain=${encodeURIComponent(domain)}`;

    const subject = "Verificación de Dominio Personalizado";
    const templatePath = path.resolve(__dirname, "../email/templates/customDomainVerificationEmail.html");
    const replacements = {
      domain,
      verificationToken,
      verificationLink,
    };

    await sendEmail(user.email, subject, templatePath, replacements);

    res.status(201).json({ message: "Domain added. Please verify it." });
  } catch (error) {
    console.error("Error adding custom domain:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Gets user's Domains  *********************************************************
const getCustomDomains = async (req, res) => {
  try {
    const domains = await CustomDomain.find({ user: req.user.id }).select("domain verified");
    res.json(domains);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Verifies custom domains  *****************************************************
const verifyCustomDomain = async (req, res) => {
  try {
    const { token: queryToken, domain: queryDomain } = req.query;
    const { token: bodyToken, domain: bodyDomain } = req.body;

    const verificationToken = queryToken || bodyToken;
    const domainToVerify = queryDomain || bodyDomain;

    if (!verificationToken || !domainToVerify) {
      return res.status(400).json({ message: "Missing token or domain" });
    }

    const customDomain = await CustomDomain.findOne({ domain: domainToVerify });
    if (!customDomain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    if (customDomain.verificationToken !== verificationToken) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    customDomain.verified = true;
    customDomain.verificationToken = null;
    await customDomain.save();

    if (queryToken) {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/domains/verify-domain?status=success`
      );
    }

    return res.status(200).json({ message: "Domain verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Deletes custom domains  ******************************************************
const deleteCustomDomain = async (req, res) => {
  try {
    const { domainId } = req.params;
    const userId = req.user.id;

    const domain = await CustomDomain.findOne({ _id: domainId, user: userId });
    if (!domain) {
      return res.status(404).json({ message: "Domain not found or unauthorized" });
    }

    await User.findByIdAndUpdate(userId, { $pull: { customDomains: domainId } });

    await domain.deleteOne();
    res.json({ message: "Domain deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
    addCustomDomain,
    getCustomDomains,
    verifyCustomDomain,
    deleteCustomDomain
};
