const Url = require("../urls/Url.model.js");
const Click = require("../clicks/Click.model.js");
const User = require("../users/User.model.js");
const { getIo } = require("../../sockets/socket.js");
const { FRONTEND_URL } = require("../../config/env.js");

async function getUrlStats(req, res) {
  const userId = req.user.id;
  const shortId = req.params.shortId;

  try {
    const url = await Url.findOne({ shortId, user: userId }).populate(
      "customDomain"
    );

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    const user = await User.findById(userId).populate("subscription");
    const userSubscription = user.subscription ? user.subscription.plan : null;

    const clicks = await Click.aggregate([
      { $match: { url: url._id } },
      {
        $group: {
          _id: {
            country: {
              $ifNull: [
                { $arrayElemAt: [{ $split: ["$location", ", "] }, 1] },
                "Unknown",
              ],
            },
            device: "$deviceType",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    let response = {
      shortLink: url.shortId,
      originalUrl: url.originalUrl,
      totalClicks: clicks.reduce((acc, click) => acc + click.count, 0),
      locationsCount: {},
      mobileClicks: 0,
      desktopClicks: 0,
      expiresAt: url.expiresAt,
      id: url._id,
      customDomain: url.customDomain ? url.customDomain.domain : FRONTEND_URL,
    };

    response = clicks.reduce((acc, click) => {
      const country = click._id.country;
      const device = click._id.device;

      // clicks by country
      acc.locationsCount[country] =
        (acc.locationsCount[country] || 0) + click.count;

      // clicks by device
      if (device === "mobile") {
        acc.mobileClicks += click.count;
      } else if (device === "desktop") {
        acc.desktopClicks += click.count;
      }

      return acc;
    }, response);

    // Adds details according to subscription type
    if (userSubscription?.startsWith("pro")) {
      response.deviceClicks = clicks.reduce((acc, click) => {
        acc[click._id.device] = (acc[click._id.device] || 0) + click.count;
        return acc;
      }, {});
    }

    if (userSubscription?.startsWith("premium")) {
      response.locationsWithDevices = clicks.reduce((acc, click) => {
        if (!acc[click._id.country]) {
          acc[click._id.country] = {};
        }
        acc[click._id.country][click._id.device] = click.count;
        return acc;
      }, {});
    }

    const io = getIo();
    io.emit("urlStatsUpdated", response);

    return res.json(response);
  } catch (err) {
    console.error("Error fetching URL stats:", err);
    return res
      .status(500)
      .json({ error: "Error fetching URL stats", details: err.message });
  }
}

module.exports = { getUrlStats };
