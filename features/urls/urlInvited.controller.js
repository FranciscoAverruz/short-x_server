const Url = require("../urls/Url.model.js");
const { v4: uuidv4 } = require("uuid");
const validator = require("validator");
const { FRONTEND_URL } = require("../../config/env.js")
const DEFAULT_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

const shortenUrl = async (req, res) => {
  const { originalUrl } = req.body;

  if (!validator.isURL(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const shortId = uuidv4().slice(0, 8);
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRATION_TIME);

  try {
    const newUrl = await Url.create({ originalUrl, shortId, expiresAt });
    const shortUrl = `${FRONTEND_URL}/${shortId}`;

    res.status(201).json({
      originalUrl: newUrl.originalUrl,
      shortId: shortId,
      shortUrl: shortUrl,
      expiresAt: newUrl.expiresAt,
    });
    
  } catch (err) {
    console.error('Error al crear la URL:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { shortenUrl };