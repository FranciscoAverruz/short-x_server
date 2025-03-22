const cors = require("cors");
const CustomDomain = require("../features/customDomains/CustomDomain.model");
const { FRONTEND_URL, NODE_ENV } = require("../config/env.js");

let allowedDomains = new Set();

const loadAllowedDomains = async () => {
  if (NODE_ENV !== "production") return;

  try {
    console.log("Cargando dominios personalizados...");
    const customDomains = await CustomDomain.find({ verified: true });
    allowedDomains = new Set(customDomains.map(domain => domain.domain));

    if (FRONTEND_URL) {
      allowedDomains.add(FRONTEND_URL);
    }

    console.log("Dominios permitidos:", [...allowedDomains]);
  } catch (error) {
    console.error("Error al obtener los dominios personalizados:", error);
  }
};

if (NODE_ENV === "production") {
  setInterval(loadAllowedDomains, 10 * 60 * 1000);
  loadAllowedDomains();
}

const corsOptions = cors({
  origin: (origin, callback) => {
    if (NODE_ENV === "development") {
      callback(null, true);
    } else if (NODE_ENV === "production") {
      if (!origin || allowedDomains.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

module.exports = corsOptions;