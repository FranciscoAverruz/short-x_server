const axios = require("axios");
const MobileDetect = require("mobile-detect");
const Click = require("../clicks/Click.model.js");
const Url = require("../urls/Url.model.js");

async function registerClick(req, res) {
  const shortId = req.params.shortId;
  const userAgent = req.headers["user-agent"];
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ipToCheck = (ip === "::1" || ip === "127.0.0.1") ? "8.8.8.8" : ip;

  const md = new MobileDetect(userAgent);
  const isMobile = md.mobile() !== null;

  let location = req.body.location;

  // Tries to fetch location if it's not provided
  if (!location) {
    try {
      const response = await axios.get(`https://ipapi.co/${ipToCheck}/json/`);

      if (response.data && response.data.city && response.data.country_name) {
        location = `${response.data.city}, ${response.data.country_name}`;
      } else {
        location = "Location not found";
      }
    } catch (err) {
      console.error("Error fetching location:", err);
      location = "Location not found";
    }
  }

  try {
    // Finds URL by shortId
    const url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({
        error: "URL_NOT_FOUND",
        message: "The short URL was not found in the database.",
      });
    }

    const clickData = {
      url: url._id,
      ip: ip,
      userAgent: userAgent,
      location: location,
      deviceType: isMobile ? "mobile" : "desktop",
    };

    // Creates a new Click entry
    const newClick = new Click(clickData);
    await newClick.save();
    console.log("✅ Click successfully registered");

  } catch (err) {
    console.error("Error saving click:", err);

    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "An error occurred while saving the click. Please try again later.",
    });
  }
}

module.exports = { registerClick };
