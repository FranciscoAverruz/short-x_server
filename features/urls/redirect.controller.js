const Url = require('../urls/Url.model'); 

const redirectUrl = async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const requestOrigin = req.get('origin');

    console.log("<<--------- shortId --------->>", shortId)
    console.log("<<--------- requestOrigin ----->>", requestOrigin)

    let url = await Url.findOne({ shortId }).populate("customDomain");

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    if (url.customDomain) {
      if (url.customDomain.domain === requestOrigin) {
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
