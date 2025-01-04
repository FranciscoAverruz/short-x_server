const verifyOwnership = (req, res, next) => {
  console.log('req.user.id verifyOwnership:', req.user.id);
  console.log('req.params.id verifyOwnership:', req.params.id);
  console.log('req.user.isAdmin verifyOwnership:', req.user.isAdmin);

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
