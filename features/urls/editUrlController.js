const mongoose = require("mongoose");
const Url = require("./Url.model.js");

const updateUrl = async (req, res) => {
  try {
    const { originalUrl, shortId, customDomain, id } = req.body;

    let domainToUpdate = customDomain

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        errorCode: "INVALID_ID",
        message: "El ID proporcionado no es válido.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(customDomain)) {
      domainToUpdate= null
    }

    const existingUrl = await Url.findOne({
      shortId,
      customDomain: domainToUpdate,
      _id: { $ne: id },
    });

    if (existingUrl) {
      return res.status(400).json({
        errorCode: "DUPLICATE_URL",
        message: "El shortId y customDomain ya están en uso por otra URL.",
      });
    }

    const updatedUrl = await Url.findByIdAndUpdate(
      id,
      { originalUrl, shortId, customDomain: domainToUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedUrl) {
      return res.status(404).json({
        errorCode: "URL_NOT_FOUND",
        message: "No se encontró la URL solicitada.",
      });
    }

    res.json(updatedUrl);
  } catch (error) {
    console.error("Error en updateUrl:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        errorCode: "VALIDATION_ERROR",
        message: "Los datos proporcionados no son válidos.",
        details: error.errors,
      });
    }

    res.status(500).json({
      errorCode: "SERVER_ERROR",
      message: "Error interno al actualizar la URL.",
    });
  }
};

module.exports = { updateUrl };