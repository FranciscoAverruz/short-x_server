const Url = require('../urls/Url.model');

const redirectUrl = async (req, res) => {
  try {
    const shortId = req.params.shortId;

    let requestOrigin = req.get('origin') || req.get('referer') || null;

    console.log("<<--------- shortId --------->>", shortId);
    console.log("<<--------- requestOrigin ----->>", requestOrigin || "Sin origen");

    let url = await Url.findOne({ shortId }).populate("customDomain");

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    if (url.customDomain) {
      const customDomainBase = new URL(url.customDomain.domain).hostname;
      const requestBaseDomain = requestOrigin ? new URL(requestOrigin).hostname : null;

      console.log("<<--------- Custom Domain --------->>", customDomainBase);
      console.log("<<--------- Request Base Domain --------->>", requestBaseDomain || "Sin origen");

      if (!requestBaseDomain) {
        console.log("⚠️ Sin origen en la solicitud, permitiendo redirección.");
        return res.redirect(301, url.originalUrl);
      }

      if (customDomainBase !== requestBaseDomain) {
        return res.status(403).json({ message: "Este dominio no tiene permiso para redirigir esta URL." });
      }
    }

    return res.redirect(301, url.originalUrl);

  } catch (error) {
    console.error("Error en redirección:", error);
    return res.status(500).json({ message: "Error al redirigir." });
  }
};

module.exports = { redirectUrl };
