const Url = require('../urls/Url.model');
const { registerClick } = require("../clicks/click.controller.js");
let clickCounter = {};

const redirectUrl = async (req, res) => {
  console.log("<<<-------- antes de redirección... -------->>>");
  try {
    const shortId = req.params.shortId;
    let requestOrigin = req.get('origin') || req.get('referer') || null;

    console.log("<<<--- shortId recibido --->>>", shortId);  
    console.log("<<<--- Origin recibido --->>>", requestOrigin);


    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    let url = await Url.findOne({ shortId }).populate("customDomain");

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    console.log("<<<--- URL encontrada --->>>", url);
    if (!clickCounter[shortId]) {
      clickCounter[shortId] = 0;
    }
    clickCounter[shortId] += 1;

    await registerClick(req, url);
    console.log("<<<--- Clic registrado --->>>");

    if (url.customDomain) {
      
      const customDomainBase = new URL(url.customDomain.domain).hostname;
      const requestBaseDomain = requestOrigin ? new URL(requestOrigin).hostname : null;
      if (!requestBaseDomain) {
        console.log("<<<--- No hay baseDomain, redirigiendo a originalUrl --->>>");
           return res.redirect(302, url.originalUrl);
      }

      if (customDomainBase !== requestBaseDomain) {
        return res.status(403).json({ message: "Este dominio no tiene permiso para redirigir esta URL." });
      }
    }
    console.log(`<<<-------- Redirigiendo a: ${url.originalUrl} -------->>>`);
    return res.redirect(302, url.originalUrl);

  } catch (error) {
    return res.status(500).json({ message: "Error al redirigir." });
  }
};

module.exports = { redirectUrl };