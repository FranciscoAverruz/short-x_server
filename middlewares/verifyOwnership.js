const verifyOwnership = (req, res, next) => {

  if (req.user && req.user.isAdmin) {
    console.log('User is an admin. Access granted.');
    return next();
  }

  if (req.user && req.user.id === req.params.id) {
    console.log('User is the owner. Access granted.');
    return next();
  }

  return res
    .status(403)
    .json({ message: "You are not authorized to complete this action" });
};

module.exports = verifyOwnership;
