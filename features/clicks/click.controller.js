const axios = require("axios");
const MobileDetect = require("mobile-detect");
const Click = require("../clicks/Click.model.js");
const Url = require("../urls/Url.model.js");

async function registerClick(req) {
  try {
    const shortId = req.params.shortId;
    const userAgent = req.headers["user-agent"];
    let ip = req.headers["x-forwarded-for"];
    if (ip) {
      ip = ip.split(",")[0];
    } else {
      ip = req.connection.remoteAddress;
    }

    if (ip === "127.0.0.1" || ip === "::1") {
      ip = "8.8.8.8";
    }

    console.log("Registrando clic...");
    console.log("shortId:", shortId);
    console.log("IP:", ip);
    console.log("User-Agent:", userAgent);

    const md = new MobileDetect(userAgent);
    const isMobile = md.mobile() !== null;

    let location = req.body?.location;

    if (!location) {
      try {
        const response = await axios.get(`https://ipapi.co/${ip}/json/`);

        if (response.data?.city && response.data?.country_name) {
          location = `${response.data.city}, ${response.data.country_name}`;
        } else {
          location = "Location not found";
        }
      } catch (err) {
        console.error("Error fetching location:", err);
        location = "Location not found";
      }
    }

    const url = await Url.findOne({ shortId });

    if (!url) {
      console.error("URL no encontrada.");
      return Promise.reject("URL no encontrada.");
    }

    const clickData = {
      url: url._id,
      ip,
      userAgent,
      location,
      deviceType: isMobile ? "mobile" : "desktop",
    };

    const newClick = new Click(clickData);
    await newClick.save();

    return Promise.resolve("Click registrado exitosamente");
  } catch (err) {
    console.error("Error saving click:", err);
    return Promise.reject(err);
  }
}

module.exports = { registerClick };
