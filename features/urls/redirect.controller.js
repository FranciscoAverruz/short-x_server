const Url = require("../urls/Url.model");
const { registerClick } = require("../clicks/click.controller.js");

const redirectUrl = async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const fullRequestUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
    let requestOrigin = req.get("origin") || req.get("referer") || fullRequestUrl;

    // cache configuration
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    let url = await Url.findOne({ shortId }).populate("customDomain");

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    // custom Domain validation
    if (url.customDomain) {
      const customDomainBase = new URL(url.customDomain.domain).hostname;
      const requestBaseDomain = requestOrigin ? new URL(requestOrigin).hostname : null;
      const backendBaseDomain = new URL(process.env.BACKEND_URL).hostname;

      if (!requestBaseDomain || (requestBaseDomain !== customDomainBase && requestBaseDomain !== backendBaseDomain)) {
        return res.status(403).json({
          message: "Este dominio no tiene permiso para redirigir esta URL.",
        });
      }
    }

    // Register click asynchronously
    registerClick(req)
      .then(() => console.log("<<<------ Click registrado correctamente ------>>>"))
      .catch((err) => console.error("<<<------ Error al registrar el clic: ------>>>"));

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error("Error en la redirección:");
    return res.status(500).json({ message: "Error al redirigir." });
  }
};

module.exports = { redirectUrl };
