const verifyOwnership = (req, res, next) => {

  if (req.user && req.user.isAdmin) {
    return next();
  }

  if (req.user && req.user.id === req.params.id) {
    return next();
  }

  return res
    .status(403)
    .json({ message: "You are not authorized to complete this action" });
};

module.exports = verifyOwnership;
