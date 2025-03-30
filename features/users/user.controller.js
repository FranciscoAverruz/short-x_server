const User = require("../users/User.model.js");
const getPaginationParams = require("../../utils/pagination.js");

// GET All users **********************************************************************
async function retUsersAll(req, res) {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      return res.json({
        users: [],
        pagination: {
          totalUsers: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
      });
    }
    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      users,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error("Error retrieving users:");
    res
      .status(500)
      .json({ error: "Error retrieving users", details: "could not get Users' information" });
  }
}

// GET User per ID ********************************************************************
async function retUserById(req, res) {
  try {
    const userDoc = await User.findById(req.params.id);

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...noPasswordUser } = userDoc.toObject();

    res.status(200).json(noPasswordUser);
  } catch (err) {
    console.log("Error retrieving user by ID ");
    res.status(400).json({ error: "could not find the User" });
  }
}

// Updates User ***********************************************************************
async function updateUser(req, res) {
  try {
    const { password, urls, isAdmin, ...userData } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...noPasswordUser } = updatedUser.toObject();

    res.status(200).json(noPasswordUser);
  } catch (err) {
    console.log("Error updating the user: ");
    res.status(400).json({ error: "could not update the user's information" });
  }
}

module.exports = {
  retUsersAll,
  retUserById,
  updateUser,
};
