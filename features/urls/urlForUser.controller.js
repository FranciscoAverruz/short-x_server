const Url = require('../urls/Url.model.js');
const User = require('../users/User.model.js');
const { v4: uuidv4 } = require('uuid');
const { validateUrl, validateCustomIdAvailability } = require('../../utils/validateShortIds.js');

const shortenUrlForUser = async (req, res) => {
  const { originalUrl, customId } = req.body;
  const userId = req.user.id;

  const urlValidation = validateUrl(originalUrl);
  if (urlValidation.error) {
    return res.status(400).json({ error: urlValidation.error });
  }

  const customIdValidation = await validateCustomIdAvailability(customId);
  if (customIdValidation.error) {
    return res.status(400).json({ error: customIdValidation.error });
  }

  try {
    const newUrl = await Url.create({
      originalUrl,
      shortId: customId || uuidv4().slice(0, 8),
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
