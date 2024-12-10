const validator = require("validator");
const Url = require("../features/urls/Url.model.js");

// validate shortIDs array before deletion
const validateShortIds = (shortIds, maxLimit) => {
  if (!Array.isArray(shortIds) || shortIds.length === 0) {
    return { error: "shortIds must be a non-empty array" };
  }

  if (shortIds.length > maxLimit) {
    return { error: `You can delete a maximum of ${maxLimit} URLs at a time` };
  }

  return { error: null };
};

const validateUrl = (url) => {
  if (!validator.isURL(url)) {
    return { error: "Invalid URL" };
  }
  return { error: null };
};

const validateCustomIdAvailability = async (customId) => {
  if (customId) {
    const existingUrl = await Url.findOne({ shortId: customId });
    if (existingUrl) {
      return { error: "Custom ID already in use" };
    }
  }
  return { error: null };
};

module.exports = {
  validateShortIds,
  validateUrl,
  validateCustomIdAvailability,
};
