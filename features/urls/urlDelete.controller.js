const Url = require("../urls/Url.model.js");
const User = require("../users/User.model.js");
const { validateShortIds } = require("../../utils/validateShortIds.js");

const MAX_DELETE_LIMIT = 10;

const deleteMultipleUrls = async (req, res) => {
  const userId = req.user.id;
  const { shortIds } = req.body;

  const { error } = validateShortIds(shortIds, MAX_DELETE_LIMIT);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const deletedUrls = await Url.deleteMany({
      shortId: { $in: shortIds },
      user: userId,
    });

    if (deletedUrls.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "NO_URLS", message: "No URLs found or not authorized" });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { urls: { $in: shortIds } },
    });

    res.status(200).json({
      message: `${deletedUrls.deletedCount} URLs deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({ error: "The process could not be completed" });
  }
};

module.exports = {
  deleteMultipleUrls,
};
