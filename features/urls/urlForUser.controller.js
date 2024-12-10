const Url = require('../urls/Url.model.js');
const User = require('../users/User.model.js');
const { nanoid } = require('nanoid');
const { validateUrl, validateCustomIdAvailability } = require('../../utils/validateShortIds.js');

// Function ti shorten the URL
const shortenUrlForUser = async (req, res) => {
  const { originalUrl, customId } = req.body;
  const userId = req.user.id;

  // 1. vaidate if it is a valid URL
  const urlValidation = validateUrl(originalUrl);
  if (urlValidation.error) {
    return res.status(400).json({ error: urlValidation.error });
  }

  // 2. validate if customId is available
  const customIdValidation = await validateCustomIdAvailability(customId);
  if (customIdValidation.error) {
    return res.status(400).json({ error: customIdValidation.error });
  }

  try {
    // 3. create theh new shortened URL
    const newUrl = await Url.create({
      originalUrl,
      shortId: customId || nanoid(8),
      user: userId,
    });

    await User.findByIdAndUpdate(userId, { $push: { urls: newUrl._id } }, { new: true });

    return res.status(201).json({
      message: "URL shortened successfully", 
      data: newUrl,
    });
  } catch (err) {

    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error', 
        details: err.errors,
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }
};

module.exports = { shortenUrlForUser };