const Url = require("../urls/Url.model.js");
const Click = require("../clicks/Click.model.js");

async function getUserStats(req, res) {
  const userId = req.user.id;

  // get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalUrls = await Url.countDocuments({ user: userId });
    if (totalUrls === 0) {
      return res.json({
        stats: [],
        pagination: {
          totalUrls: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
      });
    }
    // retrieve paginated URLs with general stats
    const urls = await Url.find({ user: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalUrls / limit);

    const stats = await Promise.all(
      urls.map(async (url) => {
        const totalClicks = await Click.countDocuments({ url: url._id });
        return {
          shortLink: url.shortId,
          originalUrl: url.originalUrl,
          totalClicks: totalClicks,
        };
      })
    );

    return res.json({
      stats,
      pagination: {
        totalUrls,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error("Error fetching user stats:", err);
    return res.status(500).json({ error: "Error fetching user stats", details: err.message });
  }
}

module.exports = { getUserStats };