const axios = require("axios");
const MobileDetect = require("mobile-detect");
const Click = require("../clicks/Click.model.js");
const Url = require("../urls/Url.model.js");

async function registerClick(req, res) {
  const shortId = req.params.shortId;
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;

  // detects the type of device
  const md = new MobileDetect(userAgent);
  const isMobile = md.mobile() !== null;

  // Verify if the location is passed from the frontend; otherwise, fetch it.
  let location = req.body.location;

  if (!location) {
    try {
      const ipData = await axios.get(`http://ip-api.com/json/${ip}`);
      if (ipData.data && ipData.data.city && ipData.data.country) {
        location = `${ipData.data.city}, ${ipData.data.country}`;
      } else {
        location = 'Location not found';
      }
    } catch (err) {
      console.log('Error fetching location:', err);
      location = 'Location not found';
    }
  }

  const url = await Url.findOne({ shortId });

  if (!url) {
    return res.status(404).json({ error: "URL not found" });
  }

  const clickData = {
    url: url._id,
    ip: ip,
    userAgent: userAgent,
    location: location,
    deviceType: isMobile ? 'mobile' : 'desktop',
  };

  try {
    // Create and save the click in the database.
    const newClick = new Click(clickData);
    await newClick.save();

    return res.status(200).json({ message: "Click registered successfully" });
  } catch (err) {
    console.error('Error saving click:', err);
    return res.status(500).json({ error: 'Error saving click', details: err.message });
  }
}

module.exports = { registerClick };