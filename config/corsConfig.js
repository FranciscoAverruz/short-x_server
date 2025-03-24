const cors = require('cors');
const CustomDomain = require('../features/customDomains/CustomDomain.model');
const { FRONTEND_URL, NODE_ENV } = require('../config/env.js');

let allowedDomains = new Set();
let lastUpdate = 0;
const UPDATE_INTERVAL = 10 * 60 * 1000;

const loadAllowedDomainsIfNeeded = async () => {
  if (Date.now() - lastUpdate < UPDATE_INTERVAL) return;

  try {
    const customDomains = await CustomDomain.find({ verified: true });
    allowedDomains = new Set(customDomains.map(domain => domain.domain));

    if (FRONTEND_URL) allowedDomains.add(FRONTEND_URL);
    console.log("<<<<------- allowedDomains ------->>>>", allowedDomains);

    lastUpdate = Date.now();
  } catch (error) {
    console.error("Error al obtener dominios personalizados:", error);
  }
};

const corsOptions = async (req, callback) => {
  await loadAllowedDomainsIfNeeded();

  const origin = req.header("Origin");

  const allowedMethods = ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'];
  const allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];

  if (NODE_ENV === "development" || !origin || allowedDomains.has(origin) || origin.includes("localhost")) {
    return callback(null, {
      origin: true,
      credentials: true,
      methods: allowedMethods,
      allowedHeaders: allowedHeaders,
    });
  }

  return callback(new Error("Not allowed by CORS"));
};

module.exports = cors(corsOptions);
