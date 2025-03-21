const Url = require('../urls/Url.model'); 
const CustomDomain = require('../customDomains/CustomDomain.model');

const redirectUrl = async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const requestHost = req.hostname;

    console.log("<<--------- shortId --------->>", shortId)
    console.log("<<--------- requestHost ----->>", requestHost)

    let url = await Url.findOne({ shortId }).populate("customDomain");

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    if (url.customDomain) {
      if (url.customDomain.domain === requestHost) {
        return res.redirect(301, url.originalUrl);
      } else {
        return res.status(403).json({ message: "Este dominio no tiene permiso para redirigir esta URL." });
      }
    }

    return res.redirect(301, url.originalUrl);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al redirigir." });
  }
};

module.exports = { redirectUrl };