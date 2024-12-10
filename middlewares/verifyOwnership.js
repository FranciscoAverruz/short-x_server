const verifyOwnership = (req, res, next) => {
  if (req.user && req.user.id === req.params.id) {
    return next();
  }
  return res
    .status(403)
    .json({ message: "No tienes permiso para realizar esta acción" });
};

module.exports = verifyOwnership;
