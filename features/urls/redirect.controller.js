const Url = require('../urls/Url.model'); 
const CustomDomain = require('../customDomains/CustomDomain.model');

const redirectUrl = async (req, res) => {
  try {
    const shortId = req.params.shortId;
    let url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    const customDomain = await CustomDomain.findOne({ domain: req.hostname });

    if (customDomain && url.customDomain) {
      return res.redirect(url.originalUrl);
    } else {
      return res.redirect(url.originalUrl);
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al redirigir." });
  }
};

module.exports = { redirectUrl };