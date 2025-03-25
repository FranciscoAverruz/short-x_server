const Url = require("../urls/Url.model");
// let clickCounter = {};

const redirectUrl = async (req, res) => {
  try {
    console.log("<<<<------- Headers recibidos: ------->>>>", req.headers);

    const shortId = req.params.shortId;
    const protocol = req.protocol;
    const host = req.headers.host;
    // let requestOrigin = req.get("origin") || req.get("referer") || null;
    let requestOrigin = req.get("origin") || req.get("referer") || `${protocol}://${host}`;
    console.log("<<<<------------ requestOrigin ------------>>>>", requestOrigin)

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");

    let url = await Url.findOne({ shortId }).populate("customDomain");

    if (!url) {
      return res.status(404).json({ message: "URL no encontrada." });
    }

    // if (!clickCounter[shortId]) {
    //   clickCounter[shortId] = 0;
    // }
    // clickCounter[shortId] += 1;

    if (url.customDomain) {
      const customDomainBase = new URL(url.customDomain.domain).hostname;
      const requestBaseDomain = requestOrigin
        ? new URL(requestOrigin).hostname
        : null;
      if (!requestBaseDomain) {
        return res.redirect(302, url.originalUrl);
      }

      console.log("****** Custom Domain Base:", customDomainBase);
      console.log("****** Request Base Domain:", requestBaseDomain);

      if (customDomainBase !== requestBaseDomain) {
        return res
          .status(403)
          .json({
            message: "Este dominio no tiene permiso para redirigir esta URL.",
          });
      }
    }
    return res.redirect(302, url.originalUrl);
  } catch (error) {
    return res.status(500).json({ message: "Error al redirigir." });
  }
};

module.exports = { redirectUrl };
