const axios = require("axios");
const MobileDetect = require("mobile-detect");
const Click = require("../clicks/Click.model.js");
const Url = require("../urls/Url.model.js");

async function registerClick(req, res) {
  const shortId = req.params.shortId;
  const userAgent = req.headers["user-agent"];
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ipToCheck = ip === "::1" || ip === "127.0.0.1" ? "8.8.8.8" : ip;


  console.log("Registrando clic...");
  console.log("shortId:", shortId);
  console.log("IP:", ip);
  console.log("User-Agent:", userAgent);

  const md = new MobileDetect(userAgent);
  const isMobile = md.mobile() !== null;

  let location = req.body.location;

  if (!location) {
    try {
      const response = await axios.get(`https://ipapi.co/${ipToCheck}/json/`);

      if (response.data && response.data.city && response.data.country_name) {
        location = `${response.data.city}, ${response.data.country_name}`;
      } else {
        location = "Location not found";
      }
    } catch (err) {
      console.error("Error fetching location:");
      location = "Location not found";
    }
  }

  try {
    const url = await Url.findOne({ shortId });

    if (!url) {
      console.error("no hay URL:");
      return res.status(404).json({ message: "URL no encontrada" });
    }

    const clickData = {
      url: url._id,
      ip: ip,
      userAgent: userAgent,
      location: location,
      deviceType: isMobile ? "mobile" : "desktop",
    };

    const newClick = new Click(clickData);
    await newClick.save();

    return res.status(200).json({ message: "Click registrado exitosamente" });
  } catch (err) {
    console.error("Error saving click:", err);
    return res.status(500).json({ message: "Error al registrar el clic" });
  }
}

module.exports = { registerClick };
