const axios = require("axios");
const MobileDetect = require("mobile-detect");
const Click = require("../clicks/Click.model.js");
const Url = require("../urls/Url.model.js");

async function registerClick(req, res) {
  console.log("<<<--------- Iniciando registro de click --------->>>")
  const shortId = req.params.shortId;
  const userAgent = req.headers["user-agent"];
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ipToCheck = (ip === "::1" || ip === "127.0.0.1") ? "8.8.8.8" : ip;

 console.log("<<<--------- shortId --------->>>", shortId)
 console.log("<<<--------- userAgent ------->>>", userAgent)
 console.log("<<<--------- ip -------------->>>", ip)
 console.log("<<<--------- ipToCheck ------->>>", ipToCheck)


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
      console.error("Error fetching location:", err);
      location = "Location not found";
    }
  }

  try {
    const url = await Url.findOne({ shortId });

    if (!url) {
      console.error("no hay URL:");
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
    console.log("Click successfully registered");

  } catch (err) {
    console.error("Error saving click:", err);
  }
}

module.exports = { registerClick };