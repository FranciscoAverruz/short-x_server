const Url = require("../urls/Url.model.js");
const User = require("../users/User.model.js");
const CustomDomain = require("../customDomains/CustomDomain.model.js");
const { v4: uuidv4 } = require("uuid");
const { validateUrl } = require("../../utils/validateShortIds.js");

const shortenUrlForUser = async (req, res) => {
  const { originalUrl, customId, customDomain } = req.body;
  const userId = req.user.id;

  const urlValidation = validateUrl(originalUrl);
  if (urlValidation.error) {
    return res.status(400).json({ error: urlValidation.error });
  }

  try {
    const user = await User.findById(userId).populate("subscription", "plan");
    const userPlan = user?.subscription?.plan || "free";

    let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (userPlan.includes("pro")) {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (userPlan.includes("premium")) {
      expiresAt = null;
    }

    // custom domain handling
    let selectedDomain = null;
    if (customDomain) {
      const domainRecord = await CustomDomain.findOne({
        domain: customDomain,
        user: userId,
        verified: true,
      });
      if (!domainRecord) {
        return res
          .status(400)
          .json({ error: "Invalid or unverified custom domain." });
      }
      selectedDomain = domainRecord._id;
    }

    // shortId validation
    if (customId) {
      const existingShortId = await Url.findOne({ shortId: customId });
      if (
        existingShortId &&
        existingShortId.customDomain?.toString() !== selectedDomain?.toString()
      ) {
        return res
          .status(400)
          .json({ error: "Short ID already used in a different domain." });
      }
    }

    const shortId = customId || uuidv4().slice(0, 8);

    // Checks duplicate existence
    const existingShortId = await Url.findOne({
      shortId,
      customDomain: { $ne: selectedDomain },
    });
    if (existingShortId) {
      return res
        .status(400)
        .json({ error: "Short ID already used in a different domain." });
    }

    const newUrl = await Url.create({
      originalUrl,
      shortId,
      customDomain: selectedDomain,
      user: userId,
      expiresAt,
    });

    return res.status(201).json({
      message: "URL shortened successfully",
      data: newUrl,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
};

module.exports = { shortenUrlForUser };
