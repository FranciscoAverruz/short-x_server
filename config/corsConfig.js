const cors = require("cors");
const CustomDomain = require("../features/customDomains/CustomDomain.model");

const getAllowedDomains = async () => {
  try {
    const customDomains = await CustomDomain.find({ verified: true });
    const allowedDomains = customDomains.map(domain => domain.domain);

    allowedDomains.push(process.env.CLIENT_URL);
    allowedDomains.push('https://franciscoaverruz.netlify.app');

    return allowedDomains;
  } catch (error) {
    console.error("Error al obtener los dominios personalizados:", error);
    return [];
  }
};

const corsOptions = async (req, res, next) => {
  try {
    const allowedDomains = await getAllowedDomains();

    const corsConfig = cors({
      origin: (origin, callback) => {
        if (allowedDomains.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: "Content-Type, Authorization",
    });

    corsConfig(req, res, next);
  } catch (error) {
    console.error("Error al configurar CORS:", error);
    next(error);
  }
};

module.exports = corsOptions;
