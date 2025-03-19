const Url = require("../urls/Url.model.js");
const Click = require("../clicks/Click.model.js");
const getPaginationParams = require("../../utils/pagination.js");
const { getIo } = require("../../sockets/socket.js");
const { FRONTEND_URL } = require("../../config/env.js")

async function getUserStats(req, res) {
    const userId = req.user.id;
    const { page, limit, skip } = getPaginationParams(req);

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

        const urls = await Url.find({ user: userId })
            .populate("customDomain")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalPages = Math.ceil(totalUrls / limit);

        // generates stats for each URL
        const stats = await Promise.all(
            urls.map(async (url) => {
                const totalClicks = await Click.countDocuments({ url: url._id });

                return {
                    shortLink: url.shortId,
                    originalUrl: url.originalUrl,
                    totalClicks: totalClicks,
                    id: url._id,
                    expiresAt: url.expiresAt,
                    customDomain: url.customDomain ? url.customDomain.domain : FRONTEND_URL,
                };
            })
        );

        const io = getIo();
        io.emit("userStatsUpdated", {
            stats,
            pagination: {
                totalUrls,
                totalPages,
                currentPage: page,
                limit,
            },
        });

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