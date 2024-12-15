const Url = require("../urls/Url.model.js");
const Click = require("../clicks/Click.model.js");
const { getIo } = require("../../sockets/socket.js");

async function getUrlStats(req, res) {
    const userId = req.user.id;
    const shortId = req.params.shortId;

    try {
        const url = await Url.findOne({ shortId, user: userId });

        if (!url) {
            return res.status(404).json({ error: "URL not found" });
        }

        const clicks = await Click.aggregate([
            { $match: { url: url._id } },
            { $group: { _id: "$location", count: { $sum: 1 }, deviceTypes: { $push: "$deviceType" } } },
        ]);

        const locationsCount = clicks.reduce((acc, click) => {
            const country = click._id ? click._id.split(", ")[1] : "Unknown";
            acc[country] = acc[country] ? acc[country] + click.count : click.count;
            return acc;
        }, {});

        const mobileClicks = clicks.reduce((acc, click) => acc + click.deviceTypes.filter(device => device === "mobile").length, 0);
        const desktopClicks = clicks.reduce((acc, click) => acc + click.deviceTypes.filter(device => device === "desktop").length, 0);

        const io = getIo();
        io.emit("urlStatsUpdated", {
            shortLink: url.shortId,
            originalUrl: url.originalUrl,
            totalClicks: clicks.reduce((acc, click) => acc + click.count, 0),
            locationsCount,
            mobileClicks,
            desktopClicks,
        });

        return res.json({
            shortLink: url.shortId,
            originalUrl: url.originalUrl,
            totalClicks: clicks.reduce((acc, click) => acc + click.count, 0),
            locationsCount,
            mobileClicks,
            desktopClicks,
        });
    } catch (err) {
        console.error("Error fetching URL stats:", err);
        return res.status(500).json({ error: "Error fetching URL stats", details: err.message });
    }
}

module.exports = { getUrlStats };
