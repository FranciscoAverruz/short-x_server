const Url = require('../urls/Url.model.js');
// const { nanoid } = require('nanoid');
import { nanoid } from 'nanoid';
const validator = require('validator');
const DEFAULT_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// Function to create a short URL for non-registered users.
const shortenUrl = async (req, res) => {
  const { originalUrl } = req.body;

  if (!validator.isURL(originalUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const shortId = nanoid(8);
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRATION_TIME); // expires within 24 horas

  try {
    const newUrl = await Url.create({ originalUrl, shortId, expiresAt });
    res.status(201).json(newUrl);
  } catch (err) {
    console.error('Error al crear la URL:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { shortenUrl };