const Url = require('../urls/Url.model.js');
const { registerClick } = require('../clicks/click.controller.js');

// Controller for managing redirection.
const redirectUrl = async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });

    if (!url) {
      return res.status(404).json({ message: 'URL no encontrada.' });
    }
    
    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      return res.status(400).json({ message: 'La URL ha expirado.' });
    }

    await registerClick(req, res);
        res.redirect(url.originalUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al redirigir.' });
  }
};

module.exports = {
  redirectUrl,
};