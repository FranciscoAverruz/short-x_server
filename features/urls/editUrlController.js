const mongoose = require("mongoose");
const Url = require("./Url.model.js");

const updateUrl = async (req, res) => {
  try {
    const { originalUrl, shortId, customDomain, id } = req.body;

    let domainToUpdate = customDomain

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        errorCode: "INVALID_ID",
        message: "Invalid ID.",
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
        message: "ShortId and customDomain already in use",
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
        message: "URL not found",
      });
    }

    res.json(updatedUrl);
  } catch (error) {
    console.error("Error in updateUrl:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        errorCode: "VALIDATION_ERROR",
        message: "Invalid data",
        details: error.errors,
      });
    }

    res.status(500).json({
      errorCode: "SERVER_ERROR",
      message: "Internal Error updating URL.",
    });
  }
};

module.exports = { updateUrl };