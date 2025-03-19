const cors = require("cors");
const express = require("express");
const YAML = require("yamljs");
const http = require("http");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const dotenv = require('dotenv').config();
const swaggerUI = require("swagger-ui-express");

const { initSocket } = require("./sockets/socket.js");

const sendEmail = require("./features/email/sendEmail.controller.js");
const verifyAuth = require("./middlewares/verifyAuth.js");
const verifyAdmin = require("./middlewares/verifyAdmin.js");
const createAdmin = require("./features/admin/createAdmin.controller.js");

const auth = require("./features/auth/auth.routes.js");
const user = require("./features/users/user.routes.js");
const urlInvited = require("./features/urls/urlInvited.routes.js");
const adminRoute = require("./features/admin/admin.routes.js");
const urlRedirect = require("./features/urls/urlRedirect.routes.js");
const stripeRoutes = require("./features/subscriptions/stripe.routes.js");
const subscriptionRoutes = require("./features/subscriptions/subscription.routes.js");
const deleteAccountRoutes = require("./features/users/deleteAccount.routes.js");
// const corsOptions = require("./config/corsConfig.js"); // Importamos el middleware de CORS
// const customDomainRoutes = require("./features/customDomains/customDomain.routes.js");

const stripe = require("./config/stripe");

app.use(express.json());

// app.use(corsOptions);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: "Content-Type, Authorization",
  })
);

// *** SWAGGER IMPLEMENTATION *****************************************************
const openApiDocument = path.resolve(__dirname, "openApi/output.yaml");
const swaggerDocument = YAML.load(openApiDocument);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// *** BD CONECTION ***************************************************************
const port = process.env.PORT || 5000;
const mongoDB = process.env.MONGO_URI;

mongoose
  .connect(mongoDB)
  .then(() => {
    console.log("mongoose connected");
    const server = http.createServer(app);

    initSocket(server);
    server.listen(port, () => {
      console.log("Server running on port " + port);
    });

    // createAdmin executed after conexion is set ***********************************
    createAdmin().then(() => {
      console.log("Admin creation script executed");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

//*** Public Routes ******************************************************************
app.use("/api/invited", urlInvited);
app.use("/api", auth);
app.use("/", urlRedirect); // Redirection URL

//*** Private Routes *****************************************************************
app.use("/api/user", verifyAuth, user); // Users
app.use("/api/admin-user", verifyAuth, verifyAdmin, user);
app.use("/api/admin", verifyAdmin, adminRoute); // Admin

app.use("/api/subscription", subscriptionRoutes);

//*** Stripe routes ******************************************************************
app.use("/api", stripeRoutes);

//*** Account deletion through github workflow ***************************************
app.use("/", deleteAccountRoutes);

app.post("/api/send-email", sendEmail);

process.on("SIGINT", () => {
  console.log("Shutting down the server...");
  server.close(() => {
    console.log("HTTP server closed.");
    mongoose.connection.close(() => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});